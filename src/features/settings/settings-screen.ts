import { ARABIC_FONTS, ARABIC_FONT_SAMPLE, formatArabicDiacritics } from "../../shared/arabic-fonts";
import { icons } from "../../shared/icons";
import { html, raw } from "../../shared/safe-html";
import type { ArabicFontId } from "../../shared/types";
import type { AppStore } from "../../app/store";
import { triggerHaptic } from "../../shared/haptics";
import { t } from "../../shared/i18n";

export function renderSettingsScreen(store: AppStore): string {
  const state = store.getState();
  const prefs = state.preferences;
  const sampleText = formatArabicDiacritics(ARABIC_FONT_SAMPLE, prefs.showDiacritics);

  return html`
    <div class="module-screen settings-screen">
      <header class="screen-heading">
        <div class="screen-heading-main">
          <h1>${t("settings.title")}</h1>
        </div>
      </header>

      <div class="settings-stack">
        <div class="settings-flat-group">
          <!-- Font Size Slider -->
          <div class="settings-flat-row">
            <label for="settings-font-size" class="settings-flat-label">${t("settings.fontSizeTitle")}</label>
            <div class="settings-slider-wrap">
              <input
                id="settings-font-size"
                type="range"
                min="75"
                max="140"
                step="1"
                value="${prefs.fontSizeScale}"
                class="settings-slider"
                data-setting="fontSizeScale"
              />
            </div>
          </div>

          <!-- Line Height Slider -->
          <div class="settings-flat-row">
            <label for="settings-line-height" class="settings-flat-label">${t("settings.lineHeightTitle")}</label>
            <div class="settings-slider-wrap">
              <input
                id="settings-line-height"
                type="range"
                min="1.2"
                max="2.5"
                step="0.05"
                value="${prefs.lineHeight}"
                class="settings-slider"
                data-setting="lineHeight"
              />
            </div>
          </div>

          <!-- Translations Checkbox -->
          <div class="settings-flat-row" data-action="toggle-pref" data-pref="showTranslations">
            <span class="settings-flat-label">${t("settings.translationsTitle")}</span>
            <button type="button" class="classic-checkbox-box${prefs.showTranslations ? " is-checked" : ""}">
              ${prefs.showTranslations ? raw(icons.check(12, 3).value) : ""}
            </button>
          </div>

          <!-- Diacritics Checkbox -->
          <div class="settings-flat-row" data-action="toggle-pref" data-pref="showDiacritics">
            <span class="settings-flat-label">${t("settings.diacriticsSection")}</span>
            <button type="button" class="classic-checkbox-box${prefs.showDiacritics ? " is-checked" : ""}">
              ${prefs.showDiacritics ? raw(icons.check(12, 3).value) : ""}
            </button>
          </div>

          <!-- Haptics Checkbox -->
          <div class="settings-flat-row" data-action="toggle-pref" data-pref="hapticEnabled">
            <span class="settings-flat-label">${t("settings.hapticSection")}</span>
            <button type="button" class="classic-checkbox-box${prefs.hapticEnabled ? " is-checked" : ""}">
              ${prefs.hapticEnabled ? raw(icons.check(12, 3).value) : ""}
            </button>
          </div>

          <!-- Reset Time -->
          <div class="settings-flat-row">
            <label for="settings-day-reset-time" class="settings-flat-label">${t("settings.routineSection")}</label>
            <input
              id="settings-day-reset-time"
              type="time"
              class="settings-time-input"
              value="${prefs.dayResetTime}"
              data-setting="dayResetTime"
            />
          </div>
        </div>

        <!-- Font Selection -->
        <section class="settings-fonts-section">
          <div class="settings-section-header">
            <h2 class="settings-section-title">${t("settings.arabicFontSection")}</h2>
          </div>

          <div class="font-row-list">
            ${ARABIC_FONTS.map((font) => {
              const isSelected = prefs.activeFontId === font.id;
              const sampleFontFamily = `"${font.fontFamily}", "Noto Naskh Arabic", Arial, sans-serif`;
              return html`
                <button
                  type="button"
                  class="font-row-item${isSelected ? " is-selected" : ""}"
                  data-action="select-font"
                  data-font-id="${font.id}"
                >
                  <div class="font-row-info">
                    <span class="font-row-name">${font.name}</span>
                    <span class="font-row-style">${font.styleCategory}</span>
                  </div>
                  <div class="font-row-end">
                    <span class="font-row-sample" lang="ar" dir="rtl" style="font-family: ${sampleFontFamily};">
                      ${sampleText}
                    </span>
                    <div class="font-row-checkbox">
                      <span class="classic-checkbox-box${isSelected ? " is-checked" : ""}">
                        ${isSelected ? raw(icons.check(12, 3).value) : ""}
                      </span>
                    </div>
                  </div>
                </button>
              `;
            }).join("")}
          </div>
        </section>

        <footer class="settings-contact-footer">
          <a href="mailto:mehmedcelenk@gmail.com" class="settings-contact-link">
            mehmedcelenk@gmail.com
          </a>
        </footer>
      </div>
    </div>
  `;
}

export function bindSettingsScreenEvents(container: HTMLElement, store: AppStore): void {
  container.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const actionEl = target.closest("[data-action]") as HTMLElement | null;
    if (!actionEl) return;

    const action = actionEl.getAttribute("data-action");
    const state = store.getState();

    if (action === "toggle-pref") {
      const prefKey = actionEl.getAttribute("data-pref") as "showTranslations" | "showDiacritics" | "hapticEnabled";
      if (!prefKey) return;
      triggerHaptic(state.preferences.hapticEnabled, 15);
      const nextValue = !state.preferences[prefKey];
      store.setState((prev) => ({
        preferences: { ...prev.preferences, [prefKey]: nextValue },
      }));
    } else if (action === "select-font") {
      const fontId = actionEl.getAttribute("data-font-id") as ArabicFontId;
      if (!fontId) return;
      triggerHaptic(state.preferences.hapticEnabled, 15);
      store.setState((prev) => ({
        preferences: { ...prev.preferences, activeFontId: fontId },
      }));
    }
  });

  container.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    const settingKey = input.getAttribute("data-setting");
    if (!settingKey) return;

    const state = store.getState();
    if (settingKey === "fontSizeScale") {
      const value = Number(input.value);
      store.setState((prev) => ({
        preferences: { ...prev.preferences, fontSizeScale: value },
      }));
    } else if (settingKey === "lineHeight") {
      const value = Number(input.value);
      store.setState((prev) => ({
        preferences: { ...prev.preferences, lineHeight: value },
      }));
    } else if (settingKey === "dayResetTime") {
      const value = input.value || "00:00";
      store.setState((prev) => ({
        preferences: { ...prev.preferences, dayResetTime: value },
      }));
    }
  });
}
