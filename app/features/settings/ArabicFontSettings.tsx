"use client";

import { Check } from "lucide-react";
import { useAppRuntime } from "../../core/AppRuntimeContext";
import {
  ARABIC_FONTS,
  ARABIC_FONT_SAMPLE,
  formatArabicDiacritics,
  type ArabicFontDefinition,
} from "../../core/arabic-fonts";
import { t } from "../../core/i18n";
import { useArabicFont, useArabicFontPreviews } from "../../hooks/useArabicFont";
import { triggerHaptic } from "../../core/haptics";

import { SettingsSlider, SettingsSwitch } from "./SettingsControls";

export function ArabicFontSettings({ active = true }: { active?: boolean }) {
  const {
    showToast,
    showDiacritics,
    setShowDiacritics,
    showTranslations,
    setShowTranslations,
    hapticEnabled,
    setHapticEnabled,
    dayResetTime,
    setDayResetTime,
    fontSizeScale,
    setFontSizeScale,
    lineHeight,
    setLineHeight,
  } = useAppRuntime();

  const { activeFontId, loadingFontId, selectFont } = useArabicFont(showToast);
  const previewsReady = useArabicFontPreviews(active);
  const sampleText = formatArabicDiacritics(ARABIC_FONT_SAMPLE, showDiacritics);

  return (
    <div className="settings-stack">
      <div className="settings-flat-group">
        <SettingsSlider label={t("settings.fontSizeTitle")} value={fontSizeScale} min={75} max={140} step={1} onChange={setFontSizeScale} />
        <SettingsSlider label={t("settings.lineHeightTitle")} value={lineHeight} min={1.2} max={2.5} step={0.05} onChange={setLineHeight} />
        <SettingsSwitch label={t("settings.translationsTitle")} checked={showTranslations}
          onToggle={() => { triggerHaptic(hapticEnabled); setShowTranslations((value) => !value); }} />
        <SettingsSwitch label={t("settings.diacriticsSection")} checked={showDiacritics}
          onToggle={() => { triggerHaptic(hapticEnabled); setShowDiacritics((value) => !value); }} />
        <SettingsSwitch label={t("settings.hapticSection")} checked={hapticEnabled}
          onToggle={() => { triggerHaptic(!hapticEnabled, 25); setHapticEnabled((value) => !value); }} />
        <div className="settings-flat-row">
          <label htmlFor="settings-day-reset-time" className="settings-flat-label">{t("settings.routineSection")}</label>
          <input id="settings-day-reset-time" type="time" className="settings-time-input" value={dayResetTime}
            onChange={(event) => { triggerHaptic(hapticEnabled); setDayResetTime(event.target.value || "00:00"); }} />
        </div>
      </div>

      <section className="settings-fonts-section" aria-labelledby="arabic-font-title">
        <div className="settings-section-header">
          <h2 id="arabic-font-title" className="settings-section-title">
            {t("settings.arabicFontSection")}
          </h2>
        </div>

        <div className="font-row-list" role="radiogroup" aria-labelledby="arabic-font-title">
          {ARABIC_FONTS.map((font) => (
            <FontOptionRow
              key={font.id}
              font={font}
              sampleText={sampleText}
              isSelected={activeFontId === font.id}
              isLoading={loadingFontId === font.id}
              isFontPreviewReady={!font.googleFontFamily || previewsReady}
              onSelect={() => {
                triggerHaptic(hapticEnabled, 15);
                selectFont(font.id);
              }}
            />
          ))}
        </div>
      </section>

      <footer className="settings-contact-footer">
        <a href="mailto:mehmedcelenk@gmail.com" className="settings-contact-link">
          mehmedcelenk@gmail.com
        </a>
      </footer>
    </div>
  );
}

function FontOptionRow({
  font,
  sampleText,
  isSelected,
  isLoading,
  isFontPreviewReady,
  onSelect,
}: {
  font: ArabicFontDefinition;
  sampleText: string;
  isSelected: boolean;
  isLoading: boolean;
  isFontPreviewReady: boolean;
  onSelect: () => void;
}) {
  const sampleFontFamily = `"${font.fontFamily}", "Noto Naskh Arabic", Arial, sans-serif`;

  return (
    <button
      type="button"
      className={`font-row-item${isSelected ? " is-selected" : ""}${isLoading ? " is-loading" : ""}`}
      onClick={onSelect}
      disabled={isLoading}
      role="radio"
      aria-checked={isSelected}
      aria-label={`${font.name} · ${font.styleCategory}`}
    >
      <div className="font-row-info">
        <span className="font-row-name">{font.name}</span>
        <span className="font-row-style">{font.styleCategory}</span>
      </div>

      <div className="font-row-end">
        <span
          className={`font-row-sample${isFontPreviewReady ? "" : " is-preview-loading"}`}
          lang="ar"
          dir="rtl"
          style={{ fontFamily: sampleFontFamily }}
        >
          {sampleText}
        </span>
        <div className="font-row-checkbox" aria-hidden="true">
          {isLoading ? (
            <span className="font-loading-spinner" />
          ) : (
            <span className={`classic-checkbox-box${isSelected ? " is-checked" : ""}`}>
              {isSelected ? <Check size={12} strokeWidth={3} /> : null}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
