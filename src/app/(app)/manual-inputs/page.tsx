import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { fetchCompanies } from "@/lib/supabase/queries";
import { fetchManualEntries } from "@/lib/manual/queries";
import { ManualMetricForm } from "@/components/manual/manual-metric-form";
import { CARD_BY_KEY } from "@/lib/metrics/catalog";
import { formatMetric } from "@/lib/metrics/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function ManualInputsPage() {
  const [companies, entries] = await Promise.all([
    fetchCompanies(),
    fetchManualEntries(50),
  ]);

  const companyName = (id: string) =>
    companies?.find((c) => c.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Dados Manuais"
        description="Lance métricas que não vêm de API (posts, stories, reels, leads orgânicos, observações). Cada lançamento fica registrado com autor e data."
      />

      {!companies || companies.length === 0 ? (
        <EmptyState title="Nenhuma empresa disponível" description="Aplique o seed e verifique seu acesso." />
      ) : (
        <div className="space-y-6">
          <ManualMetricForm companies={companies} />

          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium text-text">Histórico de lançamentos</h3>
            </div>
            {entries.length === 0 ? (
              <div className="p-6">
                <EmptyState title="Nenhum lançamento ainda" description="Os lançamentos manuais aparecerão aqui." />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-text-muted">
                    <th className="px-4 py-2 font-medium">Data</th>
                    <th className="px-4 py-2 font-medium">Empresa</th>
                    <th className="px-4 py-2 font-medium">Métrica</th>
                    <th className="px-4 py-2 font-medium">Valor</th>
                    <th className="px-4 py-2 font-medium">Observação</th>
                    <th className="px-4 py-2 font-medium">Autor</th>
                    <th className="px-4 py-2 font-medium">Registrado</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const card = CARD_BY_KEY[e.metricKey];
                    return (
                      <tr key={e.id} className="border-b border-border-soft last:border-0">
                        <td className="px-4 py-2 text-text-muted">{e.metricDate}</td>
                        <td className="px-4 py-2 text-text">{companyName(e.companyId)}</td>
                        <td className="px-4 py-2 text-text">{card?.label ?? e.metricKey}</td>
                        <td className="px-4 py-2 font-medium text-text">
                          {formatMetric(e.value, card?.format ?? "number")}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-2 text-text-muted">{e.notes ?? "—"}</td>
                        <td className="px-4 py-2 text-text-muted">{e.createdByName ?? "—"}</td>
                        <td className="px-4 py-2 text-text-muted">
                          {format(new Date(e.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
