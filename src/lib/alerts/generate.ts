import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Company, Goal, GoalDirection } from "@/lib/types";
import type { CompanyMetrics, MetricPoint } from "@/lib/metrics/types";
import { totalLeads } from "@/lib/metrics/calculations";
import { evaluateAllAlerts, type AlertCandidate } from "./rules";

/** metric_key -> coluna de marketing_metrics_daily. */
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

function initialsOf(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function groupBy<T extends Record<string, unknown>>(rows: T[] | null, key: string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const r of rows ?? []) (out[String(r[key])] ??= []).push(r);
  return out;
}

/**
 * Monta as métricas por empresa a partir de um client Supabase (sessão ou admin).
 * Espelha o dashboard-data, mas desacoplado dos helpers que fixam o client de sessão,
 * para poder rodar também no cron (service role).
 */
export async function buildMetricsForAlerts(
  supabase: SupabaseClient,
): Promise<CompanyMetrics[]> {
  const { data: companyRows } = await supabase
    .from("companies")
    .select("id,name,slug,status,brand_color,logo_url")
    .order("sort_order", { ascending: true });
  if (!companyRows || companyRows.length === 0) return [];

  const companies: Company[] = companyRows.map((c) => ({
    id: c.id as string,
    slug: c.slug as Company["slug"],
    name: c.name as string,
    shortName: (c.name as string).replace(/^(CPPEM|Colégio)\s+/i, "") || (c.name as string),
    initials: initialsOf(c.name as string),
    status: c.status as Company["status"],
    brandColor: c.brand_color as string,
    logoUrl: (c.logo_url as string) ?? null,
  }));
  const ids = companies.map((c) => c.id);

  const [{ data: goalRows }, { data: dailyRows }, { data: rtRows }, { data: manualRows }] =
    await Promise.all([
      supabase
        .from("marketing_goals")
        .select("company_id, metric_key, goal_type, target_value, warning_value, critical_value")
        .in("company_id", ids)
        .eq("active", true)
        .eq("period", "daily"),
      supabase
        .from("marketing_metrics_daily")
        .select("*")
        .in("company_id", ids)
        .order("metric_date", { ascending: false })
        .limit(200),
      supabase
        .from("marketing_metrics_realtime")
        .select("company_id, metric_key, value, source, synced_at")
        .in("company_id", ids),
      supabase
        .from("manual_metric_entries")
        .select("company_id, metric_key, value, metric_date, created_at")
        .in("company_id", ids)
        .order("metric_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

  const goalsByCompany = groupBy(goalRows as Record<string, unknown>[] | null, "company_id");
  const rtByCompany = groupBy(rtRows as Record<string, unknown>[] | null, "company_id");
  const dailyByCompany = groupBy(dailyRows as Record<string, unknown>[] | null, "company_id");

  const manualByCompany: Record<string, Record<string, { value: number | null; updatedAt: string }>> = {};
  for (const r of manualRows ?? []) {
    const byMetric = (manualByCompany[r.company_id as string] ??= {});
    if (!(String(r.metric_key) in byMetric)) {
      byMetric[r.metric_key as string] = {
        value: toNum(r.value),
        updatedAt: r.created_at as string,
      };
    }
  }

  return companies.map((company) => {
    const daily = (dailyByCompany[company.id] ?? []).sort((a, b) =>
      String(b.metric_date).localeCompare(String(a.metric_date)),
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

    if (values.total_leads == null && (values.paid_leads || values.organic_leads)) {
      values.total_leads = {
        value: totalLeads(values.paid_leads?.value ?? null, values.organic_leads?.value ?? null),
        previous: totalLeads(values.paid_leads?.previous ?? null, values.organic_leads?.previous ?? null),
        source: "supabase",
        updatedAt: values.paid_leads?.updatedAt ?? null,
      };
    }

    for (const rt of rtByCompany[company.id] ?? []) {
      values[rt.metric_key as string] = {
        value: toNum(rt.value),
        previous: values[rt.metric_key as string]?.previous ?? null,
        source: rt.source as MetricPoint["source"],
        updatedAt: (rt.synced_at as string) ?? null,
      };
    }
    for (const [metricKey, m] of Object.entries(manualByCompany[company.id] ?? {})) {
      values[metricKey] = {
        value: m.value,
        previous: values[metricKey]?.previous ?? null,
        source: "manual",
        updatedAt: m.updatedAt,
      };
    }

    const goals: Record<string, Goal> = {};
    for (const g of goalsByCompany[company.id] ?? []) {
      goals[g.metric_key as string] = {
        metricKey: g.metric_key as string,
        direction: g.goal_type as GoalDirection,
        target: toNum(g.target_value),
        warning: toNum(g.warning_value),
        critical: toNum(g.critical_value),
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

export interface GenerateResult {
  created: number;
  resolved: number;
  open: number;
}

/**
 * Gera alertas a partir das métricas: insere os novos (dedupe por empresa+regra
 * enquanto houver um alerta aberto), e auto-resolve os alertas automáticos abertos
 * cuja condição não vale mais. Requer client com permissão de escrita (RLS can_edit
 * ou service role).
 */
export async function generateAlerts(
  supabase: SupabaseClient,
  data?: CompanyMetrics[],
): Promise<GenerateResult> {
  const metrics = data ?? (await buildMetricsForAlerts(supabase));
  const candidates = evaluateAllAlerts(metrics);
  const companyIds = metrics.map((m) => m.company.id);

  // Alertas automáticos abertos hoje (dedupe + auto-resolução).
  const { data: openRows } = await supabase
    .from("marketing_alerts")
    .select("id, company_id, status, metadata")
    .in("company_id", companyIds)
    .eq("status", "open");

  const openAuto = (openRows ?? []).filter(
    (r) => (r.metadata as { auto?: boolean } | null)?.auto === true,
  );
  const openKey = (companyId: string, rule: string) => `${companyId}|${rule}`;
  const openSet = new Set(
    openAuto.map((r) => openKey(r.company_id as string, (r.metadata as { rule?: string }).rule ?? "")),
  );
  const candidateSet = new Set(candidates.map((c) => openKey(c.companyId, c.rule)));

  // Inserir os novos
  const toInsert = candidates.filter((c) => !openSet.has(openKey(c.companyId, c.rule)));
  let created = 0;
  if (toInsert.length > 0) {
    const rows = toInsert.map((c: AlertCandidate) => ({
      company_id: c.companyId,
      metric_key: c.metricKey,
      severity: c.severity,
      title: c.title,
      description: c.description,
      recommendation: c.recommendation,
      status: "open",
      metadata: { auto: true, rule: c.rule },
    }));
    const { data: ins, error } = await supabase.from("marketing_alerts").insert(rows).select("id");
    if (error) throw new Error(error.message);
    created = ins?.length ?? 0;
  }

  // Auto-resolver os que não valem mais
  const staleIds = openAuto
    .filter((r) => !candidateSet.has(openKey(r.company_id as string, (r.metadata as { rule?: string }).rule ?? "")))
    .map((r) => r.id as string);
  let resolved = 0;
  if (staleIds.length > 0) {
    const { error } = await supabase
      .from("marketing_alerts")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .in("id", staleIds);
    if (!error) resolved = staleIds.length;
  }

  return { created, resolved, open: candidates.length };
}
