import { Pencil, Trash2 } from "lucide-react";
import { t } from "../core/i18n";

export function CardActions({ title, onEdit, onDelete }: { title: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <footer className="card-actions">
      <button type="button" className="edit-button" onClick={onEdit} aria-label={t("action.edit")} title={t("action.edit")}>
        <Pencil size={16} strokeWidth={1.8} />
      </button>
      <button type="button" className="delete-button" onClick={onDelete} aria-label={`${title}: ${t("action.delete")}`} title={t("action.delete")}>
        <Trash2 size={16} strokeWidth={1.8} />
      </button>
    </footer>
  );
}
