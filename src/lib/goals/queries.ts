import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GoalDirection } from "@/lib/types";

export interface GoalEntry {
  metricKey: string;
  direction: GoalDirection;
  target: number | null;
  warning: number | null;
  critical: number | null;
}

/** Metas (period=daily) por empresa: { [companyId]: { [metricKey]: GoalEntry } } */
export async function fetchGoalsByCompany(): Promise<
  Record<string, Record<string, GoalEntry>>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketing_goals")
    .select("company_id, metric_key, goal_type, target_value, warning_value, critical_value")
    .eq("period", "daily");

  const out: Record<string, Record<string, GoalEntry>> = {};
  for (const g of data ?? []) {
    (out[g.company_id] ??= {})[g.metric_key] = {
      metricKey: g.metric_key,
      direction: g.goal_type as GoalDirection,
      target: g.target_value,
      warning: g.warning_value,
      critical: g.critical_value,
    };
  }
  return out;
}
