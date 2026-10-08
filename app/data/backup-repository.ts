import type { ReaderState } from "../core/reader";
import { READER_STORES } from "./reader-repository";
import { trackableModuleIds } from "../core/module-registry";
import type { DailyCompletion } from "../core/types";
import type { BackupPayload } from "../core/backup";
import { COMPLETION_STORE, ENTITY_STORES, requestResult, runTransaction } from "./indexed-db";

export function readBackupPayload(): Promise<BackupPayload> {
  return runTransaction([...Object.values(ENTITY_STORES), COMPLETION_STORE, ...READER_STORES], "readonly", async (transaction) => {
    const [entries, completions, readerStates, readerSettings] = await Promise.all([
      Promise.all(trackableModuleIds.map(async (id) => [
        id, await requestResult(transaction.objectStore(ENTITY_STORES[id]).getAll()),
      ])),
      requestResult(transaction.objectStore(COMPLETION_STORE).getAll() as IDBRequest<DailyCompletion[]>),
      requestResult(transaction.objectStore("readerStates").getAll()) as Promise<ReaderState[]>,
      requestResult(transaction.objectStore("readerSettings").getAll()),
    ]);
    return { entities: Object.fromEntries(entries) as BackupPayload["entities"], completions, readerStates, readerSettings };
  });
}

export interface RestoreResult {
  restoredEntities: number;
  restoredCompletions: number;
}

export function restoreBackupPayload(payload: BackupPayload): Promise<RestoreResult> {
  if (!payload || typeof payload !== "object" || !payload.entities) {
    return Promise.reject(new Error("Invalid backup payload"));
  }

  return runTransaction([...Object.values(ENTITY_STORES), COMPLETION_STORE, ...READER_STORES], "readwrite", async (transaction) => {
    let restoredEntities = 0;
    let restoredCompletions = 0;

    for (const id of trackableModuleIds) {
      const storeName = ENTITY_STORES[id];
      const items = payload.entities[id] ?? [];
      const store = transaction.objectStore(storeName);
      for (const item of items) {
        if (item && item.id) {
          store.put(item);
          restoredEntities++;
        }
      }
    }

    if (Array.isArray(payload.completions)) {
      const store = transaction.objectStore(COMPLETION_STORE);
      for (const c of payload.completions) {
        if (c && c.key) {
          store.put(c);
          restoredCompletions++;
        }
      }
    }

    if (Array.isArray(payload.readerStates)) {
      const store = transaction.objectStore("readerStates");
      for (const r of payload.readerStates) {
        if (r && r.id) store.put(r);
      }
    }

    if (Array.isArray(payload.readerSettings)) {
      const store = transaction.objectStore("readerSettings");
      for (const s of payload.readerSettings) {
        if (s && s.id) store.put(s);
      }
    }

    return { restoredEntities, restoredCompletions };
  });
}
