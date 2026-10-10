const DB_NAME = "zikirlerim";
const DB_VERSION = 9;
export const DHIKR_STORE = "dhikr";
export const COMPLETION_STORE = "completions";
export const PREFERENCES_STORE = "preferences";

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
    try { transaction.abort(); } catch { /* Ignore transaction finish errors */ }
    throw error;
  });
  const [result] = await Promise.all([work, done]);
  return result;
}

export function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB unavailable"));

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let settled = false;
    let blockedTimeout: number | undefined;

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DHIKR_STORE)) {
        database.createObjectStore(DHIKR_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(COMPLETION_STORE)) {
        const store = database.createObjectStore(COMPLETION_STORE, { keyPath: "key" });
        store.createIndex("localDate", "localDate", { unique: false });
        store.createIndex("itemId", "itemId", { unique: false });
      }
      if (!database.objectStoreNames.contains(PREFERENCES_STORE)) {
        database.createObjectStore(PREFERENCES_STORE, { keyPath: "id" });
      }
    };

    request.onblocked = () => {
      blockedTimeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        databasePromise = null;
        reject(new Error("IndexedDB upgrade blocked by open window"));
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
