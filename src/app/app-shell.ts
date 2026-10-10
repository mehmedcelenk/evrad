import { icons } from "../shared/icons";
import { html, raw } from "../shared/safe-html";
import type { AppStore } from "./store";
import { bindEvradScreenEvents, renderEvradScreen } from "../features/evrad/evrad-screen";
import { bindSettingsScreenEvents, renderSettingsScreen } from "../features/settings/settings-screen";
import { bindQuickAddEvents, renderQuickAddBar } from "../features/evrad/quick-add";
import { bindDhikrEditorEvents, renderDhikrEditorModal } from "../features/editor/dhikr-editor";
import { bindDeleteDialogEvents, renderDeleteDialogModal } from "../features/editor/delete-dialog";
import { navigateTo } from "./router";
import { t } from "../shared/i18n";

export function renderAppShell(store: AppStore): string {
  const state = store.getState();
  const isVirds = state.activeSection === "virds";
  const isSettings = state.activeSection === "settings";

  return html`
    <div class="app-layout">
      <main class="main-content-view" id="main-content-view">
        ${isSettings ? renderSettingsScreen(store) : renderEvradScreen(store)}
      </main>

      ${isVirds ? renderQuickAddBar() : ""}

      <nav class="bottom-navigation" aria-label="Bölümler">
        <div class="bottom-base-row">
          <button
            type="button"
            class="bottom-nav-button bottom-space-option${isVirds ? " is-selected" : ""}"
            data-action="nav-virds"
            title="${t("menu.virds")}"
          >
            ${raw(icons.virds(18, 1.8).value)}
          </button>

          <button
            type="button"
            class="bottom-nav-button bottom-add"
            data-action="nav-add"
            title="${t("menu.addBag")}"
          >
            ${raw(icons.plus(18, 1.8).value)}
          </button>

          <button
            type="button"
            class="bottom-nav-button bottom-settings${isSettings ? " is-selected" : ""}"
            data-action="nav-settings"
            title="${t("menu.settings")}"
          >
            ${raw(icons.settings(18, 1.8).value)}
          </button>
        </div>
      </nav>

      <div id="modal-container">
        ${renderDhikrEditorModal(state.editingItem)}
        ${renderDeleteDialogModal(state.deletingItem)}
      </div>
    </div>
  `;
}

export function bindAppShellEvents(root: HTMLElement, store: AppStore): void {
  const mainView = root.querySelector("#main-content-view") as HTMLElement | null;
  if (mainView) {
    const state = store.getState();
    if (state.activeSection === "settings") {
      bindSettingsScreenEvents(mainView, store);
    } else {
      bindEvradScreenEvents(mainView, store);
    }
  }

  bindQuickAddEvents(root, store);

  const modalContainer = root.querySelector("#modal-container") as HTMLElement | null;
  if (modalContainer) {
    bindDhikrEditorEvents(modalContainer, store);
    bindDeleteDialogEvents(modalContainer, store);
  }

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const navBtn = target.closest("[data-action]") as HTMLElement | null;
    if (!navBtn) return;

    const action = navBtn.getAttribute("data-action");
    if (action === "nav-virds") {
      navigateTo("virds");
    } else if (action === "nav-settings") {
      navigateTo("settings");
    } else if (action === "nav-add") {
      store.setState(() => ({
        editingItem: {
          id: "dhikr-" + Date.now(),
          name: "",
          targetCount: 1,
          targetUnit: "count",
          contexts: ["general"],
          inVirds: true,
          inBag: true,
          expandedArabicSize: 2,
          category: "dhikr",
        },
      }));
    }
  });
}
