"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { belongsToCollection, collectionEntry, orderPatch, recordKey, type CollectionEntry, type CollectionId, type RecordRef } from "../core/collections";
import { devotionalFromDraft } from "../core/devotional";
import type { DevotionalDraft, DevotionalItem, EntityTemplate } from "../core/types";
import { collectionRepository } from "../data/collection-repository";

// Commit writes before publishing state. Serialize local actions so two rapid
// taps cannot overwrite each other's membership or editor changes.
export const RecordLibraryContext = createContext<ReturnType<typeof useRecordLibraryState> | null>(null);

export function useRecordLibrary() {
  const value = useContext(RecordLibraryContext);
  if (!value) throw new Error("RecordLibraryProvider is missing");
  return value;
}

export function useRecordLibraryState(onError: () => void) {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const entriesRef = useRef(entries);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(false);

  const replaceEntries = useCallback((next: CollectionEntry[]) => {
    entriesRef.current = next;
    if (mounted.current) setEntries(next);
  }, []);

  const reload = useCallback(async (isCurrent = () => mounted.current) => {
    const next = await collectionRepository.load();
    if (!isCurrent()) return;
    replaceEntries(next);
    setFailed(false);
    setReady(true);
  }, [replaceEntries]);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    queue.current = reload(() => active).catch(() => {
      if (!active) return;
      setFailed(true);
      setReady(true);
      onError();
    });
    return () => { active = false; mounted.current = false; };
  }, [onError, reload]);

  const mutate = useCallback((operation: () => Promise<void>) => {
    const result = queue.current.then(async () => {
      try {
        await operation();
        return true;
      } catch {
        if (mounted.current) onError();
        return false;
      }
    });
    queue.current = result;
    return result;
  }, [onError]);

  const publish = useCallback((entry: CollectionEntry) => {
    const next = collectionEntry(entry.moduleId, entry.item, "favorites");
    const current = entriesRef.current;
    replaceEntries(current.some((item) => item.id === next.id)
      ? current.map((item) => item.id === next.id ? next : item)
      : [...current, next]);
  }, [replaceEntries]);

  return useMemo(() => {
    const update = (ref: RecordRef, changes: Partial<DevotionalItem>) => mutate(async () => {
      publish(collectionEntry(ref.moduleId, await collectionRepository.patch(ref, changes), "favorites"));
    });
    const toggleMembership = (ref: RecordRef, collection: CollectionId, template?: EntityTemplate<DevotionalItem>) => mutate(async () => {
      const current = entriesRef.current.find((entry) => entry.id === recordKey(ref.moduleId, ref.itemId));
      const included = current ? belongsToCollection(current.item, collection) : false;
      const item = await collectionRepository.setMembership(ref, collection, !included, template);
      publish(collectionEntry(ref.moduleId, item, collection));
    });
    const create = (draft: DevotionalDraft) => mutate(async () => {
      const item = { ...devotionalFromDraft("dhikr", draft, null, Date.now()), inVirds: true, liked: false };
      await collectionRepository.create(item);
      publish(collectionEntry("dhikr", item, "virds"));
    });
    const saveOrder = (next: CollectionEntry[], collection: CollectionId) => mutate(async () => {
      await collectionRepository.saveOrder(next, collection);
      const orderById = new Map(next.map((entry) => [entry.id, entry.sortOrder]));
      replaceEntries(entriesRef.current.map((entry) => {
        const sortOrder = orderById.get(entry.id);
        return sortOrder === undefined ? entry : {
          ...entry,
          item: { ...entry.item, ...orderPatch(collection, sortOrder) },
        };
      }));
    });

    return { entries, ready, failed, update, toggleMembership, create, saveOrder };
  }, [entries, ready, failed, mutate, publish, replaceEntries]);
}
