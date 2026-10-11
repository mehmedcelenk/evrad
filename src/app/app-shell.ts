import { icons } from "../shared/icons";
import { html, type RawHtml } from "../shared/safe-html";
import type { AppStore } from "./store";
import { bindEvradScreenEvents, renderEvradScreen } from "../features/evrad/evrad-screen";
import { bindSettingsScreenEvents, renderSettingsScreen } from "../features/settings/settings-screen";
import { bindQuickAddEvents, renderQuickAddDialog } from "../features/evrad/quick-add";
import { bindDhikrEditorEvents, renderDhikrEditorDialog } from "../features/editor/dhikr-editor";
import { bindDeleteDialogEvents, renderDeleteDialog } from "../features/editor/delete-dialog";
import { navigateTo } from "./router";
import { t } from "../shared/i18n";

export function renderAppShell(store: AppStore): RawHtml {
  const state = store.getState();
  const isVirds = state.activeSection === "virds";
  const isSettings = state.activeSection === "settings";
  const isEdit = Boolean(state.editingItem && state.entries.some((e) => e.id === state.editingItem!.id));

  return html`
    <main class="app-shell">
      <div class="ambient ambient-one"></div>
      <div class="ambient ambient-two"></div>
      ${isSettings ? renderSettingsScreen(store) : renderEvradScreen(store)}

      <nav class="bottom-navigation" aria-label="${t("menu.label")}">
        <div class="bottom-base-row">
          <button type="button" class="bottom-nav-button bottom-space-option${isVirds ? " is-selected" : ""}" data-nav="virds" title="${t("menu.virds")}" aria-label="${t("menu.virds")}">${icons.virds(18, 1.8)}</button>
          <button type="button" class="bottom-nav-button bottom-add" data-nav="add" title="${t("menu.addBag")}" aria-label="${t("menu.addBag")}">${icons.plus(18, 1.8)}</button>
          <button type="button" class="bottom-nav-button bottom-settings${isSettings ? " is-selected" : ""}" data-nav="settings" title="${t("menu.settings")}" aria-label="${t("menu.settings")}">${icons.settings(18, 1.8)}</button>
        </div>
      </nav>

      ${renderQuickAddDialog(state.quickAddOpen)}
      ${renderDhikrEditorDialog(state.editingItem, isEdit)}
      ${renderDeleteDialog(state.deletingItem)}
    </main>
  `;
}

/** `shell` is the freshly rendered root element, so listeners never accumulate across renders. */
export function bindAppShellEvents(shell: HTMLElement, store: AppStore): void {
  const screen = shell.querySelector(".module-screen") as HTMLElement | null;
  if (screen) {
    if (store.getState().activeSection === "settings") bindSettingsScreenEvents(screen, store);
    else bindEvradScreenEvents(screen, store);
  }
  bindQuickAddEvents(shell, store);
  bindDhikrEditorEvents(shell, store);
  bindDeleteDialogEvents(shell, store);

  shell.querySelectorAll<HTMLElement>("[data-nav]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const nav = btn.getAttribute("data-nav");
      if (nav === "virds") navigateTo("virds");
      else if (nav === "settings") navigateTo("settings");
      else if (nav === "add") store.setState(() => ({ quickAddOpen: true }));
    }));

  const closers: Record<string, () => void> = {
    "quick-add": () => store.setState(() => ({ quickAddOpen: false })),
    editor: () => store.setState(() => ({ editingItem: null })),
    delete: () => store.setState(() => ({ deletingItem: null })),
  };
  shell.querySelectorAll<HTMLDialogElement>("dialog[data-dialog]").forEach((dialog) => {
    const close = closers[dialog.dataset.dialog ?? ""];
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close?.(); });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close?.(); });
    dialog.showModal();
    (dialog.querySelector("[data-initial-focus]") as HTMLElement | null)?.focus();
  });
}
