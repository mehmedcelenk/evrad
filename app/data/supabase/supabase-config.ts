export interface SupabaseConfig {
  url: string;
  anonKey: string;
  syncKey: string;
  autoSync: boolean;
}

const STORAGE_KEYS = {
  url: "evrad_supabase_url",
  anonKey: "evrad_supabase_anon_key",
  syncKey: "evrad_supabase_sync_key",
  autoSync: "evrad_supabase_auto_sync",
  lastSynced: "evrad_supabase_last_synced",
} as const;

export const DEFAULT_SQL_SCHEMA = `-- Virdlerim Supabase Senkronizasyon Tablosu
create table if not exists public.evrad_sync (
  sync_key text primary key,
  payload jsonb not null,
  client_timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.evrad_sync enable row level security;

create policy "Allow all with sync_key" on public.evrad_sync
  for all using (true) with check (true);
`;

const memoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      // localStorage kısıtı
    }
  }
  return memoryStore[key] ?? null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      // localStorage kısıtı
    }
  }
  memoryStore[key] = value;
}

export function generateSyncKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "EVR-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const storedUrl = getStorageItem(STORAGE_KEYS.url) ?? envUrl;
  const storedKey = getStorageItem(STORAGE_KEYS.anonKey) ?? envKey;
  let storedSyncKey = getStorageItem(STORAGE_KEYS.syncKey);
  const activeUser = getStorageItem("evrad_username");
  const storedAutoSync = getStorageItem(STORAGE_KEYS.autoSync) === "true";

  if (!storedSyncKey) {
    if (activeUser) {
      storedSyncKey = activeUser.trim().toLowerCase();
      setStorageItem(STORAGE_KEYS.syncKey, storedSyncKey);
    } else {
      storedSyncKey = generateSyncKey();
      setStorageItem(STORAGE_KEYS.syncKey, storedSyncKey);
    }
  }

  return {
    url: storedUrl.trim(),
    anonKey: storedKey.trim(),
    syncKey: storedSyncKey.trim(),
    autoSync: storedAutoSync,
  };
}

export function saveSupabaseConfig(config: Partial<SupabaseConfig>): void {
  if (config.url !== undefined) setStorageItem(STORAGE_KEYS.url, config.url.trim());
  if (config.anonKey !== undefined) setStorageItem(STORAGE_KEYS.anonKey, config.anonKey.trim());
  if (config.syncKey !== undefined) setStorageItem(STORAGE_KEYS.syncKey, config.syncKey.trim());
  if (config.autoSync !== undefined) setStorageItem(STORAGE_KEYS.autoSync, String(config.autoSync));
}

export function getLastSyncedAt(): string | null {
  return getStorageItem(STORAGE_KEYS.lastSynced);
}

export function setLastSyncedAt(isoString: string): void {
  setStorageItem(STORAGE_KEYS.lastSynced, isoString);
}
