import type { CompanyMetrics } from "@/lib/metrics/types";
import { CARD_BY_KEY } from "@/lib/metrics/catalog";
import { computeAttainment, STATUS_LABEL } from "@/lib/metrics/status";
import { formatMetric } from "@/lib/metrics/formatting";
import type { MetricFormat } from "@/lib/types";

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertCandidate {
  /** Chave estável da regra — usada para deduplicar alertas abertos. */
  rule: string;
  companyId: string;
  metricKey: string | null;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function fmt(metricKey: string, value: number | null): string {
  const format: MetricFormat = CARD_BY_KEY[metricKey]?.format ?? "number";
  return formatMetric(value, format);
}

/**
 * Avalia as regras de alerta para uma empresa a partir das métricas do dia.
 * Puro e client-safe — reutilizado pela geração de alertas e pelos insights.
 */
export function evaluateCompanyAlerts(cm: CompanyMetrics): AlertCandidate[] {
  const out: AlertCandidate[] = [];
  const { company, values, goals } = cm;
  const label = (k: string) => CARD_BY_KEY[k]?.label ?? k;

  // 1) Métricas fora da meta (cobre CPL acima, CTR/ROI abaixo, custo perto do teto…)
  for (const [key, goal] of Object.entries(goals)) {
    const value = values[key]?.value ?? null;
    if (value == null || goal.target == null) continue;
    const { status } = computeAttainment(value, goal);
    if (status !== "warning" && status !== "critical") continue;

    const isCeiling = goal.direction === "lower";
    const rel = isCeiling ? "acima do teto" : "abaixo da meta";
    out.push({
      rule: `goal:${key}`,
      companyId: company.id,
      metricKey: key,
      severity: status === "critical" ? "critical" : "warning",
      title: `${label(key)} ${rel} (${STATUS_LABEL[status]})`,
      description: `${label(key)} está em ${fmt(key, value)} — ${isCeiling ? "teto" : "meta"} de ${fmt(key, goal.target)}.`,
      recommendation: isCeiling
        ? `Reduza ${label(key).toLowerCase()}: revise segmentação, criativos e lances.`
        : `Eleve ${label(key).toLowerCase()}: teste novos criativos, ofertas e públicos.`,
    });
  }

  // 2) Empresa com dados mas sem nenhuma meta configurada
  if (cm.hasData && Object.keys(goals).length === 0) {
    out.push({
      rule: "no_goals",
      companyId: company.id,
      metricKey: null,
      severity: "info",
      title: "Empresa sem metas configuradas",
      description: `${company.name} tem métricas, mas nenhuma meta definida — sem meta não há status.`,
      recommendation: "Configure metas em Configurações › Metas.",
    });
  }

  const spend = values.spend?.value ?? values.traffic_cost?.value ?? null;
  const paidLeads = values.paid_leads?.value ?? null;

  // 3) Investimento sem leads pagos (campanha gastando sem retorno)
  if (spend != null && spend > 0 && paidLeads === 0) {
    out.push({
      rule: "spend_no_leads",
      companyId: company.id,
      metricKey: "paid_leads",
      severity: "critical",
      title: "Investimento sem leads pagos",
      description: `Há investimento de ${fmt("spend", spend)} hoje, mas nenhum lead pago registrado.`,
      recommendation: "Verifique rastreamento (pixel/UTM) e pause campanhas sem conversão.",
    });
  }

  // 4) Queda brusca de leads vs. ontem (>= 50%)
  const tl = values.total_leads;
  if (tl?.value != null && tl.previous != null && tl.previous > 0 && tl.value <= tl.previous * 0.5) {
    out.push({
      rule: "leads_drop",
      companyId: company.id,
      metricKey: "total_leads",
      severity: "warning",
      title: "Queda brusca de leads",
      description: `Leads totais caíram de ${fmt("total_leads", tl.previous)} para ${fmt("total_leads", tl.value)} vs. ontem.`,
      recommendation: "Cheque orçamento ativo, aprovação de anúncios e sazonalidade.",
    });
  }

  // 5) Sem publicações orgânicas no dia (posts + stories + reels = 0)
  const organicKeys = ["posts_count", "stories_count", "reels_count"];
  const anyOrganicTracked = organicKeys.some((k) => values[k]?.value != null);
  if (anyOrganicTracked) {
    const sum = organicKeys.reduce((s, k) => s + (values[k]?.value ?? 0), 0);
    if (sum === 0) {
      out.push({
        rule: "no_organic_posts",
        companyId: company.id,
        metricKey: "posts_count",
        severity: "info",
        title: "Sem publicações orgânicas hoje",
        description: `${company.name} não registrou posts, stories ou reels hoje.`,
        recommendation: "Programe conteúdo orgânico para manter alcance e engajamento.",
      });
    }
  }

  // 6) Dados desatualizados (métrica mais recente com mais de 24h)
  const latest = Object.values(values)
    .map((p) => (p.updatedAt ? new Date(p.updatedAt).getTime() : 0))
    .reduce((a, b) => Math.max(a, b), 0);
  if (cm.hasData && latest > 0 && Date.now() - latest > DAY_MS) {
    const hours = Math.floor((Date.now() - latest) / (60 * 60 * 1000));
    out.push({
      rule: "stale_data",
      companyId: company.id,
      metricKey: null,
      severity: "warning",
      title: "Dados desatualizados",
      description: `A última atualização de ${company.name} foi há ~${hours}h.`,
      recommendation: "Rode a sincronização ou registre dados manuais atualizados.",
    });
  }

  return out;
}

/** Avalia todas as empresas. */
export function evaluateAllAlerts(data: CompanyMetrics[]): AlertCandidate[] {
  return data.flatMap((cm) => evaluateCompanyAlerts(cm));
}
