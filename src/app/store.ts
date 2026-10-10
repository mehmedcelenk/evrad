import { DEFAULT_PREFERENCES, savePreferences } from "../data/preferences";
import { loadArabicFont } from "../data/font-loader";
import type {
  AppPreferences,
  DevotionalCategory,
  DevotionalContext,
  DevotionalItem,
  NavigationTarget,
} from "../shared/types";

export interface AppState {
  activeSection: NavigationTarget;
  entries: DevotionalItem[];
  completions: Set<string>;
  expandedIds: Set<string>;
  selectedCategories: DevotionalCategory[];
  selectedContexts: DevotionalContext[];
  filtersOpen: boolean;
  preferences: AppPreferences;
  quickAddOpen: boolean;
  editingItem: DevotionalItem | null;
  deletingItem: DevotionalItem | null;
  dateKey: string;
}

export type Listener = (state: AppState, prev: AppState) => void;

export class AppStore {
  private state: AppState;
  private listeners = new Set<Listener>();

  constructor(initialState: Partial<AppState> = {}) {
    this.state = {
      activeSection: "virds",
      entries: [],
      completions: new Set(),
      expandedIds: new Set(),
      selectedCategories: [],
      selectedContexts: [],
      filtersOpen: false,
      preferences: DEFAULT_PREFERENCES,
      quickAddOpen: false,
      editingItem: null,
      deletingItem: null,
      dateKey: new Date().toISOString().slice(0, 10),
      ...initialState,
    };
  }

  public getState(): AppState {
    return this.state;
  }

  public setState(updater: (prev: AppState) => Partial<AppState>): void {
    const prev = this.state;
    const patch = updater(prev);
    this.state = { ...prev, ...patch };

    // Apply preference effects if preferences changed
    if (patch.preferences && patch.preferences !== prev.preferences) {
      savePreferences(this.state.preferences);
      loadArabicFont(this.state.preferences.activeFontId);
      document.documentElement.style.setProperty("--text-scale", String(this.state.preferences.fontSizeScale / 100));
      document.documentElement.style.setProperty("--arabic-line-height", String(this.state.preferences.lineHeight));
    }

    this.listeners.forEach((fn) => fn(this.state, prev));
  }

  public subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
