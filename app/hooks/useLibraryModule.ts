"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppRuntime } from "../core/AppRuntimeContext";
import type { EntityEditorMode } from "../core/editor";
import { t } from "../core/i18n";
import { getTrackableModule } from "../core/module-registry";
import { normalizeOrder } from "../core/sort";
import type { TrackableEntity, TrackableModuleId, TrackableRepository } from "../core/types";
import { useEntityEditorRoute } from "./useEntityEditorRoute";
import { useTrackableCollection } from "./useTrackableCollection";

export function useLibraryModule<T extends TrackableEntity, Draft>({
  moduleId,
  editorMode,
  repository,
  getTitle,
  fromDraft,
}: {
  moduleId: TrackableModuleId;
  editorMode: EntityEditorMode;
  repository: TrackableRepository<T>;
  getTitle: (item: T) => string;
  fromDraft: (draft: Draft, existing: T | null, sortOrder: number) => T;
}) {
  const router = useRouter();
  const { showToast } = useAppRuntime();
  const definition = getTrackableModule(moduleId);
  const itemLabel = t(definition.copy.singular);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const showStorageError = useCallback(() => showToast(t("toast.storageError")), [showToast]);
  const reorderCopy = useCallback(
    (item: T, position: number) => t("card.reorderedGeneric", { title: getTitle(item), position }),
    [getTitle],
  );
  const collection = useTrackableCollection({
    repository,
    getReorderAnnouncement: reorderCopy,
    onStorageError: showStorageError,
  });
  const { forgetItemState, itemsRef, replaceItems } = collection;

  const closeEditor = useCallback(() => router.replace(definition.route), [definition.route, router]);
  const handleMissing = useCallback(() => {
    showToast(t("editor.notFoundGeneric", { item: itemLabel }));
    router.replace(definition.route);
  }, [definition.route, itemLabel, router, showToast]);
  const editor = useEntityEditorRoute({
    mode: editorMode,
    items: collection.items,
    storageReady: collection.storageReady && !collection.storageFailed,
    onMissing: handleMissing,
  });

  const updateItem = useCallback(async (item: T) => {
    try {
      await repository.save(item);
      replaceItems(itemsRef.current.map((current) => current.id === item.id ? item : current));
      return true;
    } catch {
      showStorageError();
      return false;
    }
  }, [itemsRef, replaceItems, repository, showStorageError]);

  const saveDraft = useCallback(async (draft: Draft) => {
    const existing = editor === "new" ? null : editor;
    const item = fromDraft(draft, existing, itemsRef.current.length);
    try {
      await repository.save(item);
    } catch (error) {
      showStorageError();
      throw error;
    }
    const next = existing
      ? itemsRef.current.map((current) => current.id === item.id ? item : current)
      : [...itemsRef.current, item];
    replaceItems(normalizeOrder(next));
  }, [editor, fromDraft, itemsRef, replaceItems, repository, showStorageError]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return false;
    const next = normalizeOrder(itemsRef.current.filter((item) => item.id !== deleteTarget.id));
    try { await repository.remove(deleteTarget.id, next); }
    catch { showStorageError(); return false; }
    replaceItems(next);
    forgetItemState(deleteTarget.id);
    return true;
  }, [deleteTarget, forgetItemState, itemsRef, replaceItems, repository, showStorageError]);

  return {
    module: definition,
    itemLabel,
    collection,
    editor,
    deleteTarget,
    setDeleteTarget,
    updateItem,
    saveDraft,
    confirmDelete,
    closeEditor,
  };
}
