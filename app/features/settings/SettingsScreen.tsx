"use client";

import { t } from "../../core/i18n";
import { ArabicFontSettings } from "./ArabicFontSettings";
import { SupabaseSyncSettings } from "./SupabaseSyncSettings";

export function SettingsScreen({ active = true }: { active?: boolean }) {
  return (
    <div className="module-screen settings-screen">
      <header className="screen-heading">
        <p className="eyebrow">{t("settings.eyebrow")}</p>
        <div className="screen-heading-main">
          <h1>{t("settings.title")}</h1>
        </div>
      </header>

      <ArabicFontSettings active={active} />
      <SupabaseSyncSettings />
    </div>
  );
}
