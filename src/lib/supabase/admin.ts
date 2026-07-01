import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase com a SERVICE ROLE KEY — ignora RLS.
 * ⚠️ NUNCA importar em código client. Usar apenas em rotas de sync, cron e
 * operações administrativas server-side.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ausentes no ambiente.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
