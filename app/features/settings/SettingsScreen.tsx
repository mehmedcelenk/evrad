"use client";

import { t } from "../../core/i18n";
import { ArabicFontSettings } from "./ArabicFontSettings";

export function SettingsScreen({ active = true }: { active?: boolean }) {
  return (
    <div className="module-screen settings-screen">
      <header className="screen-heading">
        <div className="screen-heading-main">
          <h1>{t("settings.title")}</h1>
        </div>
      </header>

      <ArabicFontSettings active={active} />
    </div>
  );
}

