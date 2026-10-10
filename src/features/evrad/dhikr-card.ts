import { formatArabicDiacritics } from "../../shared/arabic-fonts";
import { icons } from "../../shared/icons";
import { html, raw } from "../../shared/safe-html";
import type { DevotionalItem } from "../../shared/types";
import type { AppStore } from "../../app/store";
import { toggleCompletion } from "../../data/completion-repository";
import { triggerHaptic } from "../../shared/haptics";
import { saveDhikr } from "../../data/collection-repository";

export function renderDhikrCard(item: DevotionalItem, store: AppStore): string {
  const state = store.getState();
  const isCompleted = state.completions.has(item.id);
  const isExpanded = state.expandedIds.has(item.id);

  const fontLevel = item.expandedArabicSize ?? 2;
  const fontSizes = ["1.75rem", "2.1rem", "2.5rem", "2.95rem", "3.45rem"];
  const currentFontSize = fontSizes[fontLevel];

  const displayName = formatArabicDiacritics(item.name, state.preferences.showDiacritics);
  const displayArabic = item.arabic ? formatArabicDiacritics(item.arabic, state.preferences.showDiacritics) : "";

  return html`
    <article class="tracker-card${isCompleted ? " is-complete" : ""}${isExpanded ? " is-expanded" : ""}" data-card-id="${item.id}">
      <div class="card-shell">
        <div class="card-main" data-action="toggle-expand">
          <div class="collapsed-card-summary">
            <h3 class="card-title">${displayName}</h3>
            ${displayArabic ? html`<p class="card-arabic-preview" dir="rtl">${displayArabic}</p>` : ""}
          </div>
          <div class="card-target-badge">
            ${item.targetCount ? html`<span class="target-chip">${item.targetCount} ${item.targetUnitLabel || "kez"}</span>` : html`<span class="target-chip">∞</span>`}
          </div>
        </div>

        <button type="button" class="completion-light${isCompleted ? " is-checked" : ""}" data-action="toggle-complete" aria-label="Tamamla">
          <span class="completion-check">${isCompleted ? raw(icons.check(14, 2.5).value) : ""}</span>
        </button>
      </div>

      ${isExpanded
        ? html`
            <div class="card-expanded-content">
              ${item.arabic
                ? html`
                    <div class="detail-block arabic-detail">
                      <div class="font-controls">
                        <button type="button" data-action="font-smaller" ${fontLevel === 0 ? "disabled" : ""}>
                          ${raw(icons.minus(16, 1.8).value)}
                        </button>
                        <button type="button" data-action="font-larger" ${fontLevel === 4 ? "disabled" : ""}>
                          ${raw(icons.plus(16, 1.8).value)}
                        </button>
                        <button type="button" class="audio-v2-btn" data-action="audio">
                          ${raw(icons.volume(16, 1.8).value)}
                        </button>
                      </div>
                      <p class="expanded-arabic" dir="rtl" style="font-size: calc(${currentFontSize} * var(--text-scale, 1)); line-height: var(--arabic-line-height, 1.72);">
                        ${displayArabic}
                      </p>
                    </div>
                  `
                : ""}
              ${item.translation && state.preferences.showTranslations
                ? html`<div class="detail-block"><p>${item.translation}</p></div>`
                : ""}
              ${item.details ? html`<div class="detail-block"><p class="details-copy">${item.details}</p></div>` : ""}
              ${item.source ? html`<div class="detail-block"><p class="detail-source">${item.source}</p></div>` : ""}

              <footer class="card-actions">
                <button type="button" class="edit-button" data-action="edit" title="Düzenle">
                  ${raw(icons.pencil(16, 1.8).value)}
                </button>
                <button type="button" class="danger-button" data-action="delete" title="Sil">
                  ${raw(icons.trash(16, 1.8).value)}
                </button>
              </footer>
            </div>
          `
        : ""}
    </article>
  `;
}

export function bindCardEvents(container: HTMLElement, store: AppStore): void {
  container.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const actionEl = target.closest("[data-action]") as HTMLElement | null;
    if (!actionEl) return;

    const card = actionEl.closest("[data-card-id]") as HTMLElement | null;
    if (!card) return;

    const id = card.getAttribute("data-card-id");
    if (!id) return;

    const action = actionEl.getAttribute("data-action");
    const state = store.getState();
    const item = state.entries.find((e) => e.id === id);
    if (!item) return;

    if (action === "toggle-complete") {
      triggerHaptic(state.preferences.hapticEnabled, 25);
      const isDone = await toggleCompletion(id, state.dateKey);
      store.setState((prev) => {
        const next = new Set(prev.completions);
        if (isDone) next.add(id);
        else next.delete(id);
        return { completions: next };
      });
    } else if (action === "toggle-expand") {
      triggerHaptic(state.preferences.hapticEnabled, 10);
      store.setState((prev) => {
        const next = new Set(prev.expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { expandedIds: next };
      });
    } else if (action === "font-smaller") {
      const newLevel = Math.max(0, (item.expandedArabicSize ?? 2) - 1) as 0 | 1 | 2 | 3 | 4;
      item.expandedArabicSize = newLevel;
      await saveDhikr(item);
      store.setState((prev) => ({ entries: [...prev.entries] }));
    } else if (action === "font-larger") {
      const newLevel = Math.min(4, (item.expandedArabicSize ?? 2) + 1) as 0 | 1 | 2 | 3 | 4;
      item.expandedArabicSize = newLevel;
      await saveDhikr(item);
      store.setState((prev) => ({ entries: [...prev.entries] }));
    } else if (action === "edit") {
      store.setState(() => ({ editingItem: item }));
    } else if (action === "delete") {
      store.setState(() => ({ deletingItem: item }));
    }
  });
}
