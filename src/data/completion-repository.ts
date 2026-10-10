import { COMPLETION_STORE, requestResult, runTransaction } from "./indexed-db";

export interface CompletionRecord {
  key: string;
  itemId: string;
  localDate: string;
  createdAt: string;
}

export function buildCompletionKey(itemId: string, dateKey: string): string {
  return `${itemId}:${dateKey}`;
}

export async function getCompletionsForDate(dateKey: string): Promise<Set<string>> {
  const records = await runTransaction(COMPLETION_STORE, "readonly", (tx) => {
    const index = tx.objectStore(COMPLETION_STORE).index("localDate");
    return requestResult(index.getAll(dateKey));
  });
  const completedItemIds = new Set<string>();
  if (Array.isArray(records)) {
    records.forEach((record: CompletionRecord) => completedItemIds.add(record.itemId));
  }
  return completedItemIds;
}

export async function toggleCompletion(itemId: string, dateKey: string): Promise<boolean> {
  const key = buildCompletionKey(itemId, dateKey);
  const existing = await runTransaction(COMPLETION_STORE, "readonly", (tx) => requestResult(tx.objectStore(COMPLETION_STORE).get(key)));
  if (existing) {
    await runTransaction(COMPLETION_STORE, "readwrite", (tx) => tx.objectStore(COMPLETION_STORE).delete(key));
    return false;
  } else {
    const record: CompletionRecord = {
      key,
      itemId,
      localDate: dateKey,
      createdAt: new Date().toISOString(),
    };
    await runTransaction(COMPLETION_STORE, "readwrite", (tx) => tx.objectStore(COMPLETION_STORE).put(record));
    return true;
  }
}
