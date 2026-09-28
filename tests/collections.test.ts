import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { before, test } from "node:test";
import { collectionRepository } from "../app/data/collection-repository";
import { completionRepository } from "../app/data/completion-repository";
import { readBackupPayload } from "../app/data/backup-repository";
import { ENTITY_STORES, openDatabase, requestResult, runTransaction } from "../app/data/indexed-db";
import { collectionEntry, selectCollection } from "../app/core/collections";
import { getLocalDateKey } from "../app/core/date";
import { matchesRecordFilters, toggleSelection } from "../app/core/record-filters";
import { getDefaultRecordCategory, getRecordIcon } from "../app/core/record-categories";
import { discoveryCatalog } from "../app/features/discovery/discovery-catalog";
import type { DevotionalItem } from "../app/core/types";

const legacy: DevotionalItem = {
  ...discoveryCatalog[0].item, id: "same-id", name: "Personal text",
  sortOrder: 17, createdAt: "2020-01-01", updatedAt: "2020-01-02",
};
const ref = { moduleId: "dhikr", itemId: legacy.id } as const;
const prayerRef = { moduleId: "prayers", itemId: legacy.id } as const;

before(async () => {
  const request = indexedDB.open("zikirlerim", 3);
  request.onupgradeneeded = () => {
    for (const name of Object.values(ENTITY_STORES)) request.result.createObjectStore(name, { keyPath: "id" });
    const completions = request.result.createObjectStore("completions", { keyPath: "key" });
    completions.createIndex("localDate", "localDate");
    completions.createIndex("itemId", "itemId");
    request.transaction!.objectStore("dhikrs").put(legacy);
    request.transaction!.objectStore("prayers").put({ ...legacy, liked: false });
    completions.put({ key: "dhikr:same-id:2020-01-01", itemType: "dhikr", itemId: legacy.id, localDate: "2020-01-01", completedAt: "2020-01-01" });
  };
  (await requestResult(request)).close();
});

test("upgrade preserves pre-v5 records, order, history and explicit membership", async () => {
  assert.equal((await openDatabase()).version, 9);
  const backup = await readBackupPayload();
  const dhikr = backup.entities.dhikr[0];
  assert.equal("name" in dhikr && dhikr.name, legacy.name);
  assert.equal(dhikr.createdAt, legacy.createdAt);
  assert.equal(dhikr.sortOrder, 17);
  assert.equal(dhikr.virdSortOrder, 17);
  assert.equal(dhikr.inVirds, true);
  assert.equal(dhikr.liked, true);
  assert.equal(backup.entities.prayers[0].liked, false);
  assert.equal(backup.completions.length, 1);
});

test("same ID in separate legacy stores stays distinct", async () => {
  const entries = await collectionRepository.load();
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 2);
  assert.equal(selectCollection(entries, "virds").length, 1);
});

test("heart and plus are independent and never replace customized content", async () => {
  const template = { ...discoveryCatalog[0].item, id: "new-template" };
  const target = { moduleId: "dhikr", itemId: template.id } as const;
  const added = await collectionRepository.setMembership(target, "virds", true, template);
  assert.equal(added.inVirds, true);
  assert.equal(added.liked, false);
  await collectionRepository.patch(target, { name: "My title" });
  const liked = await collectionRepository.setMembership(target, "favorites", true, template);
  assert.equal("name" in liked && liked.name, "My title");
  assert.equal(liked.inVirds, true);
  await completionRepository.set("dhikr", template.id, "2026-09-22", true);
  const unliked = await collectionRepository.setMembership(target, "favorites", false);
  assert.equal(unliked.inVirds, true);
  assert.equal((await completionRepository.loadKeys("2026-09-22")).has("dhikr:new-template"), true);
});

test("cross-store order changes preserve content and the other collection order", async () => {
  await collectionRepository.saveOrder([prayerRef, ref], "virds");
  const entries = await collectionRepository.load();
  const dhikr = entries.find((entry) => entry.id === "dhikr:same-id")!.item;
  assert.equal(dhikr.virdSortOrder, 1);
  assert.equal(dhikr.sortOrder, 17);
  assert.equal("name" in dhikr && dhikr.name, legacy.name);
  const snapshot = await readBackupPayload();
  await assert.rejects(collectionRepository.saveOrder([ref, { moduleId: "poetry", itemId: "missing" }], "favorites"));
  assert.deepEqual(await readBackupPayload(), snapshot);
});

test("operation exceptions abort already queued writes", async () => {
  const snapshot = await readBackupPayload();
  await assert.rejects(runTransaction("dhikrs", "readwrite", (transaction) => {
    transaction.objectStore("dhikrs").put({ ...legacy, name: "Must not persist" });
    throw new Error("Injected write failure");
  }));
  assert.deepEqual(await readBackupPayload(), snapshot);
});

test("duplicate creates fail without overwriting existing data", async () => {
  const snapshot = await readBackupPayload();
  await assert.rejects(collectionRepository.create({ ...legacy, name: "Duplicate" }));
  assert.deepEqual(await readBackupPayload(), snapshot);
});

test("collection order is deterministic and completion dates use local calendar", () => {
  const a = collectionEntry("dhikr", { ...legacy, inVirds: true }, "virds");
  const b = collectionEntry("prayers", { ...legacy, inVirds: true }, "virds");
  assert.deepEqual(selectCollection([b, a], "virds").map((entry) => entry.id), ["dhikr:same-id", "prayers:same-id"]);
  assert.equal(getLocalDateKey(new Date(2026, 8, 22, 0, 1)), "2026-09-22");
});

test("record filters combine selected types with selected contexts without mutating input", () => {
  const item = { ...legacy, bagCategories: ["poetry" as const], contexts: ["morning" as const] };
  assert.equal(matchesRecordFilters(item, "dhikr", { categories: [], contexts: [] }), true);
  assert.equal(matchesRecordFilters(item, "dhikr", { categories: ["prayers", "poetry"], contexts: ["morning", "relief"] }), true);
  assert.equal(matchesRecordFilters(item, "dhikr", { categories: ["poetry"], contexts: ["relief"] }), false);
  assert.equal(matchesRecordFilters(item, "dhikr", { categories: ["dhikr"], contexts: [] }), false);
  const selected = Object.freeze(["poetry"]);
  assert.deepEqual(toggleSelection(selected, "poetry"), []);
  assert.deepEqual(toggleSelection(selected, "prayers"), ["poetry", "prayers"]);
  assert.deepEqual(selected, ["poetry"]);
});

test("legacy surah category is identical in cards and both editor entry points", () => {
  const item = { ...legacy, name: "Nâs Sûresi", source: null };
  assert.equal(getDefaultRecordCategory(item, "memorization"), "surahs");
  assert.equal(getRecordIcon(item, "memorization"), "surah");
  assert.equal(getDefaultRecordCategory({ ...item, bagCategories: ["poetry"] }, "memorization"), "poetry");
  assert.equal(getDefaultRecordCategory({ ...item, name: "My text" }, "memorization"), "memorization");
});

test("legacy books join collections without changing identity or completion", async () => {
  const book = { id: "legacy-book", title: "Old book", author: null, details: null, sortOrder: 12, createdAt: "2020-01-01", updatedAt: "2020-01-01", targetCount: 10, targetUnit: "custom", targetUnitLabel: "sayfa" };
  await runTransaction("books", "readwrite", tx => { tx.objectStore("books").put(book); });
  await completionRepository.set("books", book.id, "2026-09-28", true);
  const entries = await collectionRepository.load();
  assert.ok(selectCollection(entries, "favorites").some(entry => entry.id === "books:legacy-book"));
  const reference = { moduleId: "books", itemId: book.id } as const;
  await collectionRepository.setMembership(reference, "virds", true);
  await collectionRepository.setMembership(reference, "favorites", false);
  await collectionRepository.saveOrder([reference, ref], "virds");
  const stored = await runTransaction("books", "readonly", tx => requestResult(tx.objectStore("books").get(book.id)));
  assert.equal(stored.title, book.title);
  assert.equal(stored.createdAt, book.createdAt);
  assert.equal(stored.sortOrder, 12);
  assert.equal(stored.virdSortOrder, 0);
  assert.equal(stored.inVirds, true);
  assert.equal(stored.liked, false);
  assert.ok((await completionRepository.loadKeys("2026-09-28")).has("books:legacy-book"));
});

test("book assets and reading notes persist; replacement resets only that file's progress", async () => {
  const { saveBookWithAsset, loadReader, saveReaderState, setLastBook } = await import("../app/data/reader-repository");
  const { defaultReaderState } = await import("../app/core/reader");
  const book = { id: "file-book", title: "PDF", author: null, details: null, sortOrder: 1, createdAt: "2026", updatedAt: "2026", targetCount: null, targetUnit: "custom" as const, targetUnitLabel: null, assetId: "asset-one", format: "pdf" as const };
  await saveBookWithAsset(book, new File(["%PDF-1.7\n"], "test.pdf"));
  await setLastBook(book.id);
  const state = { ...defaultReaderState(book.id), location: { page: 3, zoom: 1.5, scroll: 0.4 }, annotations: [{ id: "note", text: "Selected text", note: "Remember", page: 3, rects: [{ x: 0.1, y: 0.2, width: 0.5, height: 0.1 }] }] };
  await saveReaderState(state);
  const loaded = await loadReader();
  assert.equal(loaded?.asset.name, "test.pdf");
  assert.deepEqual(loaded?.state, state);
  const backup = await readBackupPayload();
  assert.deepEqual(backup.readerStates?.find(s => s.id === book.id), state);
  assert.ok(!JSON.stringify(backup).includes("%PDF-1.7"));
  await saveBookWithAsset({ ...book, assetId: "asset-two" }, new File(["%PDF-1.7\nsecond"], "new.pdf"));
  assert.deepEqual((await loadReader())?.state.location, {});
  assert.equal(await runTransaction("bookAssets", "readonly", tx => requestResult(tx.objectStore("bookAssets").get("asset-one"))), undefined);
});

test("failed file writes roll back book metadata and malformed uploads create no records", async () => {
  const { saveBookWithAsset } = await import("../app/data/reader-repository");
  const book = { id: "failed-book", title: "Failed", author: null, details: null, sortOrder: 1, createdAt: "2026", updatedAt: "2026", targetCount: null, targetUnit: "custom" as const, targetUnitLabel: null, assetId: "failed-asset", format: "pdf" as const };
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore["put"]>) {
    if (this.name === "bookAssets") throw new DOMException("Storage full", "QuotaExceededError");
    return original.apply(this, args);
  };
  try { await assert.rejects(saveBookWithAsset(book, new File(["%PDF-1.7"], "test.pdf"))); }
  finally { IDBObjectStore.prototype.put = original; }
  assert.equal(await runTransaction("books", "readonly", tx => requestResult(tx.objectStore("books").get(book.id))), undefined);
  await assert.rejects(saveBookWithAsset(book, new File(["not a PDF"], "bad.pdf")));
  assert.equal(await runTransaction("books", "readonly", tx => requestResult(tx.objectStore("books").get(book.id))), undefined);
});

test("a retained old reader cannot overwrite progress after replacing its file", async () => {
  const { loadReader, saveReaderState } = await import("../app/data/reader-repository");
  const { defaultReaderState } = await import("../app/core/reader");
  await saveReaderState({ ...defaultReaderState("file-book", "asset-one"), location: { page: 99 } });
  assert.deepEqual((await loadReader("file-book"))?.state.location, {});
});
