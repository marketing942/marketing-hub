import type { CompanyMetrics } from "@/lib/metrics/types";
import { computeAttainment } from "@/lib/metrics/status";
import { formatMetric, formatSignedPct } from "@/lib/metrics/formatting";
import { evaluateAllAlerts } from "@/lib/alerts/rules";

export type InsightTone = "positive" | "attention" | "negative" | "neutral";

export interface Insight {
  tone: InsightTone;
  title: string;
  detail: string;
}

function goalScore(m: CompanyMetrics): {
  good: number;
  critical: number;
  total: number;
} {
  let good = 0,
    critical = 0,
    total = 0;
  for (const [key, goal] of Object.entries(m.goals)) {
    const v = m.values[key]?.value ?? null;
    if (v == null) continue;
    const { status } = computeAttainment(v, goal);
    total++;
    if (status === "good") good++;
    if (status === "critical") critical++;
  }
  return { good, critical, total };
}

/**
 * "Insights do Dia": leitura rápida do consolidado — o que melhorou/piorou,
 * melhor empresa, empresa em atenção, gargalos e o que fazer hoje.
 * Puro e client-safe.
 */
export function buildInsights(data: CompanyMetrics[]): Insight[] {
  const withData = data.filter((d) => d.hasData);
  if (withData.length === 0) return [];

  const insights: Insight[] = [];

  // 1) Leads hoje vs. ontem (consolidado)
  let leadsToday = 0,
    leadsYesterday = 0;
  for (const m of withData) {
    const tl = m.values.total_leads;
    if (tl?.value != null) leadsToday += tl.value;
    if (tl?.previous != null) leadsYesterday += tl.previous;
  }
  if (leadsYesterday > 0) {
    const pct = ((leadsToday - leadsYesterday) / leadsYesterday) * 100;
    const up = leadsToday >= leadsYesterday;
    insights.push({
      tone: up ? "positive" : "negative",
      title: up ? "Leads em alta hoje" : "Leads em queda hoje",
      detail: `${formatMetric(leadsToday, "integer")} leads totais (${formatSignedPct(pct)} vs. ontem).`,
    });
  }

  // 2) Melhor empresa (maior fração de metas atingidas)
  const scored = withData
    .map((m) => ({ m, ...goalScore(m) }))
    .filter((s) => s.total > 0);
  if (scored.length > 0) {
    const best = [...scored].sort((a, b) => b.good / b.total - a.good / a.total)[0];
    insights.push({
      tone: "positive",
      title: `Destaque: ${best.m.company.name}`,
      detail: `${best.good} de ${best.total} metas dentro do alvo.`,
    });

    // 3) Empresa em atenção (mais métricas críticas)
    const worst = [...scored].sort((a, b) => b.critical - a.critical)[0];
    if (worst.critical > 0) {
      insights.push({
        tone: "attention",
        title: `Atenção: ${worst.m.company.name}`,
        detail: `${worst.critical} métrica(s) em nível crítico.`,
      });
    }
  }

  // 4) Gargalos: principais alertas críticos/atenção
  const alerts = evaluateAllAlerts(withData);
  const bottlenecks = alerts
    .filter((a) => a.severity === "critical")
    .slice(0, 3);
  for (const a of bottlenecks) {
    const company = withData.find((m) => m.company.id === a.companyId);
    insights.push({
      tone: "negative",
      title: a.title,
      detail: `${company ? company.company.name + ": " : ""}${a.recommendation}`,
    });
  }

  // 5) O que fazer hoje (primeira recomendação de atenção, se não houver crítico)
  if (bottlenecks.length === 0) {
    const warn = alerts.find((a) => a.severity === "warning");
    if (warn) {
      const company = withData.find((m) => m.company.id === warn.companyId);
      insights.push({
        tone: "attention",
        title: "O que fazer hoje",
        detail: `${company ? company.company.name + ": " : ""}${warn.recommendation}`,
      });
    } else {
      insights.push({
        tone: "neutral",
        title: "Tudo dentro do esperado",
        detail: "Sem gargalos críticos hoje. Mantenha o acompanhamento.",
      });
    }
  }

  return insights;
}
