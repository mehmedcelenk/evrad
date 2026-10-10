import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { test } from "node:test";
import { deleteDhikr, getAllDhikrs, saveDhikr } from "../src/data/collection-repository";
import { getCompletionsForDate, toggleCompletion } from "../src/data/completion-repository";
import type { DevotionalItem } from "../src/shared/types";

const testDhikr: DevotionalItem = {
  id: "test-dhikr-1",
  name: "Test Zikri",
  arabic: "سُبْحَانَ اللَّهِ",
  translation: "Allah eksikliklerden münezzehtir.",
  targetCount: 33,
  targetUnit: "count",
  contexts: ["general"],
  inVirds: true,
  inBag: true,
  expandedArabicSize: 2,
  category: "dhikr",
};

test("collection repository seeds default item when empty and performs CRUD operations", async () => {
  const initial = await getAllDhikrs();
  assert.ok(initial.length >= 1);

  const saved = await saveDhikr(testDhikr);
  assert.equal(saved.id, "test-dhikr-1");
  assert.equal(saved.name, "Test Zikri");

  const all = await getAllDhikrs();
  const found = all.find((item) => item.id === "test-dhikr-1");
  assert.ok(found);
  assert.equal(found.arabic, "سُبْحَانَ اللَّهِ");

  await deleteDhikr("test-dhikr-1");
  const afterDelete = await getAllDhikrs();
  assert.equal(afterDelete.find((item) => item.id === "test-dhikr-1"), undefined);
});

test("completion repository toggles daily completion state correctly", async () => {
  const dateKey = "2026-10-10";
  const itemId = "dhikr-complete-test";

  const initialCompletions = await getCompletionsForDate(dateKey);
  assert.equal(initialCompletions.has(itemId), false);

  const added = await toggleCompletion(itemId, dateKey);
  assert.equal(added, true);

  const completionsAfterAdd = await getCompletionsForDate(dateKey);
  assert.equal(completionsAfterAdd.has(itemId), true);

  const removed = await toggleCompletion(itemId, dateKey);
  assert.equal(removed, false);

  const completionsAfterRemove = await getCompletionsForDate(dateKey);
  assert.equal(completionsAfterRemove.has(itemId), false);
});
