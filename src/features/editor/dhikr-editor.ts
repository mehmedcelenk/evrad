import { html } from "../../shared/safe-html";
import type { DevotionalItem } from "../../shared/types";
import type { AppStore } from "../../app/store";
import { saveDhikr } from "../../data/collection-repository";
import { t } from "../../shared/i18n";
import { triggerHaptic } from "../../shared/haptics";

export function renderDhikrEditorModal(item: DevotionalItem | null): string {
  if (!item) return "";

  const isEdit = Boolean(item.id && !item.id.startsWith("dhikr-"));

  return html`
    <div class="modal-backdrop" id="editor-modal-backdrop">
      <div class="modal-dialog editor-dialog">
        <header class="modal-header">
          <h2 class="modal-title">${isEdit ? "Düzenle" : "Yeni Zikir Ekle"}</h2>
          <button type="button" class="modal-close-btn" data-action="close-editor">×</button>
        </header>

        <form id="dhikr-editor-form" class="editor-form">
          <div class="form-field">
            <label class="form-label">${t("editor.name")}</label>
            <input
              type="text"
              name="name"
              class="form-input"
              value="${item.name || ""}"
              placeholder="${t("editor.namePlaceholder")}"
            />
          </div>

          <div class="form-field">
            <label class="form-label">${t("editor.arabic")}</label>
            <textarea
              name="arabic"
              class="form-textarea arabic-input"
              dir="rtl"
              placeholder="${t("editor.arabicPlaceholder")}"
            >${item.arabic || ""}</textarea>
          </div>

          <div class="form-field">
            <label class="form-label">${t("editor.translation")}</label>
            <textarea
              name="translation"
              class="form-textarea"
              placeholder="${t("editor.translationPlaceholder")}"
            >${item.translation || ""}</textarea>
          </div>

          <div class="form-field">
            <label class="form-label">${t("editor.details")}</label>
            <textarea
              name="details"
              class="form-textarea"
              placeholder="${t("editor.detailsPlaceholder")}"
            >${item.details || ""}</textarea>
          </div>

          <div class="form-field">
            <label class="form-label">${t("editor.source")}</label>
            <input
              type="text"
              name="source"
              class="form-input"
              value="${item.source || ""}"
              placeholder="${t("editor.sourcePlaceholder")}"
            />
          </div>

          <div class="form-field">
            <label class="form-label">${t("editor.targetNumber")}</label>
            <input
              type="number"
              name="targetCount"
              class="form-input"
              value="${item.targetCount || 1}"
              min="1"
            />
          </div>

          <footer class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="close-editor">${t("action.cancel")}</button>
            <button type="submit" class="btn btn-primary">${t("action.save")}</button>
          </footer>
        </form>
      </div>
    </div>
  `;
}

export function bindDhikrEditorEvents(container: HTMLElement, store: AppStore): void {
  const form = container.querySelector("#dhikr-editor-form") as HTMLFormElement | null;
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const state = store.getState();
      const item = state.editingItem;
      if (!item) return;

      const formData = new FormData(form);
      const name = (formData.get("name") as string || "").trim();
      const arabic = (formData.get("arabic") as string || "").trim();
      const translation = (formData.get("translation") as string || "").trim();
      const details = (formData.get("details") as string || "").trim();
      const source = (formData.get("source") as string || "").trim();
      const targetCount = parseInt(formData.get("targetCount") as string || "1", 10);

      if (!name && !arabic) {
        alert(t("editor.identityError"));
        return;
      }

      triggerHaptic(state.preferences.hapticEnabled, 25);
      const updatedItem: DevotionalItem = {
        ...item,
        name: name || arabic,
        arabic: arabic || undefined,
        translation: translation || undefined,
        details: details || undefined,
        source: source || undefined,
        targetCount: isNaN(targetCount) ? 1 : targetCount,
      };

      const saved = await saveDhikr(updatedItem);
      store.setState((prev) => {
        const index = prev.entries.findIndex((e) => e.id === saved.id);
        let nextEntries = [...prev.entries];
        if (index >= 0) {
          nextEntries[index] = saved;
        } else {
          nextEntries = [saved, ...nextEntries];
        }
        return { entries: nextEntries, editingItem: null };
      });
    });
  }

  container.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.id === "editor-modal-backdrop" || target.closest("[data-action='close-editor']")) {
      store.setState(() => ({ editingItem: null }));
    }
  });
}
