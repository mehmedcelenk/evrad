"use client";

import { useId, useRef, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { draftFromText } from "../core/devotional-draft";
import { t } from "../core/i18n";
import type { DevotionalDraft } from "../core/types";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useCreateRecord } from "../features/collections/useCreateRecord";
import { RecordCreateScreen } from "../features/collections/RecordCreateScreen";
import { Dialog } from "./Dialog";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onOpenDetailed?: (draft: DevotionalDraft) => void;
}

export function QuickAddModal({ open, ...props }: QuickAddModalProps) {
  return open ? <QuickAddContent {...props} /> : null;
}

function QuickAddContent({ onClose, onOpenDetailed }: Omit<QuickAddModalProps, "open">) {
  const [text, setText] = useState("");
  const [failed, setFailed] = useState(false);
  const [detailed, setDetailed] = useState<DevotionalDraft | null>(null);
  const nextDraft = useRef<DevotionalDraft | null>(null);
  const { pending, run } = useAsyncAction();
  const create = useCreateRecord();
  const titleId = useId();
  const draft = draftFromText(text);
  const finish = () => {
    if (!nextDraft.current) return onClose();
    if (onOpenDetailed) { onClose(); onOpenDetailed(nextDraft.current); }
    else setDetailed(nextDraft.current);
  };

  if (detailed) return <RecordCreateScreen initialDraft={detailed} onClose={onClose} />;
  return <Dialog variant="quick-add" labelledBy={titleId} busy={pending} onClose={finish}>
    {(close) => <div className="quick-add-card">
      <form className="quick-add-body" onSubmit={(event) => {
        event.preventDefault();
        setFailed(false);
        if (text.trim()) void run(async () => { await create(draft); close(); }).catch(() => setFailed(true));
      }}>
        <div className="quick-add-input-row">
          <input data-initial-focus type="text" className={`quick-add-input${draft.arabic ? " is-arabic" : ""}`}
            value={text} onChange={(event) => setText(event.target.value)} placeholder={t("quickAdd.placeholder")}
            aria-label={t("quickAdd.placeholder")} dir={draft.arabic ? "rtl" : "ltr"} autoComplete="off" disabled={pending} />
          <div className="quick-add-icon-actions">
            <button type="button" className="quick-add-icon-btn" disabled={pending} onClick={() => { nextDraft.current = draft; close(); }} title={t("quickAdd.detail")} aria-label={t("quickAdd.detail")}>
              <SlidersHorizontal size={18} aria-hidden="true" />
            </button>
            <button type="submit" className="quick-add-icon-btn is-save" disabled={!text.trim() || pending} title={t("quickAdd.save")} aria-label={t("quickAdd.save")}>
              <Check size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
        {failed ? <p className="form-error" role="alert">{t("toast.storageError")}</p> : null}
      </form>
    </div>}
  </Dialog>;
}

