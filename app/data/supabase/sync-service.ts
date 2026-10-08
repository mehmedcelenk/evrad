import { readBackupPayload, restoreBackupPayload } from "../backup-repository";
import type { BackupPayload } from "../../core/backup";
import { getSupabaseClient } from "./supabase-client";
import { getSupabaseConfig, setLastSyncedAt } from "./supabase-config";

export interface SyncResult {
  ok: boolean;
  message: string;
  restoredEntities?: number;
  restoredCompletions?: number;
  timestamp?: string;
}

export async function pushToSupabase(): Promise<SyncResult> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (!client || !config.url || !config.anonKey) {
    return { ok: false, message: "Supabase yapılandırması eksik." };
  }
  if (!config.syncKey) {
    return { ok: false, message: "Senkronizasyon anahtarı (Sync Key) eksik." };
  }

  try {
    const payload = await readBackupPayload();
    const now = new Date().toISOString();

    const { error } = await client
      .from("evrad_sync")
      .upsert(
        {
          sync_key: config.syncKey,
          payload,
          client_timestamp: now,
          updated_at: now,
        },
        { onConflict: "sync_key" },
      );

    if (error) {
      return { ok: false, message: `Buluta yükleme hatası: ${error.message}` };
    }

    setLastSyncedAt(now);
    return {
      ok: true,
      message: "Veriler Supabase bulutuna başarıyla yüklendi.",
      timestamp: now,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Senkronizasyon hatası: ${msg}` };
  }
}

export async function pullFromSupabase(): Promise<SyncResult> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (!client || !config.url || !config.anonKey) {
    return { ok: false, message: "Supabase yapılandırması eksik." };
  }
  if (!config.syncKey) {
    return { ok: false, message: "Senkronizasyon anahtarı (Sync Key) eksik." };
  }

  try {
    const { data, error } = await client
      .from("evrad_sync")
      .select("payload, updated_at")
      .eq("sync_key", config.syncKey)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { ok: false, message: "Bu senkronizasyon anahtarıyla bulutta kayıt bulunamadı. Önce 'Buluta Yedekle' yapabilirsiniz." };
      }
      return { ok: false, message: `Buluttan alma hatası: ${error.message}` };
    }

    if (!data || !data.payload) {
      return { ok: false, message: "Buluttan gelen veri boş veya geçersiz." };
    }

    const payload = data.payload as BackupPayload;
    const restoreResult = await restoreBackupPayload(payload);
    const now = new Date().toISOString();
    setLastSyncedAt(now);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("evrad:synced", { detail: restoreResult }));
    }

    return {
      ok: true,
      message: `${restoreResult.restoredEntities} kayıt ve ${restoreResult.restoredCompletions} tamamlama buluttan eşitlendi.`,
      restoredEntities: restoreResult.restoredEntities,
      restoredCompletions: restoreResult.restoredCompletions,
      timestamp: now,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Geri yükleme hatası: ${msg}` };
  }
}
