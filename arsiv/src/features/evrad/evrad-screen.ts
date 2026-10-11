import { icons } from "../../shared/icons";
import { html, type RawHtml } from "../../shared/safe-html";
import { t } from "../../shared/i18n";
import type { DevotionalCategory, DevotionalContext } from "../../shared/types";
import { DEVOTIONAL_CONTEXTS, RECORD_CATEGORIES } from "../../shared/record-categories";
import type { AppStore } from "../../app/store";
import { bindCardEvents, renderDhikrCard } from "./dhikr-card";

export function renderEvradScreen(store: AppStore): RawHtml {
  const state = store.getState();
  const visible = state.entries.filter((entry) => {
    if (state.selectedCategories.length && (!entry.category || !state.selectedCategories.includes(entry.category))) return false;
    if (state.selectedContexts.length && !entry.contexts.some((c) => state.selectedContexts.includes(c))) return false;
    return true;
  });

  return html`
    <section class="module-screen">
      <header class="screen-heading">
        <div class="screen-heading-row">
          <h1 class="screen-heading-title">${t("module.dhikr.title")}</h1>
          <div class="screen-heading-end">
            <p class="eyebrow">${t("module.dhikr.eyebrow")}</p>
            <button class="filter-toggle" type="button" data-action="toggle-filter-dropdown" aria-label="${t("filter.contexts")}" aria-expanded="${state.filtersOpen}">
              ${icons.chevronDown(18, 1.8)}
            </button>
          </div>
        </div>
        <div class="accordion header-filters-accordion" data-open="${state.filtersOpen}" aria-hidden="${!state.filtersOpen}" ${state.filtersOpen ? "" : "inert"}>
          <div class="accordion-inner">
            <div class="category-emoji-bar" role="group">
              ${RECORD_CATEGORIES.map((cat) => html`
                <button type="button" class="category-emoji-btn${state.selectedCategories.includes(cat.id) ? " is-selected" : ""}"
                  data-action="toggle-category" data-category="${cat.id}" aria-pressed="${state.selectedCategories.includes(cat.id)}">
                  <span class="emoji-icon">${cat.emoji}</span>
                </button>`)}
            </div>
            <div class="context-chips" role="group" aria-label="${t("filter.contexts")}">
              ${DEVOTIONAL_CONTEXTS.map((ctx) => html`
                <button type="button" class="context-chip is-${ctx.id}${state.selectedContexts.includes(ctx.id) ? " is-selected" : ""}"
                  data-action="toggle-context" data-context="${ctx.id}" aria-pressed="${state.selectedContexts.includes(ctx.id)}">
                  ${t(ctx.labelKey as Parameters<typeof t>[0])}
                </button>`)}
            </div>
          </div>
        </div>
      </header>
      ${visible.length
        ? html`<div class="trackable-list">${visible.map((item) => renderDhikrCard(item, store))}</div>`
        : html`<p class="empty-state">${t("empty.simple")}</p>`}
      <p class="quiet-note">${t("app.lightNote")}</p>
    </section>
  `;
}

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function bindEvradScreenEvents(container: HTMLElement, store: AppStore): void {
  bindCardEvents(container, store);
  container.addEventListener("click", (event) => {
    const el = (event.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!el) return;
    const action = el.getAttribute("data-action");
    if (action === "toggle-filter-dropdown") {
      store.setState((prev) => ({ filtersOpen: !prev.filtersOpen }));
    } else if (action === "toggle-category") {
      const cat = el.getAttribute("data-category") as DevotionalCategory;
      store.setState((prev) => ({ selectedCategories: toggleIn(prev.selectedCategories, cat) }));
    } else if (action === "toggle-context") {
      const ctx = el.getAttribute("data-context") as DevotionalContext;
      store.setState((prev) => ({ selectedContexts: toggleIn(prev.selectedContexts, ctx) }));
    }
  });
}
