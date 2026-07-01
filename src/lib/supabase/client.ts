"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase para uso no browser (usa a anon key pública). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
