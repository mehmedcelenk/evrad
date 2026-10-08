"use client";
import { useRouter } from "next/navigation";
import { AppShell } from "../../AppShell";
import { getSectionRoute } from "../../core/module-registry";
import { t } from "../../core/i18n";
import type { EntityEditorMode } from "../../core/editor";
import { useRecordLibrary } from "../../hooks/useRecordLibrary";
import { CollectionScreen } from "../collections/CollectionScreen";
import { BookCreateScreen } from "./BookCreateScreen";

export function BookApp({ editorMode = null }: { editorMode?: EntityEditorMode }) {
  return <AppShell section="virds"><BookRoute editorMode={editorMode} /></AppShell>;
}
function BookRoute({ editorMode }: { editorMode: EntityEditorMode }) {
  const library = useRecordLibrary();
  const router = useRouter();
  const close = () => router.replace(getSectionRoute("virds"));
  const entry = library.entries.find(entry => entry.moduleId === "books" && entry.itemId === (editorMode?.type === "edit" ? editorMode.id : undefined));
  return <>
    <CollectionScreen collection="virds" />
    {editorMode?.type === "new" ? <BookCreateScreen onClose={close} /> :
      editorMode && library.ready ? entry?.moduleId === "books" ? <BookCreateScreen item={entry.item} onClose={close} /> :
        <p role="alert">{t(library.failed ? "toast.storageError" : "editor.notFoundGeneric", { item: t("module.books.singular") })}</p> : null}
  </>;
}

