import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase-config";

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = "";

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  const currentKey = `${config.url}::${config.anonKey}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: "Supabase URL veya Anon Key eksik." };
  }

  try {
    const { error } = await client.from("evrad_sync").select("sync_key").limit(1);
    if (error) {
      if (error.code === "PGRST204" || error.code === "PGRST205" || error.message?.includes("does not exist") || error.code === "42P01") {
        return { ok: false, message: "Bağlantı başarılı ancak 'evrad_sync' tablosu bulunamadı. Lütfen SQL şemasını çalıştırın." };
      }
      return { ok: false, message: `Hata: ${error.message}` };
    }
    return { ok: true, message: "Supabase bağlantısı başarılı ve hazır!" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Ağ veya bağlantı hatası: ${msg}` };
  }
}
