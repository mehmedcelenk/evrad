import { icons } from "../../shared/icons";
import { html, raw, type RawHtml } from "../../shared/safe-html";
import { t } from "../../shared/i18n";
import type { AppStore } from "../../app/store";
import { saveDhikr } from "../../data/collection-repository";
import { triggerHaptic } from "../../shared/haptics";
import type { DevotionalItem } from "../../shared/types";

export function newDraft(name: string): DevotionalItem {
  return {
    id: "dhikr-" + Date.now(),
    name,
    targetCount: 0,
    targetUnit: "count",
    contexts: ["general"],
    inVirds: true,
    inBag: true,
    expandedArabicSize: 2,
    category: "dhikr",
  };
}

export function renderQuickAddDialog(open: boolean): RawHtml {
  if (!open) return raw("");
  return html`
    <dialog class="dialog-layer quick-add-layer" data-dialog="quick-add" aria-label="${t("quickAdd.title")}">
      <div class="dialog-surface">
        <div class="quick-add-card">
          <form class="quick-add-body" id="quick-add-form">
            <div class="quick-add-input-row">
              <input data-initial-focus type="text" class="quick-add-input" id="quick-add-input"
                placeholder="${t("quickAdd.placeholder")}" aria-label="${t("quickAdd.placeholder")}" dir="auto" autocomplete="off" />
              <div class="quick-add-icon-actions">
                <button type="button" class="quick-add-icon-btn" data-action="open-detail-editor" title="Detaylandır" aria-label="Detaylandır">${icons.sliders(18, 1.8)}</button>
                <button type="submit" class="quick-add-icon-btn is-save" title="${t("action.save")}" aria-label="${t("action.save")}">${icons.check(20, 2.2)}</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  `;
}

export function bindQuickAddEvents(container: HTMLElement, store: AppStore): void {
  const form = container.querySelector("#quick-add-form") as HTMLFormElement | null;
  const input = container.querySelector("#quick-add-input") as HTMLInputElement | null;
  if (!form || !input) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    triggerHaptic(store.getState().preferences.hapticEnabled, 25);
    const saved = await saveDhikr(newDraft(value));
    store.setState((prev) => ({ entries: [saved, ...prev.entries], quickAddOpen: false }));
  });

  form.querySelector("[data-action='open-detail-editor']")?.addEventListener("click", () => {
    const draft = newDraft(input.value.trim());
    store.setState(() => ({ quickAddOpen: false, editingItem: draft }));
  });
}
