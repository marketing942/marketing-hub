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

/** Provedores cujo teste pode validar de verdade uma conta mapeada. */
const DEEP_TEST_PROVIDERS: ProviderId[] = ["meta_ads", "instagram"];

/** Testa a conexão real do provedor e persiste o status. */
export async function testIntegration(provider: ProviderId): Promise<TestResult> {
  const user = await getCurrentUser();
  if (!canManage(user?.role)) {
    return { ok: false, status: "error", message: "Sem permissão." };
  }

  const admin = createAdminClient();

  // 1) Teste básico do token (ex.: /me no Meta).
  let result = await ADAPTERS[provider].testConnection();

  // 2) Teste profundo: se o token é válido e há conta mapeada, tenta LER a conta
  //    (é aqui que aparece o erro de permissão ads_read, que /me não revela).
  if (result.ok && DEEP_TEST_PROVIDERS.includes(provider)) {
    const { data: acct } = await admin
      .from("marketing_integration_accounts")
      .select("external_account_id")
      .eq("provider", provider)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (acct?.external_account_id) {
      try {
        await ADAPTERS[provider].syncAccount(acct.external_account_id);
      } catch (e) {
        result = {
          ok: false,
          status: "error",
          message:
            `Token válido, mas falha ao ler a conta ${acct.external_account_id}: ` +
            (e as Error).message,
        };
      }
    }
  }

  // Persiste status via service role
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

/** Mapeia (ou remove) a conta externa de uma empresa para um provedor. */
export async function saveAccountMapping(input: {
  provider: ProviderId;
  companyId: string;
  externalAccountId: string;
  accountName?: string | null;
}): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!canManage(user?.role)) {
    return { ok: false, message: "Sem permissão." };
  }

  const admin = createAdminClient();
  const ext = input.externalAccountId.trim();

  if (ext === "") {
    // Campo vazio = remover o mapeamento da empresa.
    const { error } = await admin
      .from("marketing_integration_accounts")
      .delete()
      .eq("provider", input.provider)
      .eq("company_id", input.companyId);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await admin.from("marketing_integration_accounts").upsert(
      {
        provider: input.provider,
        company_id: input.companyId,
        external_account_id: ext,
        account_name: input.accountName ?? null,
        active: true,
      },
      { onConflict: "company_id,provider" },
    );
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/sync-status");
  return { ok: true, message: "Contas atualizadas." };
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
