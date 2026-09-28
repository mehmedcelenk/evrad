import { t } from "../core/i18n";

export function TrackableEmptyState() {
  return <p className="empty-state">{t("empty.simple")}</p>;
}
