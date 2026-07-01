import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { fetchIntegrations } from "@/lib/integrations/queries";
import { getCurrentUser } from "@/lib/auth/user";
import { IntegrationStatusCard } from "@/components/integrations/integration-status-card";

export const dynamic = "force-dynamic";

export default async function IntegrationsSettingsPage() {
  const [integrations, user] = await Promise.all([
    fetchIntegrations(),
    getCurrentUser(),
  ]);
  const canManage = user && ["admin", "coordinator"].includes(user.role);

  return (
    <div>
      <PageHeader
        title="Integrações"
        description="Conecte Meta Ads, Google Ads, Instagram e GA4. O status é sempre real — nunca aparece conectado sem um teste válido. Tokens ficam no servidor e são exibidos mascarados."
      />

      {!canManage ? (
        <EmptyState
          title="Sem permissão"
          description="Apenas Admin e Coordenador podem gerenciar integrações."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {integrations.map((it) => (
            <IntegrationStatusCard key={it.id} data={it} />
          ))}
        </div>
      )}
    </div>
  );
}
