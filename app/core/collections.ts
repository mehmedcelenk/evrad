import type { BookItem, DevotionalItem, DevotionalModuleId, TrackableModuleId } from "./types";

export type CollectionId = "virds" | "favorites";
export interface RecordRef { moduleId: TrackableModuleId; itemId: string }
interface EntryBase { id: string; itemId: string; sortOrder: number }
export type CollectionEntry = EntryBase & (
  { moduleId: "books"; item: BookItem } |
  { moduleId: DevotionalModuleId; item: DevotionalItem }
);
export type LibraryItem = DevotionalItem | BookItem;
export type Membership = Pick<BookItem, "inVirds" | "liked" | "virdSortOrder" | "sortOrder">;

export function recordKey(moduleId: TrackableModuleId, itemId: string) {
  return `${moduleId}:${itemId}`;
}

export function belongsToCollection(item: LibraryItem, collection: CollectionId) {
  return collection === "virds" ? item.inVirds === true : item.liked !== false;
}

export function membershipPatch(collection: CollectionId, included: boolean): Partial<Membership> {
  return collection === "virds" ? { inVirds: included } : { liked: included };
}

export function collectionEntry(moduleId: TrackableModuleId, item: LibraryItem, collection: CollectionId): CollectionEntry {
  return {
    id: recordKey(moduleId, item.id), moduleId, itemId: item.id, item,
    sortOrder: collection === "virds" ? item.virdSortOrder ?? item.sortOrder : item.sortOrder,
  } as CollectionEntry;
}

export function selectCollection(entries: CollectionEntry[], collection: CollectionId) {
  return entries.filter((entry) => belongsToCollection(entry.item, collection))
    .map((entry) => collectionEntry(entry.moduleId, entry.item, collection))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function orderPatch(collection: CollectionId, sortOrder: number): Partial<Membership> {
  return collection === "virds" ? { virdSortOrder: sortOrder } : { sortOrder };
}
