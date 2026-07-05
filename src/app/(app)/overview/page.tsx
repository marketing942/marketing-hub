import Link from "next/link";
import { Trophy, AlertTriangle, Users, Wallet, DollarSign, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { fetchDashboardData } from "@/lib/metrics/dashboard-data";
import type { CompanyMetrics } from "@/lib/metrics/types";
import { computeAttainment } from "@/lib/metrics/status";
import { formatMetric } from "@/lib/metrics/formatting";
import { cpl as calcCpl } from "@/lib/metrics/calculations";
import { InsightPanel } from "@/components/insights/insight-panel";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Scored {
  m: CompanyMetrics;
  spend: number;
  paidLeads: number;
  totalLeads: number;
  roi: number | null;
  score: number; // 0–1 fração de metas dentro do alvo
  goodCount: number;
  criticalCount: number;
  goalCount: number;
}

function scoreCompany(m: CompanyMetrics): Scored {
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
  return {
    m,
    spend: m.values.spend?.value ?? m.values.traffic_cost?.value ?? 0,
    paidLeads: m.values.paid_leads?.value ?? 0,
    totalLeads: m.values.total_leads?.value ?? 0,
    roi: m.values.roi?.value ?? null,
    score: total ? good / total : 0,
    goodCount: good,
    criticalCount: critical,
    goalCount: total,
  };
}

export default async function OverviewPage() {
  const data = await fetchDashboardData();
  const withData = data.filter((d) => d.hasData);

  if (withData.length === 0) {
    return (
      <div>
        <PageHeader
          title="Visão Geral"
          description="Consolidado das três empresas."
        />
        <EmptyState
          title="Sem dados consolidados"
          description="Ainda não há métricas registradas para nenhuma empresa. Configure integrações ou insira dados manuais."
        />
      </div>
    );
  }

  const scored = data.map(scoreCompany);
  const ranking = [...scored].sort((a, b) => b.score - a.score || b.totalLeads - a.totalLeads);
  const best = ranking[0];
  const alert = [...scored].sort(
    (a, b) => b.criticalCount - a.criticalCount || a.score - b.score,
  )[0];

  const totalLeads = scored.reduce((s, c) => s + c.totalLeads, 0);
  const totalSpend = scored.reduce((s, c) => s + c.spend, 0);
  const totalPaidLeads = scored.reduce((s, c) => s + c.paidLeads, 0);
  const avgCpl = calcCpl(totalSpend, totalPaidLeads);
  const roiValues = scored.map((c) => c.roi).filter((v): v is number => v != null);
  const avgRoi = roiValues.length
    ? roiValues.reduce((s, v) => s + v, 0) / roiValues.length
    : null;

  return (
    <div>
      <PageHeader
        title="Visão Geral"
        description="Consolidado das três empresas em tempo real."
      />

      {/* Insights do Dia */}
      <InsightPanel data={data} />

      {/* KPIs consolidados */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Users} label="Leads totais (dia)" value={formatMetric(totalLeads, "integer")} />
        <Kpi icon={Wallet} label="Investimento total" value={formatMetric(totalSpend, "currency")} />
        <Kpi icon={DollarSign} label="CPL médio geral" value={formatMetric(avgCpl, "currency")} />
        <Kpi icon={TrendingUp} label="ROI médio" value={avgRoi != null ? formatMetric(avgRoi, "decimal") : "—"} />
      </div>

      {/* Melhor empresa / alerta */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="border-good/30 p-5">
          <div className="flex items-center gap-2 text-good">
            <Trophy className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Melhor empresa do dia
            </span>
          </div>
          <p className="mt-2 text-lg font-semibold text-text">{best.m.company.name}</p>
          <p className="text-xs text-text-muted">
            {best.goodCount}/{best.goalCount} metas dentro do alvo · {formatMetric(best.totalLeads, "integer")} leads
          </p>
        </Card>

        <Card className={cn("p-5", alert.criticalCount > 0 ? "border-critical/40" : "border-warning/30")}>
          <div className={cn("flex items-center gap-2", alert.criticalCount > 0 ? "text-critical" : "text-warning")}>
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Empresa em atenção
            </span>
          </div>
          <p className="mt-2 text-lg font-semibold text-text">{alert.m.company.name}</p>
          <p className="text-xs text-text-muted">
            {alert.criticalCount > 0
              ? `${alert.criticalCount} métrica(s) em estado crítico`
              : `${alert.goodCount}/${alert.goalCount} metas dentro do alvo`}
          </p>
        </Card>
      </div>

      {/* Ranking */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-text">Ranking por performance</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Empresa</th>
              <th className="px-4 py-2 font-medium">Metas OK</th>
              <th className="px-4 py-2 font-medium">Leads</th>
              <th className="px-4 py-2 font-medium">Investimento</th>
              <th className="px-4 py-2 font-medium">ROI</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((c, i) => (
              <tr key={c.m.company.id} className="border-b border-border-soft last:border-0">
                <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link href="/dashboard" className="flex items-center gap-2 font-medium text-text hover:text-green-neon">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold"
                      style={{ backgroundColor: `${c.m.company.brandColor}22`, color: c.m.company.brandColor }}
                    >
                      {c.m.company.initials}
                    </span>
                    {c.m.company.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(c.score >= 0.7 ? "text-good" : c.score >= 0.4 ? "text-warning" : "text-critical")}>
                    {c.goodCount}/{c.goalCount || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-text">{formatMetric(c.totalLeads, "integer")}</td>
                <td className="px-4 py-3 text-text">{formatMetric(c.spend, "currency")}</td>
                <td className="px-4 py-3 text-text">{c.roi != null ? formatMetric(c.roi, "decimal") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-text">{value}</p>
    </Card>
  );
}
