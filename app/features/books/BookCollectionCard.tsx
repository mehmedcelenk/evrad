"use client";
import { TrackableCardShell, SortHandle, CollapsedCardSummary, CompletionLight } from "../../components/TrackerPrimitives";
import { CardActions } from "../../components/CardActions";
import type { CollectionEntry } from "../../core/collections";
import { t } from "../../core/i18n";
import type { useCollection } from "../../hooks/useCollection";
import { useReader } from "../reader/useReader";
import { downloadBook } from "../../data/reader-repository";
import { useAppRuntime } from "../../core/AppRuntimeContext";
import { BookDetails } from "./BookDetails";

export function BookCollectionCard({ entry, state, onEdit, onRemove }: {
  entry: Extract<CollectionEntry, { moduleId: "books" }>;
  state: ReturnType<typeof useCollection>; onEdit: () => void; onRemove: () => void;
}) {
  const { item, id } = entry;
  const { open } = useReader();
  const { showToast } = useAppRuntime();
  const expanded = state.expansion.expandedIds.has(id);
  return <TrackableCardShell id={id} complete={state.completeKeys.has(id)} expanded={expanded}
    dragging={state.sorting.draggingId === id} dragOffsetY={state.sorting.draggingId === id ? state.sorting.dragOffsetY : 0}
    leading={<SortHandle sortId={id} label={t("card.sorting")} {...state.sorting.handleProps} />}
    summary={<CollapsedCardSummary title={item.title} arabic={false} expanded={expanded} onToggle={() => state.expansion.toggleExpanded(id)} />}
    trailing={<CompletionLight complete={state.completeKeys.has(id)} onToggle={() => state.toggleComplete(entry)} label={t("card.completeGeneric", { title: item.title })} />}>
    <BookDetails item={item} actions={<>
      <div className="book-actions">
        <button onClick={() => item.assetId ? void open(item.id) : onEdit()}>{t(item.assetId ? "reader.open" : "reader.attach")}</button>
        <button aria-pressed={item.liked !== false} onClick={() => void state.toggleMembership(entry, "favorites")}>{t("reader.favorite")}</button>
        <button aria-pressed={item.inVirds === true} onClick={() => void state.toggleMembership(entry, "virds")}>{t("reader.vird")}</button>
        {item.assetId ? <button onClick={() => void downloadBook(item.assetId!).catch(() => showToast(t("reader.error")))}>{t("reader.download")}</button> : null}
      </div>
      <CardActions title={item.title} onEdit={onEdit} onDelete={onRemove} />
    </>} />
  </TrackableCardShell>;
}
