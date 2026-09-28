"use client";

import { useState } from "react";
import type { BagCategory } from "../core/record-categories";
import { matchesRecordFilters, toggleSelection } from "../core/record-filters";
import type { DevotionalContext, DevotionalItem, DevotionalModuleId } from "../core/types";

export function useRecordFilters() {
  const [categories, setCategories] = useState<(BagCategory | "books")[]>([]);
  const [contexts, setContexts] = useState<DevotionalContext[]>([]);
  return {
    categories, contexts,
    toggleCategory: (value: BagCategory | "books") => setCategories((current) => toggleSelection(current, value)),
    toggleContext: (value: DevotionalContext) => setContexts((current) => toggleSelection(current, value)),
    matches: (item: Pick<DevotionalItem, "name" | "source" | "bagCategories" | "contexts">, moduleId: DevotionalModuleId) =>
      matchesRecordFilters(item, moduleId, { categories, contexts }),
  };
}
