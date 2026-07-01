import { PageHeader, StagePlaceholder } from "@/components/layout/page-header";

export default function AlertsPage() {
  return (
    <div>
      <PageHeader
        title="Alertas"
        description="Alertas inteligentes por empresa: CPL acima da meta, queda de leads, API com erro, dados desatualizados e mais."
      />
      <StagePlaceholder stage="Etapa 8 (alertas e insights)" />
    </div>
  );
}
