import { SaveIcon } from "./SaveIcon";
import { t } from "../core/i18n";

export function AppFooter({ label, saving, onBackup }: {
  label: string;
  saving: boolean;
  onBackup: () => void;
}) {
  return (
    <footer className="app-footer">
      <button className="footer-backup-button" type="button" onClick={onBackup} aria-busy={saving} disabled={saving}>
        <SaveIcon />
        <span>{label}</span>
      </button>
      <p className="footer-kufi-praise" dir="rtl" lang="ar" aria-label="Elhamdülillah">
        الحمد لله
      </p>
      <p className="beta-note">{t("app.betaNote")}</p>
    </footer>
  );
}
