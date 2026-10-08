"use client";

import { useId, useRef, useState } from "react";
import { Sparkles, SlidersHorizontal, X } from "lucide-react";
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
      <header className="quick-add-header">
        <div className="quick-add-title-wrap">
          <Sparkles className="quick-add-sparkle" aria-hidden="true" />
          <h2 id={titleId} className="quick-add-title">{t("quickAdd.title")}</h2>
        </div>
        <button type="button" className="quick-add-close" onClick={close} disabled={pending} aria-label={t("action.cancel")}><X aria-hidden="true" /></button>
      </header>
      <form className="quick-add-body" onSubmit={(event) => {
        event.preventDefault();
        setFailed(false);
        if (text.trim()) void run(async () => { await create(draft); close(); }).catch(() => setFailed(true));
      }}>
        <input data-initial-focus type="text" className={`quick-add-input${draft.arabic ? " is-arabic" : ""}`}
          value={text} onChange={(event) => setText(event.target.value)} placeholder={t("quickAdd.placeholder")}
          aria-label={t("quickAdd.placeholder")} dir={draft.arabic ? "rtl" : "ltr"} autoComplete="off" disabled={pending} />
        {failed ? <p className="form-error" role="alert">{t("toast.storageError")}</p> : null}
        <div className="quick-add-actions">
          <button type="button" className="quick-add-detail-btn" disabled={pending} onClick={() => { nextDraft.current = draft; close(); }}>
            <SlidersHorizontal className="quick-add-btn-icon" aria-hidden="true" /><span>{t("quickAdd.detail")}</span>
          </button>
          <button type="submit" className="quick-add-save-btn" disabled={!text.trim() || pending}>{t("quickAdd.save")}</button>
        </div>
      </form>
    </div>}
  </Dialog>;
}
