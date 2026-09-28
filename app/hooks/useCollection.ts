"use client";

import { useMemo, useState } from "react";
import { selectCollection, type CollectionEntry, type CollectionId } from "../core/collections";
import { t } from "../core/i18n";
import { useRecordLibrary } from "./useRecordLibrary";
import { useCompletionState } from "./useCompletionState";
import { useExpandableItems } from "./useExpandableItems";
import { useLongPressSort } from "./useLongPressSort";

export function useCollection(collection: CollectionId) {
  const library = useRecordLibrary();
  const completions = useCompletionState();
  const expansion = useExpandableItems();
  const [orderPreview, setOrderPreview] = useState<CollectionEntry[] | null>(null);
  const selected = useMemo(() => selectCollection(library.entries, collection), [library.entries, collection]);
  const entries = orderPreview ?? selected;

  const persistOrder = async (next: CollectionEntry[]) => {
    const success = await library.saveOrder(next, collection);
    setOrderPreview(null);
    if (!success) throw new Error("Order could not be saved");
  };
  const sorting = useLongPressSort({
    items: entries,
    onChange: setOrderPreview,
    onPersist: persistOrder,
    getAnnouncement: (entry, position) => t("card.reorderedGeneric", { title: entry.moduleId === "books" ? entry.item.title : entry.item.name ?? entry.item.arabic ?? "", position }),
    onError: () => undefined, // mutate already reports the failure and restores the committed order.
  });

  return {
    ready: library.ready && completions.ready, failed: library.failed || completions.failed, entries,
    completeKeys: completions.keys, expansion, sorting, update: library.update, toggleMembership: library.toggleMembership,
    toggleComplete: (entry: CollectionEntry) => void completions.toggle(entry.moduleId, entry.itemId),
  };
}
