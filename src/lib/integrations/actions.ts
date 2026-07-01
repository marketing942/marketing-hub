"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/user";
import { ADAPTERS } from "./adapters";
import { runProviderSync } from "./sync";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProviderId, TestResult } from "./types";

function canManage(role?: string) {
  return role === "admin" || role === "coordinator";
}

/** Testa a conexão real do provedor e persiste o status. */
export async function testIntegration(provider: ProviderId): Promise<TestResult> {
  const user = await getCurrentUser();
  if (!canManage(user?.role)) {
    return { ok: false, status: "error", message: "Sem permissão." };
  }

  const result = await ADAPTERS[provider].testConnection();

  // Persiste status via service role
  const admin = createAdminClient();
  await admin
    .from("marketing_integrations")
    .update({
      status: result.status,
      last_error: result.ok ? null : result.message,
    })
    .eq("provider", provider);

  revalidatePath("/settings/integrations");
  return result;
}

/** Dispara sincronização imediata de um provedor. */
export async function syncNow(provider: ProviderId) {
  const user = await getCurrentUser();
  if (!canManage(user?.role)) {
    return { ok: false, message: "Sem permissão." };
  }
  const summary = await runProviderSync(provider);
  revalidatePath("/settings/integrations");
  revalidatePath("/sync-status");
  revalidatePath("/dashboard");
  return { ok: summary.status === "success", message: summary.message };
}
