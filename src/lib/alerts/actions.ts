"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import type { AlertStatus } from "@/lib/types";
import { generateAlerts } from "./generate";

function canEdit(role: string | undefined): boolean {
  return role === "admin" || role === "coordinator";
}

/** Atualiza o status de um alerta (open/reviewing/resolved/ignored). */
export async function updateAlertStatus(
  alertId: string,
  status: AlertStatus,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canEdit(user.role)) {
    return { ok: false, error: "Sem permissão para alterar alertas." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketing_alerts")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", alertId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/alerts");
  return { ok: true };
}

/** Reavalia as regras e gera/atualiza os alertas automáticos. */
export async function generateAlertsNow(): Promise<{
  ok: boolean;
  error?: string;
  created?: number;
  resolved?: number;
}> {
  const user = await getCurrentUser();
  if (!user || !canEdit(user.role)) {
    return { ok: false, error: "Sem permissão para gerar alertas." };
  }
  const supabase = await createClient();
  try {
    const res = await generateAlerts(supabase);
    revalidatePath("/alerts");
    return { ok: true, created: res.created, resolved: res.resolved };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
