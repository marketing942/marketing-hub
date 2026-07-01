"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import type { GoalDirection } from "@/lib/types";

export interface GoalInput {
  metricKey: string;
  direction: GoalDirection;
  target: number | null;
  warning: number | null;
  critical: number | null;
}

export interface SaveResult {
  ok: boolean;
  error?: string;
  saved?: number;
}

/**
 * Salva (upsert) as metas diárias de uma empresa. Apenas admin/coordenador.
 * Metas sem target são removidas (limpar campo = apagar meta).
 */
export async function saveCompanyGoals(
  companyId: string,
  goals: GoalInput[],
): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user || !["admin", "coordinator"].includes(user.role)) {
    return { ok: false, error: "Sem permissão para editar metas." };
  }

  const supabase = await createClient();

  const toUpsert = goals
    .filter((g) => g.target != null && !Number.isNaN(g.target))
    .map((g) => ({
      company_id: companyId,
      metric_key: g.metricKey,
      goal_type: g.direction,
      target_value: g.target,
      warning_value: g.warning ?? null,
      critical_value: g.critical ?? null,
      period: "daily",
      active: true,
      updated_by: user.id,
    }));

  const toClear = goals
    .filter((g) => g.target == null || Number.isNaN(g.target))
    .map((g) => g.metricKey);

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from("marketing_goals")
      .upsert(toUpsert, { onConflict: "company_id,metric_key,period" });
    if (error) return { ok: false, error: error.message };
  }

  if (toClear.length > 0) {
    await supabase
      .from("marketing_goals")
      .delete()
      .eq("company_id", companyId)
      .eq("period", "daily")
      .in("metric_key", toClear);
  }

  revalidatePath("/settings/goals");
  revalidatePath("/dashboard");
  revalidatePath("/tv");
  revalidatePath("/overview");
  return { ok: true, saved: toUpsert.length };
}
