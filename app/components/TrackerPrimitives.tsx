import { type CSSProperties, type KeyboardEventHandler, type PointerEventHandler, type ReactNode } from "react";
import { Accordion } from "./Accordion";
import { t } from "../core/i18n";
import type { TargetUnit } from "../core/types";
import { PlusMinusIcon } from "./PlusMinusIcon";
import { useAppRuntime } from "../core/AppRuntimeContext";
import { triggerHaptic } from "../core/haptics";
import { formatArabicDiacritics } from "../core/arabic-fonts";

export interface SortHandleHandlers {
  onPointerDown: PointerEventHandler<HTMLElement>;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
}

export function TrackableCardShell({
  id,
  complete = false,
  expanded,
  dragging = false,
  dragOffsetY = 0,
  summary,
  leading,
  marker,
  targetBadge,
  trailing,
  children,
}: {
  id: string;
  complete?: boolean;
  expanded: boolean;
  dragging?: boolean;
  dragOffsetY?: number;
  summary: ReactNode;
  leading?: ReactNode;
  marker?: ReactNode;
  targetBadge?: ReactNode;
  trailing: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article
      className={`trackable-card${complete ? " is-complete" : ""}${expanded ? " is-expanded" : ""}${dragging ? " is-dragging" : ""}`}
      data-card-id={id}
      style={{ "--drag-offset-y": `${dragOffsetY}px` } as CSSProperties}
    >
      {(marker || targetBadge) ? (
        <div className="card-top-badges">
          {marker ? <span className="card-module-marker" aria-hidden="true">{marker}</span> : null}
          {targetBadge}
        </div>
      ) : null}
      <div className="card-collapsed-row">
        {leading ?? <div className="card-leading-spacer" aria-hidden="true" />}
        {summary}
        {trailing}
      </div>
      <Accordion open={expanded} className="card-details-accordion">{children}</Accordion>
    </article>
  );
}

export function CollapsedCardSummary({
  sortId,
  sortProps,
  title,
  arabic,
  expanded,
  onToggle,
}: {
  sortId?: string;
  sortProps?: SortHandleHandlers;
  title: string;
  arabic: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { showDiacritics } = useAppRuntime();
  const displayTitle = arabic ? formatArabicDiacritics(title, showDiacritics) : title;

  return (
    <button
      className="card-main"
      type="button"
      data-sort-id={sortId}
      onPointerDown={sortProps?.onPointerDown}
      onKeyDown={sortProps?.onKeyDown}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={t(expanded ? "card.close" : "card.open", { title })}
    >
      <span className="card-summary-copy">
        <span className={arabic ? "arabic-preview" : "name-preview"} dir="auto">{displayTitle}</span>
      </span>
    </button>
  );
}

export function TargetBadge({ count, unit, unitLabel }: { count?: number | null; unit?: TargetUnit; unitLabel?: string | null }) {
  if (count === null || count === undefined || count <= 0) return null;
  return (
    <span className="card-target-badge" aria-hidden="true">
      {unit === "custom" && unitLabel ? t("card.customTarget", { count, unit: unitLabel }) : t("card.target", { count })}
    </span>
  );
}

export function CompletionLight({
  complete,
  onToggle,
  label,
}: {
  complete: boolean;
  onToggle: () => void;
  label: string;
}) {
  const { hapticEnabled } = useAppRuntime();

  const handleToggle = () => {
    triggerHaptic(hapticEnabled, 15);
    onToggle();
  };

  return (
    <button
      className="completion-light"
      type="button"
      onClick={handleToggle}
      aria-label={label}
      aria-pressed={complete}
    >
      <span className="completion-core" aria-hidden="true" />
    </button>
  );
}



export function SortHandle({
  sortId,
  label,
  onPointerDown,
  onKeyDown,
}: {
  sortId: string;
  label: string;
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      className="drag-handle"
      type="button"
      data-sort-id={sortId}
      aria-label={label}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <i />
      <i />
      <i />
    </button>
  );
}

export function ExpandableCardContent({ children }: { children: ReactNode }) {
  return <div className="card-expanded-content">{children}</div>;
}

export function DetailBlock({
  label,
  children,
  className = "",
  style,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={`detail-block ${className}`}>
      {label ? <p className="detail-label">{label}</p> : null}
      <div className="detail-value" style={style}>{children}</div>
    </section>
  );
}
