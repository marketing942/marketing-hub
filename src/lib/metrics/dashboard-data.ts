import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fetchCompanies } from "@/lib/supabase/queries";
import { fetchLatestManualByCompany } from "@/lib/manual/queries";
import type { Goal, GoalDirection, MetricSource } from "@/lib/types";
import type { CompanyMetrics, MetricPoint } from "./types";
import { totalLeads } from "./calculations";

/** Colunas da marketing_metrics_daily mapeadas para metric_key. */
const DAILY_COLUMN: Record<string, string> = {
  cpl: "cpl",
  traffic_cost: "spend",
  spend: "spend",
  ctr: "ctr",
  cpc: "cpc",
  cpm: "cpm",
  roi: "roi",
  conversions: "conversions",
  paid_leads: "paid_leads",
  organic_leads: "organic_leads",
  total_leads: "total_leads",
  instagram_followers: "instagram_followers",
  link_clicks: "link_clicks",
  posts_count: "posts_count",
  stories_count: "stories_count",
  reels_count: "reels_count",
  reach: "reach",
  impressions: "impressions",
  engagement: "engagement",
};

interface DailyRow {
  company_id: string;
  metric_date: string;
  updated_at: string | null;
  [k: string]: number | string | null;
}
interface GoalRow {
  company_id: string;
  metric_key: string;
  goal_type: GoalDirection;
  target_value: number | null;
  warning_value: number | null;
  critical_value: number | null;
}
interface RealtimeRow {
  company_id: string;
  metric_key: string;
  value: number | null;
  source: MetricSource;
  synced_at: string | null;
}

/**
 * Monta os dados do dashboard por empresa, lendo do Supabase (respeitando RLS).
 * Sem dados => hasData=false e valores null (a UI mostra empty state).
 */
export async function fetchDashboardData(): Promise<CompanyMetrics[]> {
  const companies = await fetchCompanies();
  if (!companies || companies.length === 0) return [];

  const supabase = await createClient();
  const ids = companies.map((c) => c.id);

  // Metas (diárias, ativas)
  const { data: goalRows } = await supabase
    .from("marketing_goals")
    .select("company_id, metric_key, goal_type, target_value, warning_value, critical_value")
    .in("company_id", ids)
    .eq("active", true)
    .eq("period", "daily");

  // Métricas diárias — as 2 últimas datas por empresa (atual + anterior).
  const { data: dailyRows } = await supabase
    .from("marketing_metrics_daily")
    .select("*")
    .in("company_id", ids)
    .order("metric_date", { ascending: false })
    .limit(200);

  // Métricas em tempo real (override do valor atual + fonte real).
  const { data: rtRows } = await supabase
    .from("marketing_metrics_realtime")
    .select("company_id, metric_key, value, source, synced_at")
    .in("company_id", ids);

  // Últimos valores manuais (override com fonte "manual").
  const manualByCompany = await fetchLatestManualByCompany();

  const goalsByCompany = groupBy(goalRows as GoalRow[] | null, "company_id");
  const rtByCompany = groupBy(rtRows as RealtimeRow[] | null, "company_id");
  const dailyByCompany = groupBy(dailyRows as DailyRow[] | null, "company_id");

  return companies.map((company) => {
    const daily = (dailyByCompany[company.id] ?? []).sort((a, b) =>
      (b.metric_date as string).localeCompare(a.metric_date as string),
    );
    const current = daily[0];
    const previous = daily[1];

    const values: Record<string, MetricPoint> = {};

    for (const metricKey of Object.keys(DAILY_COLUMN)) {
      const col = DAILY_COLUMN[metricKey];
      const value = current ? toNum(current[col]) : null;
      const prev = previous ? toNum(previous[col]) : null;
      if (value != null || prev != null) {
        values[metricKey] = {
          value,
          previous: prev,
          source: "supabase",
          updatedAt: (current?.updated_at as string) ?? null,
        };
      }
    }

    // total_leads derivado quando não veio pronto
    if (values.total_leads == null && (values.paid_leads || values.organic_leads)) {
      values.total_leads = {
        value: totalLeads(
          values.paid_leads?.value ?? null,
          values.organic_leads?.value ?? null,
        ),
        previous: totalLeads(
          values.paid_leads?.previous ?? null,
          values.organic_leads?.previous ?? null,
        ),
        source: "supabase",
        updatedAt: values.paid_leads?.updatedAt ?? null,
      };
    }

    // Override com realtime (fonte e valor mais recentes)
    for (const rt of rtByCompany[company.id] ?? []) {
      values[rt.metric_key] = {
        value: toNum(rt.value),
        previous: values[rt.metric_key]?.previous ?? null,
        source: rt.source,
        updatedAt: rt.synced_at,
      };
    }

    // Override manual (prioridade máxima — atualização imediata do gestor)
    for (const [metricKey, m] of Object.entries(manualByCompany[company.id] ?? {})) {
      values[metricKey] = {
        value: toNum(m.value),
        previous: values[metricKey]?.previous ?? null,
        source: "manual",
        updatedAt: m.updatedAt,
      };
    }

    const goals: Record<string, Goal> = {};
    for (const g of goalsByCompany[company.id] ?? []) {
      goals[g.metric_key] = {
        metricKey: g.metric_key,
        direction: g.goal_type,
        target: g.target_value,
        warning: g.warning_value,
        critical: g.critical_value,
      };
    }

    return {
      company,
      values,
      goals,
      hasData: Object.keys(values).length > 0,
      metricDate: (current?.metric_date as string) ?? null,
    };
  });
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function groupBy<T, K extends keyof T>(
  rows: T[] | null,
  key: K,
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const r of rows ?? []) {
    const k = String(r[key]);
    (out[k] ??= []).push(r);
  }
  return out;
}
