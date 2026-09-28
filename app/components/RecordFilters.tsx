import { t } from "../core/i18n";
import { RecordCategoryChips } from "./RecordCategoryChips";
import { DevotionalContextChips } from "./DevotionalContextChips";
import type { RecordFilterSelection } from "../core/record-filters";
import type { BagCategory } from "../core/record-categories";
import type { DevotionalContext } from "../core/types";

interface RecordFilterControls extends RecordFilterSelection {
  toggleCategory: (category: BagCategory | "books") => void;
  toggleContext: (context: DevotionalContext) => void;
}

export function RecordFilters({ filters }: { filters: RecordFilterControls }) {
  return (
    <div className="bag-toolbar">
      <RecordCategoryChips includeBooks selected={filters.categories} onToggle={filters.toggleCategory} />
      <DevotionalContextChips selected={filters.contexts} onToggle={filters.toggleContext} label={t("filter.contexts")} />
    </div>
  );
}
