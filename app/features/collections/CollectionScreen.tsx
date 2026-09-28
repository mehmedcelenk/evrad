"use client";

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
import { getSectionRoute } from "../../core/module-registry";
import { getDefaultRecordCategory } from "../../core/record-categories";
import type { ArabicFontLevel, DevotionalDraft } from "../../core/types";
import { useCollection } from "../../hooks/useCollection";
import { useRecordFilters } from "../../hooks/useRecordFilters";
import { DevotionalCard } from "../devotional/DevotionalCard";
import { DevotionalEditor } from "../devotional/DevotionalEditor";
import { devotionalContentFromDraft } from "../../core/devotional";

const copy = {
  virds: { title: "module.dhikr.title", eyebrow: "module.dhikr.eyebrow", tagline: "module.dhikr.tagline", empty: "virds.empty", body: "virds.emptyBody" },
  favorites: { title: "module.bag.title", eyebrow: "module.bag.eyebrow", tagline: "module.bag.tagline", empty: "empty.libraryTitle", body: "favorites.emptyBody" },
} as const;

export function CollectionScreen({ collection }: { collection: CollectionId }) {
  const state = useCollection(collection);
  const filters = useRecordFilters();
  const labels = copy[collection];
  const [editTarget, setEditTarget] = useState<CollectionEntry | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CollectionEntry | null>(null);
  const visible = state.entries.filter((entry) => filters.matches(entry.item, entry.moduleId));

  const save = async (draft: DevotionalDraft) => {
    if (!editTarget) return;
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
      emptyState={<TrackableEmptyState title={t(labels.empty)} body={t(labels.body)} actionLabel={t("menu.discover")} actionHref={getSectionRoute("discover")} />}
      status={<SortStatus active={Boolean(state.sorting.draggingId)} announcement={state.sorting.announcement} activeLabel={t("card.sorting")} />}
      footer={<p className="quiet-note">{t("app.lightNote")}</p>}
    >
      {visible.length ? visible.map((entry) => (
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
      )) : <p className="filter-empty">{t("filter.empty")}</p>}
    </TrackableModuleLayout>
    {editTarget ? <DevotionalEditor key={editTarget.id} item={editTarget.item} itemLabel={t("bag.record")}
      defaultCategory={getDefaultRecordCategory(editTarget.item, editTarget.moduleId)}
      onClose={() => setEditTarget(null)} onSave={save} /> : null}
    {removeTarget ? <CollectionChoiceModal title={t("collection.removeQuestion")} body={t("collection.removeBody")}
      choices={["virds", "bag", "both"]} onCancel={() => setRemoveTarget(null)} onChoose={remove} /> : null}
  </>;
}
