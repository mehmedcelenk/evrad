import type { DevotionalCategory, DevotionalContext } from "./types";

export interface RecordCategoryOption {
  id: DevotionalCategory;
  emoji: string;
  labelKey: string;
}

export interface DevotionalContextOption {
  id: DevotionalContext;
  labelKey: string;
}

export const RECORD_CATEGORIES: RecordCategoryOption[] = [
  { id: "dhikr", emoji: "📿", labelKey: "bag.dhikr" },
  { id: "prayers", emoji: "🤲", labelKey: "bag.prayers" },
  { id: "memorization", emoji: "📜", labelKey: "bag.memorization" },
  { id: "poetry", emoji: "✍️", labelKey: "bag.poetry" },
  { id: "books", emoji: "📚", labelKey: "bag.record" },
];

export const DEVOTIONAL_CONTEXTS: DevotionalContextOption[] = [
  { id: "general", labelKey: "context.general" },
  { id: "morning", labelKey: "context.morning" },
  { id: "afterPrayer", labelKey: "context.afterPrayer" },
  { id: "beforePrayer", labelKey: "context.beforePrayer" },
  { id: "gratitude", labelKey: "context.gratitude" },
  { id: "forgiveness", labelKey: "context.forgiveness" },
  { id: "protection", labelKey: "context.protection" },
  { id: "relief", labelKey: "context.relief" },
];
