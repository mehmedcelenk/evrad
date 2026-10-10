"use client";

import {
  CollapsedCardSummary,
  CompletionLight,
  TargetBadge,
  TrackableCardShell,
  type SortHandleHandlers,
} from "../../components/TrackerPrimitives";
import type { CollectionId } from "../../core/collections";
import { ModuleGlyph } from "../../components/ModuleGlyph";
import { t } from "../../core/i18n";
import type { DevotionalItem, DevotionalModuleId } from "../../core/types";
import { getDevotionalDisplay } from "../../core/devotional";
import { DevotionalDetails } from "./DevotionalDetails";
import { getRecordIcon } from "../../core/record-categories";
import { Pencil, Trash2 } from "lucide-react";

interface DevotionalCardProps {
  cardId?: string;
  item: DevotionalItem;
  moduleId: DevotionalModuleId;
  complete: boolean;
  expanded: boolean;
  dragging: boolean;
  dragOffsetY: number;
  onToggleExpanded: () => void;
  onToggleComplete: () => void;
  onChangeFont: (direction: -1 | 1) => void;
  onEdit: () => void;
  sortHandleProps?: SortHandleHandlers;
  collection: CollectionId;
  inVirds?: boolean;
  onToggleVird: () => void;
  onRemoveFromCollections: () => void;
}

export function DevotionalCard(props: DevotionalCardProps) {
  const { item } = props;
  const display = getDevotionalDisplay(item);
  return (
    <TrackableCardShell
      id={props.cardId ?? item.id}
      complete={props.complete}
      expanded={props.expanded}
      dragging={props.dragging}
      dragOffsetY={props.dragOffsetY}
      marker={<ModuleGlyph icon={getRecordIcon(item, props.moduleId)} />}
      targetBadge={<TargetBadge count={item.targetCount} unit={item.targetUnit} unitLabel={item.targetUnitLabel} />}
      summary={(
        <CollapsedCardSummary
          sortId={props.cardId ?? item.id}
          sortProps={props.sortHandleProps}
          title={display.text}
          arabic={display.arabic}
          expanded={props.expanded}
          onToggle={props.onToggleExpanded}
        />
      )}
      trailing={(
        <CompletionLight
          complete={props.complete}
          onToggle={props.onToggleComplete}
          label={t(props.complete ? "card.undoCompleteGeneric" : "card.completeGeneric", { title: display.text })}
        />
      )}
    >
      <DevotionalDetails
        item={item}
        fontLevel={item.expandedArabicSize}
        onChangeFont={props.onChangeFont}
        actions={(
          <footer className="card-actions">
            <button type="button" className="edit-button" onClick={props.onEdit} aria-label={t("action.edit")} title={t("action.edit")}>
              <Pencil size={16} strokeWidth={1.8} />
            </button>
            <button type="button" className="danger-button" onClick={props.onRemoveFromCollections} aria-label={t("collection.remove")} title={t("collection.remove")}>
              <Trash2 size={16} strokeWidth={1.8} />
            </button>
          </footer>
        )}
      />
    </TrackableCardShell>
  );
}

