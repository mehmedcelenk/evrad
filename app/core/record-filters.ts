import { matchesBagCategory, type BagCategory } from "./record-categories";
import type { DevotionalContext, DevotionalItem, DevotionalModuleId } from "./types";

export interface RecordFilterSelection {
  categories: readonly (BagCategory | "books")[];
  contexts: readonly DevotionalContext[];
}

export function toggleSelection<T>(items: readonly T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export function matchesRecordFilters(
  item: Pick<DevotionalItem, "name" | "source" | "bagCategories" | "contexts">,
  moduleId: DevotionalModuleId,
  { categories, contexts }: RecordFilterSelection,
) {
  return (!categories.length || categories.some((category) => category !== "books" && matchesBagCategory(item, category, moduleId))) &&
    (!contexts.length || contexts.some((context) => (item.contexts ?? []).includes(context)));
}
