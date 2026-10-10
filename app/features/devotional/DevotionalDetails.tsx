"use client";

import type { ReactNode } from "react";
import { Volume2, Plus, Minus } from "lucide-react";
import { DetailBlock, ExpandableCardContent } from "../../components/TrackerPrimitives";
import { containsArabic } from "../../core/devotional-draft";
import { t } from "../../core/i18n";
import type { DevotionalItem } from "../../core/types";
import { useAppRuntime } from "../../core/AppRuntimeContext";
import { formatArabicDiacritics } from "../../core/arabic-fonts";

const fontSizes = ["1.75rem", "2.1rem", "2.5rem", "2.95rem", "3.45rem"];

export function DevotionalDetails({
  item,
  fontLevel,
  onChangeFont,
  actions,
}: {
  item: Pick<DevotionalItem, "name" | "arabic" | "translation" | "details" | "source">;
  fontLevel: 0 | 1 | 2 | 3 | 4;
  onChangeFont: (direction: -1 | 1) => void;
  actions?: ReactNode;
}) {
  const { showDiacritics, showTranslations } = useAppRuntime();

  const isNameArabic = Boolean(item.name && containsArabic(item.name));
  const displayName = isNameArabic && item.name ? formatArabicDiacritics(item.name, showDiacritics) : item.name;

  return (
    <ExpandableCardContent>
      {item.name ? (
        <DetailBlock>
          <p className={isNameArabic ? "arabic-text" : undefined} dir="auto" style={isNameArabic ? { fontFamily: "var(--font-arabic)" } : undefined}>
            {displayName}
          </p>
        </DetailBlock>
      ) : null}
      {item.arabic ? (
        <DetailBlock className="arabic-detail">
          <div className="font-controls">
            <button type="button" onClick={() => onChangeFont(-1)} aria-label={t("detail.fontSmaller")} title={t("detail.fontSmaller")} disabled={fontLevel === 0}>
              <Minus size={16} strokeWidth={1.8} />
            </button>
            <button type="button" onClick={() => onChangeFont(1)} aria-label={t("detail.fontLarger")} title={t("detail.fontLarger")} disabled={fontLevel === 4}>
              <Plus size={16} strokeWidth={1.8} />
            </button>
            <button type="button" className="audio-v2-btn" title="Ses (v2)" aria-label="Ses dinle (v2)">
              <Volume2 size={16} strokeWidth={1.8} />
            </button>
          </div>
          <p className="expanded-arabic" dir="auto" style={{ fontFamily: "var(--font-arabic)", fontSize: `calc(${fontSizes[fontLevel]} * var(--text-scale, 1))`, lineHeight: "var(--arabic-line-height, 1.72)" }}>
            {formatArabicDiacritics(item.arabic, showDiacritics)}
          </p>
        </DetailBlock>
      ) : null}
      {item.translation && showTranslations ? <DetailBlock><p>{item.translation}</p></DetailBlock> : null}
      {item.details ? <DetailBlock><p className="details-copy">{item.details}</p></DetailBlock> : null}
      {item.source ? <DetailBlock><p>{item.source}</p></DetailBlock> : null}
      {actions}
    </ExpandableCardContent>
  );
}

