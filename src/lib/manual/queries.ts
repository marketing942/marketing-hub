import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ManualEntry {
  id: string;
  companyId: string;
  metricKey: string;
  metricDate: string;
  value: number | null;
  notes: string | null;
  createdAt: string;
  createdByName: string | null;
}

interface Row {
  id: string;
  company_id: string;
  metric_key: string;
  metric_date: string;
  value: number | null;
  notes: string | null;
  created_at: string;
  creator: { full_name: string | null; email: string | null } | null;
}

/** Histórico recente de lançamentos manuais (respeita RLS por empresa). */
export async function fetchManualEntries(limit = 50): Promise<ManualEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("manual_metric_entries")
    .select(
      "id, company_id, metric_key, metric_date, value, notes, created_at, creator:profiles!created_by(full_name,email)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as Row[] | null ?? []).map((r) => ({
    id: r.id,
    companyId: r.company_id,
    metricKey: r.metric_key,
    metricDate: r.metric_date,
    value: r.value,
    notes: r.notes,
    createdAt: r.created_at,
    createdByName: r.creator?.full_name ?? r.creator?.email ?? null,
  }));
}

/**
 * Último valor manual por (empresa, metric_key) — usado como override no dashboard.
 * { [companyId]: { [metricKey]: { value, updatedAt } } }
 */
export async function fetchLatestManualByCompany(): Promise<
  Record<string, Record<string, { value: number | null; updatedAt: string }>>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("manual_metric_entries")
    .select("company_id, metric_key, value, metric_date, created_at")
    .order("metric_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  const out: Record<string, Record<string, { value: number | null; updatedAt: string }>> = {};
  for (const r of data ?? []) {
    const byMetric = (out[r.company_id] ??= {});
    // primeira ocorrência = mais recente (ordenado desc)
    if (!(r.metric_key in byMetric)) {
      byMetric[r.metric_key] = { value: r.value, updatedAt: r.created_at };
    }
  }
  return out;
}
