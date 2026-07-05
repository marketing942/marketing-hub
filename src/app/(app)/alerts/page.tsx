import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { fetchCompanies } from "@/lib/supabase/queries";
import { fetchAlerts } from "@/lib/alerts/queries";
import { getCurrentUser } from "@/lib/auth/user";
import { AlertsClient } from "@/components/alerts/alerts-client";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [companies, alerts, user] = await Promise.all([
    fetchCompanies(),
    fetchAlerts(),
    getCurrentUser(),
  ]);

  const canEdit = !!user && ["admin", "coordinator"].includes(user.role);

  return (
    <div>
      <PageHeader
        title="Alertas"
        description="Alertas inteligentes por empresa: CPL acima da meta, queda de leads, investimento sem retorno, dados desatualizados e mais."
      />

      {!companies || companies.length === 0 ? (
        <EmptyState
          title="Nenhuma empresa encontrada"
          description="Aplique o schema e o seed (npm run db:verify)."
        />
      ) : (
        <AlertsClient companies={companies} alerts={alerts} canEdit={canEdit} />
      )}
    </div>
  );
}
