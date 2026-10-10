import { t } from "../core/i18n";
import { bagCategories, type BagCategory } from "../core/record-categories";

const categoryEmojis: Record<string, string> = {
  dhikr: "📿",
  prayers: "🤲",
  memorization: "📜",
  surahs: "📖",
  poetry: "✍️",
  books: "📚",
};

export function RecordCategoryChips<T extends BagCategory | "books">({ selected, onToggle, includeBooks = false }: { includeBooks?: boolean; selected: readonly T[]; onToggle: (category: T) => void }) {
  const categories = includeBooks ? [...bagCategories, "books" as const] : bagCategories;
  return (
    <div className="category-emoji-bar" role="group" aria-label={t("bag.categories")}>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`category-emoji-btn${selected.includes(category as T) ? " is-selected" : ""}`}
          aria-pressed={selected.includes(category as T)}
          title={t(`bag.${category}`)}
          onClick={() => onToggle(category as T)}
        >
          <span className="emoji-icon">{categoryEmojis[category] ?? "✨"}</span>
        </button>
      ))}
    </div>
  );
}

