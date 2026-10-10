import { icons } from "../../shared/icons";
import { html, raw } from "../../shared/safe-html";
import type { AppStore } from "../../app/store";
import { saveDhikr } from "../../data/collection-repository";
import { triggerHaptic } from "../../shared/haptics";

export function renderQuickAddBar(): string {
  return html`
    <div class="quick-add-layer">
      <div class="quick-add-bar">
        <button type="button" class="icon-button icon-only" data-action="open-detail-editor" title="Detaylandır">
          ${raw(icons.sliders(18, 1.8).value)}
        </button>
        <input type="text" class="quick-add-input" id="quick-add-input" placeholder="Zikir veya dua adı yazın..." autocomplete="off" />
        <button type="button" class="icon-button icon-only primary-check-btn" data-action="save-quick-add" title="Hızlı Kaydet">
          ${raw(icons.check(18, 2.5).value)}
        </button>
      </div>
    </div>
  `;
}

export function bindQuickAddEvents(container: HTMLElement, store: AppStore): void {
  container.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const actionBtn = target.closest("[data-action]") as HTMLElement | null;
    if (!actionBtn) return;

    const action = actionBtn.getAttribute("data-action");
    const input = container.querySelector("#quick-add-input") as HTMLInputElement | null;
    const value = input?.value.trim() || "";

    if (action === "save-quick-add") {
      if (!value) return;
      const state = store.getState();
      triggerHaptic(state.preferences.hapticEnabled, 25);
      const newItem = await saveDhikr({
        id: "dhikr-" + Date.now(),
        name: value,
        targetCount: 1,
        targetUnit: "count",
        contexts: ["general"],
        inVirds: true,
        inBag: true,
        expandedArabicSize: 2,
        category: "dhikr",
      });
      if (input) input.value = "";
      store.setState((prev) => ({ entries: [newItem, ...prev.entries] }));
    } else if (action === "open-detail-editor") {
      store.setState(() => ({
        editingItem: {
          id: "dhikr-" + Date.now(),
          name: value,
          targetCount: 1,
          targetUnit: "count",
          contexts: ["general"],
          inVirds: true,
          inBag: true,
          expandedArabicSize: 2,
          category: "dhikr",
        },
      }));
      if (input) input.value = "";
    }
  });

  const input = container.querySelector("#quick-add-input") as HTMLInputElement | null;
  if (input) {
    input.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        const state = store.getState();
        triggerHaptic(state.preferences.hapticEnabled, 25);
        const newItem = await saveDhikr({
          id: "dhikr-" + Date.now(),
          name: value,
          targetCount: 1,
          targetUnit: "count",
          contexts: ["general"],
          inVirds: true,
          inBag: true,
          expandedArabicSize: 2,
          category: "dhikr",
        });
        input.value = "";
        store.setState((prev) => ({ entries: [newItem, ...prev.entries] }));
      }
    });
  }
}
