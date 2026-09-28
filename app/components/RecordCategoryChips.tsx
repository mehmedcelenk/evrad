import { t } from "../core/i18n";
import { bagCategories, type BagCategory } from "../core/record-categories";

export function RecordCategoryChips<T extends BagCategory | "books">({ selected, onToggle, includeBooks = false }: { includeBooks?: boolean; selected: readonly T[]; onToggle: (category: T) => void }) {
  const categories = includeBooks ? [...bagCategories, "books" as const] : bagCategories;
  return (
    <div className="context-chips bag-category-chips" role="group" aria-label={t("bag.categories")}>
      {categories.map((category) => (
        <button key={category} type="button" className={`context-chip is-bag-${category}${selected.includes(category as T) ? " is-selected" : ""}`} aria-pressed={selected.includes(category as T)} onClick={() => onToggle(category as T)}>
          {t(`bag.${category}`)}
        </button>
      ))}
    </div>
  );
}
