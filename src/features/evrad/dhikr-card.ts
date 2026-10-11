import { formatArabicDiacritics } from "../../shared/arabic-fonts";
import { icons } from "../../shared/icons";
import { t } from "../../shared/i18n";
import { html, raw, type RawHtml } from "../../shared/safe-html";
import { RECORD_CATEGORIES } from "../../shared/record-categories";
import type { DevotionalItem } from "../../shared/types";
import type { AppStore } from "../../app/store";
import { toggleCompletion } from "../../data/completion-repository";
import { saveDhikr } from "../../data/collection-repository";
import { triggerHaptic } from "../../shared/haptics";

const FONT_SIZES = ["1.75rem", "2.1rem", "2.5rem", "2.95rem", "3.45rem"];

function targetLabel(item: DevotionalItem): string {
  if (!item.targetCount || item.targetCount <= 0) return "";
  if (item.targetUnit === "custom" && item.targetUnitLabel) {
    return t("card.customTarget", { count: item.targetCount, unit: item.targetUnitLabel });
  }
  return t("card.target", { count: item.targetCount });
}

export function renderDhikrCard(item: DevotionalItem, store: AppStore): RawHtml {
  const state = store.getState();
  const showDia = state.preferences.showDiacritics;
  const complete = state.completions.has(item.id);
  const expanded = state.expandedIds.has(item.id);
  const level = item.expandedArabicSize ?? 2;
  const arabic = item.arabic ? formatArabicDiacritics(item.arabic, showDia) : "";
  const hasName = Boolean(item.name && item.name.trim());
  const title = hasName ? item.name : arabic;
  const marker = RECORD_CATEGORIES.find((c) => c.id === item.category)?.emoji ?? "";
  const target = targetLabel(item);

  return html`
    <article class="trackable-card${complete ? " is-complete" : ""}${expanded ? " is-expanded" : ""}" data-card-id="${item.id}">
      <div class="card-top-badges">
        ${marker ? html`<span class="card-module-marker" aria-hidden="true">${marker}</span>` : ""}
        ${target ? html`<span class="card-target-badge" aria-hidden="true">${target}</span>` : ""}
      </div>
      <div class="card-collapsed-row">
        <div class="card-leading-spacer" aria-hidden="true"></div>
        <button class="card-main" type="button" data-action="toggle-expand" aria-expanded="${expanded}">
          <span class="card-summary-copy">
            <span class="${hasName ? "name-preview" : "arabic-preview"}" dir="auto">${title}</span>
          </span>
        </button>
        <button class="completion-light" type="button" data-action="toggle-complete" aria-pressed="${complete}" aria-label="${t(complete ? "card.undoCompleteGeneric" : "card.completeGeneric", { title })}">
          <span class="completion-core" aria-hidden="true"></span>
        </button>
      </div>
      <div class="accordion card-details-accordion" data-open="${expanded}" aria-hidden="${!expanded}" ${expanded ? "" : "inert"}>
        <div class="accordion-inner">
          <div class="card-expanded-content">
            ${arabic
              ? html`
                  <section class="detail-block arabic-detail">
                    <div class="detail-value">
                      <div class="font-controls">
                        <button type="button" data-action="font-smaller" aria-label="${t("detail.fontSmaller")}" ${level === 0 ? "disabled" : ""}>${icons.minus(16, 1.8)}</button>
                        <button type="button" data-action="font-larger" aria-label="${t("detail.fontLarger")}" ${level === 4 ? "disabled" : ""}>${icons.plus(16, 1.8)}</button>
                        <button type="button" class="audio-v2-btn" title="Ses (v2)" aria-label="Ses (v2)">${icons.volume(16, 1.8)}</button>
                      </div>
                      <p class="expanded-arabic" dir="auto" style="font-family: var(--font-arabic); font-size: calc(${FONT_SIZES[level]} * var(--text-scale, 1)); line-height: var(--arabic-line-height, 1.72);">${arabic}</p>
                    </div>
                  </section>
                `
              : ""}
            ${item.translation && state.preferences.showTranslations
              ? html`<section class="detail-block"><div class="detail-value"><p>${item.translation}</p></div></section>`
              : ""}
            ${item.details ? html`<section class="detail-block"><div class="detail-value"><p class="details-copy">${item.details}</p></div></section>` : ""}
            ${item.source ? html`<section class="detail-block"><div class="detail-value"><p>${item.source}</p></div></section>` : ""}
            <footer class="card-actions">
              <button type="button" class="edit-button" data-action="edit" title="${t("action.edit")}" aria-label="${t("action.edit")}">${icons.pencil(16, 1.8)}</button>
              <button type="button" class="danger-button" data-action="delete" title="${t("collection.remove")}" aria-label="${t("collection.remove")}">${icons.trash(16, 1.8)}</button>
            </footer>
          </div>
        </div>
      </div>
    </article>
  `;
}

export function bindCardEvents(container: HTMLElement, store: AppStore): void {
  container.addEventListener("click", async (event) => {
    const actionEl = (event.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    const card = actionEl?.closest("[data-card-id]") as HTMLElement | null;
    const id = card?.getAttribute("data-card-id");
    if (!actionEl || !id) return;

    const state = store.getState();
    const item = state.entries.find((e) => e.id === id);
    if (!item) return;
    const action = actionEl.getAttribute("data-action");

    if (action === "toggle-complete") {
      triggerHaptic(state.preferences.hapticEnabled, 25);
      const done = await toggleCompletion(id, state.dateKey);
      store.setState((prev) => {
        const next = new Set(prev.completions);
        if (done) next.add(id); else next.delete(id);
        return { completions: next };
      });
    } else if (action === "toggle-expand") {
      triggerHaptic(state.preferences.hapticEnabled, 10);
      store.setState((prev) => {
        const next = new Set(prev.expandedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        return { expandedIds: next };
      });
    } else if (action === "font-smaller" || action === "font-larger") {
      const delta = action === "font-larger" ? 1 : -1;
      item.expandedArabicSize = Math.max(0, Math.min(4, (item.expandedArabicSize ?? 2) + delta)) as 0 | 1 | 2 | 3 | 4;
      await saveDhikr(item);
      store.setState((prev) => ({ entries: [...prev.entries] }));
    } else if (action === "edit") {
      store.setState(() => ({ editingItem: item }));
    } else if (action === "delete") {
      store.setState(() => ({ deletingItem: item }));
    }
  });
}

export { raw };
