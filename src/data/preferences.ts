import { PREFERENCES_STORE, requestResult, runTransaction } from "./indexed-db";
import type { AppPreferences } from "../shared/types";

const PREFS_KEY = "user_preferences";

export const DEFAULT_PREFERENCES: AppPreferences = {
  activeFontId: "noto",
  showDiacritics: true,
  showTranslations: true,
  fontSizeScale: 100,
  lineHeight: 1.72,
  hapticEnabled: true,
  dayResetTime: "00:00",
};

export async function getPreferences(): Promise<AppPreferences> {
  try {
    const prefs = await runTransaction(PREFERENCES_STORE, "readonly", (tx) =>
      requestResult(tx.objectStore(PREFERENCES_STORE).get(PREFS_KEY)),
    );
    if (prefs && typeof prefs === "object") {
      return { ...DEFAULT_PREFERENCES, ...prefs.value };
    }
  } catch {
    // Fallback if IndexedDB isn't ready
  }
  return DEFAULT_PREFERENCES;
}

export async function savePreferences(prefs: AppPreferences): Promise<void> {
  try {
    await runTransaction(PREFERENCES_STORE, "readwrite", (tx) =>
      tx.objectStore(PREFERENCES_STORE).put({ id: PREFS_KEY, value: prefs }),
    );
  } catch {
    // Fail-safe
  }
}
