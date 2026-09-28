"use client";
import type { BookDraft, BookItem } from "../../core/types";
import { detectBookFormat } from "../../core/reader";
import { useRecordLibrary } from "../../hooks/useRecordLibrary";
import { BookEditor } from "./BookEditor";
import { bookFromDraft } from "./book-utils";

export function BookCreateScreen({ item = null, onClose }: { item?: BookItem | null; onClose: () => void }) {
  const library = useRecordLibrary();
  const save = async (draft: BookDraft, file?: File) => {
    if (!item && !file) throw new Error("Book file required");
    const next = bookFromDraft(draft, item, item?.sortOrder ?? Date.now());
    if (!item) { next.liked = true; next.inVirds = false; }
    if (file) { next.format = await detectBookFormat(file, file.name); next.assetId = crypto.randomUUID(); }
    if (!await library.saveBook(next, file)) throw new Error("Book save failed");
  };
  return <BookEditor item={item} onClose={onClose} onSave={save} />;
}
