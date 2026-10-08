import { saveSupabaseConfig } from "./supabase/supabase-config";

const USERNAME_KEY = "evrad_username";
const memoryStore: Record<string, string> = {};

export function getActiveUsername(): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(USERNAME_KEY);
    } catch {
      // localStorage kısıtı
    }
  }
  return memoryStore[USERNAME_KEY] ?? null;
}

export function setActiveUsername(username: string): void {
  const clean = username.trim();
  if (!clean) return;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(USERNAME_KEY, clean);
    } catch {
      // localStorage kısıtı
    }
  }
  memoryStore[USERNAME_KEY] = clean;
  // Supabase syncKey'i kullanıcı adına ayarla
  saveSupabaseConfig({
    syncKey: clean.toLowerCase(),
    autoSync: true,
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("evrad:user-changed", { detail: clean }));
  } else if (typeof globalThis !== "undefined" && typeof globalThis.dispatchEvent === "function") {
    globalThis.dispatchEvent(new CustomEvent("evrad:user-changed", { detail: clean }));
  }
}

export function clearActiveUsername(): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(USERNAME_KEY);
    } catch {
      // localStorage kısıtı
    }
  }
  delete memoryStore[USERNAME_KEY];
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("evrad:user-changed", { detail: null }));
  } else if (typeof globalThis !== "undefined" && typeof globalThis.dispatchEvent === "function") {
    globalThis.dispatchEvent(new CustomEvent("evrad:user-changed", { detail: null }));
  }
}

export function isUserConfigured(): boolean {
  return Boolean(getActiveUsername());
}

