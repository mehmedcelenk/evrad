import { createEntityMeta } from "../../core/entity";
import { targetFromDraft } from "../../core/target";
import type { BookDraft, BookItem } from "../../core/types";

export function bookFromDraft(draft: BookDraft, existing: BookItem | null, sortOrder: number): BookItem {
  return {
    ...existing,
    ...createEntityMeta("book", sortOrder, existing),
    title: draft.title,
    author: draft.author || null,
    details: draft.details || null,
    ...targetFromDraft(draft),
  };
}
