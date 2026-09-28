import type { TrackableModuleId } from "../core/types";
import { modules } from "../core/module-registry";

const DB_NAME = "zikirlerim";
const DB_VERSION = 9;

export const ENTITY_STORES = Object.fromEntries(modules.map((module) => [module.id, module.storeName])) as Record<TrackableModuleId, string>;
export const COMPLETION_STORE = "completions";

let databasePromise: Promise<IDBDatabase> | null = null;
const BLOCKED_TIMEOUT_MS = 2500;

export function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export async function runTransaction<T>(
  stores: string | string[],
  mode: IDBTransactionMode,
  operation: (transaction: IDBTransaction) => T | Promise<T>,
): Promise<T> {
  const database = await openDatabase();
  const transaction = database.transaction(stores, mode);
  const done = transactionDone(transaction);
  const work = Promise.resolve().then(() => operation(transaction)).catch((error) => {
    try { transaction.abort(); } catch { /* The transaction may already be finished. */ }
    throw error;
  });
  const [result] = await Promise.all([work, done]);
  return result;
}

export function getEntityStore(moduleId: TrackableModuleId): string {
  const storeName = ENTITY_STORES[moduleId];
  if (!storeName) throw new Error(`${moduleId} does not use trackable storage`);
  return storeName;
}

export function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB unavailable"));

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let settled = false;
    let blockedTimeout: number | undefined;
    request.onupgradeneeded = (event) => {
      const database = request.result;
      Object.values(ENTITY_STORES).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: "id" });
        }
      });
      for (const name of ["bookAssets", "readerStates", "readerSettings"]) {
        if (!database.objectStoreNames.contains(name)) database.createObjectStore(name, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(COMPLETION_STORE)) {
        const store = database.createObjectStore(COMPLETION_STORE, { keyPath: "key" });
        store.createIndex("localDate", "localDate", { unique: false });
        store.createIndex("itemId", "itemId", { unique: false });
      }
      if (event.oldVersion > 0 && event.oldVersion < 8 && request.transaction) {
        Object.entries(ENTITY_STORES).filter(([moduleId]) => moduleId !== "books").forEach(([moduleId, storeName]) => {
          const cursorRequest = request.transaction!.objectStore(storeName).openCursor();
          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (!cursor) return;
            const legacyVird = event.oldVersion < 7 && moduleId === "dhikr";
            cursor.update({
              ...cursor.value,
              ...(legacyVird ? { inVirds: true, virdSortOrder: cursor.value.sortOrder } : {}),
              liked: cursor.value.liked ?? true,
            });
            cursor.continue();
          };
        });
      }
    };
    request.onblocked = () => {
      blockedTimeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        databasePromise = null;
        reject(new Error("IndexedDB upgrade blocked by another open app window"));
      }, BLOCKED_TIMEOUT_MS);
    };
    request.onsuccess = () => {
      if (blockedTimeout !== undefined) window.clearTimeout(blockedTimeout);
      const database = request.result;
      if (settled) {
        database.close();
        return;
      }
      settled = true;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      database.onclose = () => { databasePromise = null; };
      resolve(database);
    };
    request.onerror = () => {
      if (blockedTimeout !== undefined) window.clearTimeout(blockedTimeout);
      settled = true;
      databasePromise = null;
      reject(request.error ?? new Error("IndexedDB unavailable"));
    };
  });

  return databasePromise;
}
