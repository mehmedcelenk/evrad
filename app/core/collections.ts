import type { BookItem, DevotionalItem, DevotionalModuleId, TrackableModuleId } from "./types";

export type CollectionId = "virds";
export interface RecordRef { moduleId: TrackableModuleId; itemId: string }
interface EntryBase { id: string; itemId: string; sortOrder: number }
export type CollectionEntry = EntryBase & (
  { moduleId: "books"; item: BookItem } |
  { moduleId: DevotionalModuleId; item: DevotionalItem }
);
export type LibraryItem = DevotionalItem | BookItem;
export type Membership = Pick<BookItem, "inVirds" | "virdSortOrder" | "sortOrder">;

export function recordKey(moduleId: TrackableModuleId, itemId: string) {
  return `${moduleId}:${itemId}`;
}

export function belongsToCollection(item: LibraryItem, collection: CollectionId) {
  return item.inVirds !== false;
}

export function membershipPatch(collection: CollectionId, included: boolean): Partial<Membership> {
  return { inVirds: included };
}

export function collectionEntry(moduleId: TrackableModuleId, item: LibraryItem, collection: CollectionId): CollectionEntry {
  return {
    id: recordKey(moduleId, item.id), moduleId, itemId: item.id, item,
    sortOrder: item.virdSortOrder ?? item.sortOrder,
  } as CollectionEntry;
}

export function selectCollection(entries: CollectionEntry[], collection: CollectionId) {
  return entries.filter((entry) => belongsToCollection(entry.item, collection))
    .map((entry) => collectionEntry(entry.moduleId, entry.item, collection))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function orderPatch(collection: CollectionId, sortOrder: number): Partial<Membership> {
  return { virdSortOrder: sortOrder, sortOrder };
}

