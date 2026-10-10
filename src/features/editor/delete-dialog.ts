import { html } from "../../shared/safe-html";
import type { DevotionalItem } from "../../shared/types";
import type { AppStore } from "../../app/store";
import { deleteDhikr } from "../../data/collection-repository";
import { t } from "../../shared/i18n";
import { triggerHaptic } from "../../shared/haptics";

export function renderDeleteDialogModal(item: DevotionalItem | null): string {
  if (!item) return "";

  const title = item.name || item.arabic || "";

  return html`
    <div class="modal-backdrop" id="delete-modal-backdrop">
      <div class="modal-dialog delete-dialog">
        <header class="modal-header">
          <h2 class="modal-title">${t("delete.genericTitle")}</h2>
        </header>

        <div class="modal-body">
          <p>${t("delete.genericBody", { title })}</p>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn btn-secondary" data-action="cancel-delete">${t("action.cancel")}</button>
          <button type="button" class="btn btn-danger" data-action="confirm-delete">${t("delete.confirm")}</button>
        </footer>
      </div>
    </div>
  `;
}

export function bindDeleteDialogEvents(container: HTMLElement, store: AppStore): void {
  container.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    if (target.closest("[data-action='confirm-delete']")) {
      const state = store.getState();
      const item = state.deletingItem;
      if (!item) return;

      triggerHaptic(state.preferences.hapticEnabled, 30);
      await deleteDhikr(item.id);

      store.setState((prev) => ({
        entries: prev.entries.filter((e) => e.id !== item.id),
        deletingItem: null,
      }));
    } else if (target.id === "delete-modal-backdrop" || target.closest("[data-action='cancel-delete']")) {
      store.setState(() => ({ deletingItem: null }));
    }
  });
}
