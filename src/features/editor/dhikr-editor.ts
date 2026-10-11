import { html, raw, type RawHtml } from "../../shared/safe-html";
import { t } from "../../shared/i18n";
import { DEVOTIONAL_CONTEXTS } from "../../shared/record-categories";
import type { DevotionalContext, DevotionalItem } from "../../shared/types";
import type { AppStore } from "../../app/store";
import { saveDhikr } from "../../data/collection-repository";
import { triggerHaptic } from "../../shared/haptics";

export function renderDhikrEditorDialog(item: DevotionalItem | null, isEdit: boolean): RawHtml {
  if (!item) return raw("");
  return html`
    <dialog class="dialog-layer editor-layer" data-dialog="editor" aria-label="${isEdit ? t("action.edit") : t("menu.addBag")}">
      <div class="dialog-surface">
        <section class="editor-page">
          <header class="editor-heading">
            <div><h2>${isEdit ? t("action.edit") : t("menu.addBag")}</h2></div>
            <button class="round-icon-button" type="button" data-action="close-editor" aria-label="${t("editor.close")}">×</button>
          </header>
          <form class="entity-form" id="dhikr-editor-form">
            <label class="field-group"><span>${t("editor.name")}</span>
              <input name="name" value="${item.name || ""}" placeholder="${t("editor.namePlaceholder")}" autocomplete="off" /></label>
            <label class="field-group"><span>${t("editor.arabic")}</span>
              <textarea class="arabic-field" name="arabic" dir="auto" rows="4" placeholder="${t("editor.arabicPlaceholder")}">${item.arabic || ""}</textarea></label>
            <label class="field-group"><span>${t("editor.translation")}</span>
              <textarea name="translation" rows="3" placeholder="${t("editor.translationPlaceholder")}">${item.translation || ""}</textarea></label>
            <label class="field-group"><span>${t("editor.details")}</span>
              <textarea name="details" rows="5" placeholder="${t("editor.detailsPlaceholder")}">${item.details || ""}</textarea></label>
            <label class="field-group"><span>${t("editor.source")}</span>
              <input name="source" value="${item.source || ""}" placeholder="${t("editor.sourcePlaceholder")}" autocomplete="off" /></label>
            <section class="field-group">
              <span>${t("editor.contexts")}</span>
              <div class="context-chips" role="group" aria-label="${t("editor.contexts")}">
                ${DEVOTIONAL_CONTEXTS.map((ctx) => html`
                  <button type="button" class="context-chip is-${ctx.id}${item.contexts.includes(ctx.id) ? " is-selected" : ""}"
                    data-context-toggle="${ctx.id}" aria-pressed="${item.contexts.includes(ctx.id)}">${t(ctx.labelKey as Parameters<typeof t>[0])}</button>`)}
              </div>
            </section>
            <section class="field-group target-field">
              <span>${t("editor.target")}</span>
              <div class="target-config-row">
                <label><span>${t("editor.targetNumber")}</span>
                  <input name="targetCount" value="${item.targetCount > 0 ? item.targetCount : ""}" inputmode="numeric" pattern="[0-9]*" placeholder="${t("editor.targetNumberPlaceholder")}" /></label>
                <label><span>${t("editor.targetUnit")}</span>
                  <input name="targetUnitLabel" value="${item.targetUnitLabel || ""}" placeholder="Örn. kez, dakika, sayfa" /></label>
              </div>
            </section>
            <footer class="form-actions">
              <button class="secondary-button" type="button" data-action="close-editor">${t("action.cancel")}</button>
              <button class="primary-button" type="submit">${t("action.save")}</button>
            </footer>
          </form>
        </section>
      </div>
    </dialog>
  `;
}

export function bindDhikrEditorEvents(container: HTMLElement, store: AppStore): void {
  const form = container.querySelector("#dhikr-editor-form") as HTMLFormElement | null;
  if (!form) return;

  form.querySelectorAll<HTMLElement>("[data-context-toggle]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const on = chip.classList.toggle("is-selected");
      chip.setAttribute("aria-pressed", String(on));
    });
  });

  container.querySelectorAll("[data-action='close-editor']").forEach((btn) =>
    btn.addEventListener("click", () => store.setState(() => ({ editingItem: null }))));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const state = store.getState();
    const item = state.editingItem;
    if (!item) return;

    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? "").trim();
    const name = text("name");
    const arabic = text("arabic");
    if (!name && !arabic) { alert(t("editor.identityError")); return; }

    const count = parseInt(text("targetCount"), 10);
    const unitLabel = text("targetUnitLabel");
    const contexts = Array.from(form.querySelectorAll<HTMLElement>("[data-context-toggle].is-selected"))
      .map((el) => el.getAttribute("data-context-toggle") as DevotionalContext);

    triggerHaptic(state.preferences.hapticEnabled, 25);
    const saved = await saveDhikr({
      ...item,
      name,
      arabic: arabic || undefined,
      translation: text("translation") || undefined,
      details: text("details") || undefined,
      source: text("source") || undefined,
      contexts: contexts.length ? contexts : ["general"],
      targetCount: Number.isFinite(count) && count > 0 ? count : 0,
      targetUnit: unitLabel ? "custom" : "count",
      targetUnitLabel: unitLabel || undefined,
    });
    store.setState((prev) => {
      const exists = prev.entries.some((e) => e.id === saved.id);
      return {
        entries: exists ? prev.entries.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev.entries],
        editingItem: null,
      };
    });
  });
}
