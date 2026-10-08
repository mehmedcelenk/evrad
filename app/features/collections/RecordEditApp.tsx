"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "../../AppShell";
import { StorageLoading } from "../../components/StorageLoading";
import { devotionalContentFromDraft } from "../../core/devotional";
import { getSectionRoute } from "../../core/module-registry";
import { getDefaultRecordCategory } from "../../core/record-categories";
import { t } from "../../core/i18n";
import type { DevotionalDraft, DevotionalModuleId } from "../../core/types";
import { useRecordLibrary } from "../../hooks/useRecordLibrary";
import { DevotionalEditor } from "../devotional/DevotionalEditor";

export function RecordEditApp({ moduleId, itemId }: { moduleId: DevotionalModuleId; itemId: string }) {
  return <AppShell section="virds"><RecordEditScreen moduleId={moduleId} itemId={itemId} /></AppShell>;
}

function RecordEditScreen({ moduleId, itemId }: { moduleId: DevotionalModuleId; itemId: string }) {
  const router = useRouter();
  const library = useRecordLibrary();
  const entry = library.entries.find((entry) => entry.moduleId === moduleId && entry.itemId === itemId);
  const close = () => router.replace(getSectionRoute("virds"));
  const save = async (draft: DevotionalDraft) => {
    const saved = await library.update({ moduleId, itemId }, devotionalContentFromDraft(draft));
    if (!saved) throw new Error("Record could not be saved");
  };
  if (!library.ready) return <StorageLoading label={t("loading.generic", { module: t("bag.record") })} />;
  if (!entry || entry.moduleId === "books" || library.failed) return <section className="module-screen"><p role="alert">{t(library.failed ? "toast.storageError" : "editor.notFoundGeneric", { item: t("bag.record") })}</p><button className="secondary-button" onClick={close}>{t("action.cancel")}</button></section>;
  return <DevotionalEditor item={entry.item} itemLabel={t("bag.record")} defaultCategory={getDefaultRecordCategory(entry.item, moduleId)} onClose={close} onSave={save} />;
}

