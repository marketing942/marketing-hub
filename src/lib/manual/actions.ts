"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/user";

export interface ManualEntryInput {
  companyId: string;
  metricKey: string;
  metricDate: string; // YYYY-MM-DD
  value: number | null;
  notes: string;
}

export interface ManualSaveResult {
  ok: boolean;
  error?: string;
}

/**
 * Registra um lançamento manual de métrica. Cada save cria uma linha (histórico).
 * Permissão via RLS (quem tem acesso à empresa). Auditoria em audit_logs.
 */
export async function saveManualEntry(
  input: ManualEntryInput,
): Promise<ManualSaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  if (input.value == null || Number.isNaN(input.value)) {
    return { ok: false, error: "Informe um valor numérico." };
  }
  if (!input.companyId || !input.metricKey) {
    return { ok: false, error: "Empresa e métrica são obrigatórias." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manual_metric_entries")
    .insert({
      company_id: input.companyId,
      metric_key: input.metricKey,
      metric_date: input.metricDate,
      value: input.value,
      notes: input.notes || null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      error:
        /row-level security/i.test(error.message)
          ? "Sem permissão para lançar dados nesta empresa."
          : error.message,
    };
  }

  // Auditoria (service role — audit_logs não tem policy de insert para usuários)
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      user_id: user.id,
      action: "manual_entry.create",
      entity: "manual_metric_entries",
      entity_id: data.id,
      after: {
        company_id: input.companyId,
        metric_key: input.metricKey,
        metric_date: input.metricDate,
        value: input.value,
        notes: input.notes || null,
      },
    });
  } catch {
    // auditoria não deve bloquear o lançamento
  }

  revalidatePath("/manual-inputs");
  revalidatePath("/dashboard");
  revalidatePath("/tv");
  revalidatePath("/overview");
  return { ok: true };
}
