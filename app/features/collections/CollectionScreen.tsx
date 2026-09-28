"use client";

import { BookCollectionCard } from "../books/BookCollectionCard";
import { BookCreateScreen } from "../books/BookCreateScreen";
import { useState } from "react";
import { CollectionChoiceModal, type CollectionChoice } from "../../components/CollectionChoiceModal";
import { ModuleScreenHeader } from "../../components/ModuleScreenHeader";
import { RecordFilters } from "../../components/RecordFilters";
import { SortStatus } from "../../components/SortStatus";
import { StorageLoading } from "../../components/StorageLoading";
import { TrackableEmptyState } from "../../components/TrackableEmptyState";
import { TrackableModuleLayout } from "../../components/TrackableModuleLayout";
import type { CollectionEntry, CollectionId } from "../../core/collections";
import { t } from "../../core/i18n";
import { getDefaultRecordCategory } from "../../core/record-categories";
import type { ArabicFontLevel, DevotionalDraft } from "../../core/types";
import { useCollection } from "../../hooks/useCollection";
import { useRecordFilters } from "../../hooks/useRecordFilters";
import { DevotionalCard } from "../devotional/DevotionalCard";
import { DevotionalEditor } from "../devotional/DevotionalEditor";
import { devotionalContentFromDraft } from "../../core/devotional";

const copy = {
  virds: { title: "module.dhikr.title", eyebrow: "module.dhikr.eyebrow", tagline: "module.dhikr.tagline" },
  favorites: { title: "module.bag.title", eyebrow: "module.bag.eyebrow", tagline: "module.bag.tagline" },
} as const;

export function CollectionScreen({ collection }: { collection: CollectionId }) {
  const state = useCollection(collection);
  const filters = useRecordFilters();
  const labels = copy[collection];
  const [editTarget, setEditTarget] = useState<CollectionEntry | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CollectionEntry | null>(null);
  const visible = state.entries.filter((entry) => entry.moduleId === "books" ? (!filters.categories.length || filters.categories.includes("books")) && !filters.contexts.length : filters.matches(entry.item, entry.moduleId));

  const save = async (draft: DevotionalDraft) => {
    if (!editTarget || editTarget.moduleId === "books") return;
    const saved = await state.update(editTarget, devotionalContentFromDraft(draft));
    if (!saved) throw new Error("Record could not be saved");
  };

  const remove = async (choice: CollectionChoice) => {
    if (!removeTarget) return;
    const patch = choice === "virds" ? { inVirds: false } : choice === "bag" ? { liked: false } : { inVirds: false, liked: false };
    return state.update(removeTarget, patch);
  };

  return <>
    <TrackableModuleLayout
      header={<ModuleScreenHeader title={t(labels.title)} eyebrow={t(labels.eyebrow)} tagline={t(labels.tagline)} filters={<RecordFilters filters={filters} />} />}
      loading={!state.ready}
      hasItems={state.entries.length > 0}
      loadingState={<StorageLoading label={t("loading.generic", { module: t(labels.title) })} />}
      errorState={state.failed ? <p role="alert">{t("toast.storageError")}</p> : undefined}
      emptyState={<TrackableEmptyState />}
      status={<SortStatus active={Boolean(state.sorting.draggingId)} announcement={state.sorting.announcement} activeLabel={t("card.sorting")} />}
      footer={<p className="quiet-note">{t("app.lightNote")}</p>}
    >
      {visible.length ? visible.map((entry) => (
        entry.moduleId === "books" ? <BookCollectionCard key={entry.id} entry={entry} state={state}
          onEdit={() => setEditTarget(entry)} onRemove={() => collection === "favorites" ? void state.update(entry, { liked: false }) : setRemoveTarget(entry)} /> :
        <DevotionalCard key={entry.id} cardId={entry.id} collection={collection}
          moduleId={entry.moduleId} item={entry.item} complete={state.completeKeys.has(entry.id)}
          expanded={state.expansion.expandedIds.has(entry.id)} dragging={state.sorting.draggingId === entry.id}
          dragOffsetY={state.sorting.draggingId === entry.id ? state.sorting.dragOffsetY : 0}
          onToggleExpanded={() => state.expansion.toggleExpanded(entry.id)} onToggleComplete={() => state.toggleComplete(entry)}
          onChangeFont={(direction) => void state.update(entry, { expandedArabicSize: Math.max(0, Math.min(4, entry.item.expandedArabicSize + direction)) as ArabicFontLevel })}
          onEdit={() => setEditTarget(entry)}
          onRemoveFromCollections={() => collection === "favorites" ? void state.update(entry, { liked: false }) : setRemoveTarget(entry)}
          inVirds={Boolean(entry.item.inVirds)} onToggleVird={() => void state.toggleMembership(entry, "virds")}
          sortHandleProps={state.sorting.handleProps} />
      )) : <p className="filter-empty">{t("empty.simple")}</p>}
    </TrackableModuleLayout>
    {editTarget?.moduleId === "books" ? <BookCreateScreen item={editTarget.item} onClose={() => setEditTarget(null)} /> : editTarget ? <DevotionalEditor key={editTarget.id} item={editTarget.item} itemLabel={t("bag.record")}
      defaultCategory={getDefaultRecordCategory(editTarget.item, editTarget.moduleId)}
      onClose={() => setEditTarget(null)} onSave={save} /> : null}
    {removeTarget ? <CollectionChoiceModal title={t("collection.removeQuestion")} body={t("collection.removeBody")}
      choices={["virds", "bag", "both"]} onCancel={() => setRemoveTarget(null)} onChoose={remove} /> : null}
  </>;
}
