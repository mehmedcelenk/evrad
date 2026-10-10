export type NavigationTarget = "virds" | "create" | "settings";

export type ArabicFontId = "noto" | "readex" | "almarai" | "amiri" | "scheherazade";
export type ArabicFontLevel = 0 | 1 | 2 | 3 | 4;
export type ArabicLineHeight = 1.45 | 1.72 | 2.05;

export type DevotionalCategory = "dhikr" | "prayers" | "memorization" | "poetry" | "books";

export type DevotionalContext =
  | "general"
  | "afterPrayer"
  | "beforePrayer"
  | "morning"
  | "gratitude"
  | "forgiveness"
  | "protection"
  | "relief";

export interface DevotionalItem {
  id: string;
  name: string;
  arabic?: string;
  translation?: string;
  details?: string;
  source?: string;
  targetCount: number;
  targetUnit: "count" | "custom";
  targetUnitLabel?: string;
  contexts: DevotionalContext[];
  inVirds: boolean;
  inBag: boolean;
  expandedArabicSize: ArabicFontLevel;
  category?: DevotionalCategory;
  createdAt?: string;
  updatedAt?: string;
}

export type DevotionalDraft = Partial<DevotionalItem> & {
  category?: DevotionalCategory;
};

export interface AppPreferences {
  activeFontId: ArabicFontId;
  showDiacritics: boolean;
  showTranslations: boolean;
  fontSizeScale: number;
  lineHeight: number;
  hapticEnabled: boolean;
  dayResetTime: string;
}

export interface CollectionEntry {
  id: string;
  item: DevotionalItem;
  completedToday?: boolean;
}
