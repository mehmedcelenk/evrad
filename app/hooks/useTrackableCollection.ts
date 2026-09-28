"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordKey } from "../core/collections";
import type { TrackableEntity, TrackableRepository } from "../core/types";
import { useCompletionState } from "./useCompletionState";
import { useExpandableItems } from "./useExpandableItems";
import { useLongPressSort } from "./useLongPressSort";

export function useTrackableCollection<T extends TrackableEntity>({
  repository, getReorderAnnouncement, onStorageError,
}: {
  repository: TrackableRepository<T>;
  getReorderAnnouncement: (item: T, position: number) => string;
  onStorageError: () => void;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [itemsReady, setItemsReady] = useState(false);
  const [itemsFailed, setItemsFailed] = useState(false);
  const itemsRef = useRef(items);
  const committed = useRef(items);
  const completions = useCompletionState();
  const { expandedIds, toggleExpanded, forgetExpanded } = useExpandableItems();
  const replaceItems = useCallback((next: T[]) => {
    itemsRef.current = next;
    committed.current = next;
    setItems(next);
  }, []);
  const previewOrder = (next: T[]) => {
    itemsRef.current = next;
    setItems(next);
  };
  const persistOrder = async (next: T[]) => {
    try {
      await repository.saveOrder(next);
      replaceItems(next);
    } catch (error) {
      replaceItems(committed.current);
      throw error;
    }
  };
  const sorting = useLongPressSort({
    items, onChange: previewOrder, onPersist: persistOrder,
    getAnnouncement: getReorderAnnouncement, onError: onStorageError,
  });

  useEffect(() => {
    let active = true;
    repository.load().then((stored) => {
      if (!active) return;
      replaceItems(stored);
      setItemsFailed(false);
      setItemsReady(true);
    }).catch(() => {
      if (active) { setItemsFailed(true); setItemsReady(true); onStorageError(); }
    });
    return () => { active = false; };
  }, [onStorageError, replaceItems, repository]);

  return {
    items, itemsRef, replaceItems, expandedIds, toggleExpanded,
    completeIds: new Set(items.filter((item) => completions.keys.has(recordKey(repository.moduleId, item.id))).map((item) => item.id)),
    toggleComplete: (id: string) => void completions.toggle(repository.moduleId, id),
    forgetItemState: forgetExpanded,
    storageReady: itemsReady && completions.ready,
    storageFailed: itemsFailed || completions.failed,
    sorting,
  };
}
