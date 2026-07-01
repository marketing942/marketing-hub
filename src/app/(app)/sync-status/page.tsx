import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { fetchSyncJobs } from "@/lib/integrations/sync-queries";
import { PROVIDER_BY_ID } from "@/lib/integrations/providers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS = {
  success: { label: "Sucesso", cls: "text-good", Icon: CheckCircle2 },
  error: { label: "Erro", cls: "text-critical", Icon: XCircle },
  running: { label: "Executando", cls: "text-warning", Icon: Loader2 },
  pending: { label: "Pendente", cls: "text-text-muted", Icon: Clock },
} as const;

export default async function SyncStatusPage() {
  const jobs = await fetchSyncJobs(40);

  return (
    <div>
      <PageHeader
        title="Sincronização"
        description="Histórico das execuções de sync por provedor. Cada job registra status, registros processados e erros."
      />

      {jobs.length === 0 ? (
        <EmptyState
          title="Nenhuma sincronização ainda"
          description="Dispare uma sincronização em Integrações ou aguarde o cron. Os jobs aparecerão aqui."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="px-4 py-2 font-medium">Provedor</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Registros</th>
                <th className="px-4 py-2 font-medium">Início</th>
                <th className="px-4 py-2 font-medium">Fim</th>
                <th className="px-4 py-2 font-medium">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const st = STATUS[j.status as keyof typeof STATUS] ?? STATUS.pending;
                return (
                  <tr key={j.id} className="border-b border-border-soft last:border-0">
                    <td className="px-4 py-2 font-medium text-text">
                      {PROVIDER_BY_ID[j.provider]?.label ?? j.provider}
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn("inline-flex items-center gap-1", st.cls)}>
                        <st.Icon className={cn("h-3.5 w-3.5", j.status === "running" && "animate-spin")} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-text">{j.recordsProcessed}</td>
                    <td className="px-4 py-2 text-text-muted">
                      {j.startedAt ? format(new Date(j.startedAt), "dd/MM HH:mm:ss", { locale: ptBR }) : "—"}
                    </td>
                    <td className="px-4 py-2 text-text-muted">
                      {j.finishedAt ? format(new Date(j.finishedAt), "dd/MM HH:mm:ss", { locale: ptBR }) : "—"}
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-2 text-text-muted" title={j.errorMessage ?? ""}>
                      {j.errorMessage ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
