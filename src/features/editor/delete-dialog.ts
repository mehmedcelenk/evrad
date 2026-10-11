import { html, raw, type RawHtml } from "../../shared/safe-html";
import type { DevotionalItem } from "../../shared/types";
import type { AppStore } from "../../app/store";
import { deleteDhikr } from "../../data/collection-repository";
import { t } from "../../shared/i18n";
import { triggerHaptic } from "../../shared/haptics";

export function renderDeleteDialog(item: DevotionalItem | null): RawHtml {
  if (!item) return raw("");
  const title = item.name || item.arabic || "";
  return html`
    <dialog class="dialog-layer confirmation-layer" data-dialog="delete" role="alertdialog" aria-label="${t("delete.genericTitle")}">
      <div class="dialog-surface">
        <div class="confirmation-modal">
          <h2>${t("delete.genericTitle")}</h2>
          <div class="confirmation-copy"><p>${t("delete.genericBody", { title })}</p></div>
          <div class="confirmation-actions">
            <button class="secondary-button" type="button" data-action="cancel-delete">${t("action.cancel")}</button>
            <button class="danger-button" type="button" data-action="confirm-delete">${t("delete.confirm")}</button>
          </div>
        </div>
      </div>
    </dialog>
  `;
}

export function bindDeleteDialogEvents(container: HTMLElement, store: AppStore): void {
  container.querySelector("[data-action='cancel-delete']")?.addEventListener("click", () =>
    store.setState(() => ({ deletingItem: null })));

  container.querySelector("[data-action='confirm-delete']")?.addEventListener("click", async () => {
    const state = store.getState();
    const item = state.deletingItem;
    if (!item) return;
    triggerHaptic(state.preferences.hapticEnabled, 30);
    await deleteDhikr(item.id);
    store.setState((prev) => ({ entries: prev.entries.filter((e) => e.id !== item.id), deletingItem: null }));
  });
}
