import { icons } from "../../shared/icons";
import { html, raw } from "../../shared/safe-html";
import type { DevotionalCategory, DevotionalContext } from "../../shared/types";
import type { AppStore } from "../../app/store";
import { DEVOTIONAL_CONTEXTS, RECORD_CATEGORIES } from "../../shared/record-categories";
import { t } from "../../shared/i18n";
import { bindCardEvents, renderDhikrCard } from "./dhikr-card";

export function renderEvradScreen(store: AppStore): string {
  const state = store.getState();

  // Filter entries
  const visibleEntries = state.entries.filter((entry) => {
    if (state.selectedCategories.length > 0) {
      if (!entry.category || !state.selectedCategories.includes(entry.category)) {
        return false;
      }
    }
    if (state.selectedContexts.length > 0) {
      const hasMatch = entry.contexts.some((ctx) => state.selectedContexts.includes(ctx));
      if (!hasMatch) return false;
    }
    return true;
  });

  return html`
    <div class="module-screen evrad-screen">
      <header class="screen-heading">
        <div class="screen-heading-row">
          <h1 class="screen-heading-title">Evrad</h1>
          <div class="screen-heading-end">
            <p class="eyebrow">Bismillah</p>
            <button
              class="filter-toggle"
              type="button"
              data-action="toggle-filter-dropdown"
              aria-label="Filtreler"
              aria-expanded="${state.filtersOpen}"
            >
              ${raw(icons.chevronDown(18, 1.8).value)}
            </button>
          </div>
        </div>

        ${state.filtersOpen
          ? html`
              <div class="header-filters-accordion is-open">
                <div class="accordion-inner">
                  <div class="category-emoji-row">
                    ${RECORD_CATEGORIES.map((cat) => {
                      const selected = state.selectedCategories.includes(cat.id);
                      return html`
                        <button
                          type="button"
                          class="category-emoji-btn${selected ? " is-selected" : ""}"
                          data-action="toggle-category"
                          data-category="${cat.id}"
                          title="${t(cat.labelKey as any)}"
                        >
                          ${cat.emoji}
                        </button>
                      `;
                    })}
                  </div>

                  <div class="context-chips-row">
                    ${DEVOTIONAL_CONTEXTS.map((ctx) => {
                      const selected = state.selectedContexts.includes(ctx.id);
                      return html`
                        <button
                          type="button"
                          class="context-chip${selected ? " is-selected" : ""}"
                          data-action="toggle-context"
                          data-context="${ctx.id}"
                        >
                          ${t(ctx.labelKey as any)}
                        </button>
                      `;
                    })}
                  </div>
                </div>
              </div>
            `
          : ""}
      </header>

      <div class="dhikr-card-list" id="dhikr-card-list">
        ${visibleEntries.length > 0
          ? visibleEntries.map((item) => renderDhikrCard(item, store)).join("")
          : html`<p class="filter-empty">${t("empty.simple")}</p>`}
      </div>
    </div>
  `;
}

export function bindEvradScreenEvents(container: HTMLElement, store: AppStore): void {
  bindCardEvents(container, store);

  container.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const actionEl = target.closest("[data-action]") as HTMLElement | null;
    if (!actionEl) return;

    const action = actionEl.getAttribute("data-action");
    if (action === "toggle-filter-dropdown") {
      store.setState((prev) => ({ filtersOpen: !prev.filtersOpen }));
    } else if (action === "toggle-category") {
      const cat = actionEl.getAttribute("data-category") as DevotionalCategory;
      if (!cat) return;
      store.setState((prev) => {
        const next = prev.selectedCategories.includes(cat)
          ? prev.selectedCategories.filter((c) => c !== cat)
          : [...prev.selectedCategories, cat];
        return { selectedCategories: next };
      });
    } else if (action === "toggle-context") {
      const ctx = actionEl.getAttribute("data-context") as DevotionalContext;
      if (!ctx) return;
      store.setState((prev) => {
        const next = prev.selectedContexts.includes(ctx)
          ? prev.selectedContexts.filter((c) => c !== ctx)
          : [...prev.selectedContexts, ctx];
        return { selectedContexts: next };
      });
    }
  });
}
