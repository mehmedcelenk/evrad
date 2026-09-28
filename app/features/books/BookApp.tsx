"use client";

import { useState } from "react";
import { AppShell } from "../../AppShell";
import { DeleteConfirmation } from "../../components/DeleteConfirmation";
import { LibraryModuleLayout } from "../../components/LibraryModuleLayout";
import type { EntityEditorMode } from "../../core/editor";
import type { BookDraft, BookItem } from "../../core/types";
import { bookRepository } from "../../data/repositories";
import { useLibraryModule } from "../../hooks/useLibraryModule";
import { BookCard } from "./BookCard";
import { BookEditor } from "./BookEditor";
import { bookFromDraft } from "./book-utils";

export function BookApp({ editorMode = null }: { editorMode?: EntityEditorMode }) {
  return (
    <AppShell section="favorites">
      <BookScreen editorMode={editorMode} />
    </AppShell>
  );
}

function BookScreen({ editorMode }: { editorMode: EntityEditorMode }) {
  const state = useLibraryModule({
    moduleId: "books",
    editorMode,
    repository: bookRepository,
    getTitle: getBookTitle,
    fromDraft: bookFromDraft,
  });
  const { collection } = state;
  const { sorting } = collection;
  const [editTarget, setEditTarget] = useState<BookItem | null>(null);
  const saveEdit = async (draft: BookDraft) => {
    if (!editTarget) return;
    if (!await state.updateItem(bookFromDraft(draft, editTarget, editTarget.sortOrder))) throw new Error("Storage update failed");
  };

  return (
    <>
      <LibraryModuleLayout
        module={state.module}
        itemLabel={state.itemLabel}
        storageReady={collection.storageReady}
        storageFailed={collection.storageFailed}
        hasItems={collection.items.length > 0}
        sorting={sorting}
      >
        {collection.items.map((item, index) => (
          <BookCard
            key={item.id}
            item={item}
            complete={collection.completeIds.has(item.id)}
            expanded={collection.expandedIds.has(item.id)}
            dragging={sorting.draggingId === item.id}
            dragOffsetY={sorting.draggingId === item.id ? sorting.dragOffsetY : 0}
            position={index + 1}
            onToggleExpanded={() => collection.toggleExpanded(item.id)}
            onToggleComplete={() => collection.toggleComplete(item.id)}
            onEdit={() => setEditTarget(item)}
            onDelete={() => state.setDeleteTarget(item)}
            sortHandleProps={sorting.handleProps}
          />
        ))}
      </LibraryModuleLayout>
      {state.editor ? <BookEditor key={state.editor === "new" ? "new" : state.editor.id} item={state.editor === "new" ? null : state.editor} onClose={state.closeEditor} onSave={state.saveDraft} /> : null}
      {editTarget ? <BookEditor key={editTarget.id} item={editTarget} onClose={() => setEditTarget(null)} onSave={saveEdit} /> : null}
      {state.deleteTarget ? <DeleteConfirmation title={state.deleteTarget.title} itemLabel={state.itemLabel} onCancel={() => state.setDeleteTarget(null)} onConfirm={state.confirmDelete} /> : null}
    </>
  );
}

function getBookTitle(item: BookItem): string {
  return item.title;
}
