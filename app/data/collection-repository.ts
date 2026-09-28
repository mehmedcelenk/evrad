import { collectionEntry, membershipPatch, orderPatch, type CollectionId, type LibraryItem, type RecordRef } from "../core/collections";
import { storeTemplate } from "../core/entity";
import { trackableModuleIds } from "../core/module-registry";
import type { DevotionalItem, EntityTemplate } from "../core/types";
import { getEntityStore, requestResult, runTransaction } from "./indexed-db";

const stores = trackableModuleIds.map(getEntityStore);

async function load() {
  return runTransaction(stores, "readonly", async (transaction) => {
    const groups = await Promise.all(trackableModuleIds.map(async (moduleId) => {
      const items = await requestResult(transaction.objectStore(getEntityStore(moduleId)).getAll() as IDBRequest<LibraryItem[]>);
      return items.map((item) => collectionEntry(moduleId, "name" in item ? { ...item, contexts: item.contexts ?? [], source: item.source ?? null } : item, "favorites"));
    }));
    return groups.flat();
  });
}

async function patch(ref: RecordRef, changes: Partial<LibraryItem>) {
  const storeName = getEntityStore(ref.moduleId);
  return runTransaction(storeName, "readwrite", async (transaction) => {
    const store = transaction.objectStore(storeName);
    const current = await requestResult(store.get(ref.itemId) as IDBRequest<LibraryItem | undefined>);
    if (!current) throw new Error("Record no longer exists");
    const updated = { ...current, ...changes, id: current.id, createdAt: current.createdAt, updatedAt: new Date().toISOString() };
    store.put(updated);
    return updated;
  });
}

// One read/write transaction: a failed write cannot leave a half-added template.
async function setMembership(ref: RecordRef, collection: CollectionId, included: boolean, template?: EntityTemplate<DevotionalItem>) {
  const storeName = getEntityStore(ref.moduleId);
  return runTransaction(storeName, "readwrite", async (transaction) => {
    const store = transaction.objectStore(storeName);
    const current = await requestResult(store.get(ref.itemId) as IDBRequest<LibraryItem | undefined>);
    if (!current && !template) throw new Error("Record no longer exists");
    const base = current ?? { ...storeTemplate(template!, Date.now()), liked: false, inVirds: false };
    const updated = { ...base, ...membershipPatch(collection, included), updatedAt: new Date().toISOString() };
    store.put(updated);
    return updated;
  });
}

async function saveOrder(refs: RecordRef[], collection: CollectionId) {
  if (!refs.length) return;
  const storeNames = [...new Set(refs.map((ref) => getEntityStore(ref.moduleId)))];
  return runTransaction(storeNames, "readwrite", async (transaction) => {
    const records = await Promise.all(refs.map((ref) => requestResult(
      transaction.objectStore(getEntityStore(ref.moduleId)).get(ref.itemId) as IDBRequest<LibraryItem | undefined>,
    )));
    if (records.some((item) => !item)) throw new Error("A sorted record no longer exists");
    records.forEach((item, index) => transaction.objectStore(getEntityStore(refs[index].moduleId)).put({
      ...item, ...orderPatch(collection, index), updatedAt: new Date().toISOString(),
    }));
  });
}

async function create(item: DevotionalItem) {
  const storeName = getEntityStore("dhikr");
  return runTransaction(storeName, "readwrite", (transaction) => {
    transaction.objectStore(storeName).add(item);
  });
}

export const collectionRepository = { load, create, patch, setMembership, saveOrder };
