import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { fetchCompanies } from "@/lib/supabase/queries";
import { fetchLayouts } from "@/lib/layouts/queries";
import { getCurrentUser } from "@/lib/auth/user";
import { BuilderClient } from "@/components/builder/builder-client";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const [companies, layouts, user] = await Promise.all([
    fetchCompanies(),
    fetchLayouts(),
    getCurrentUser(),
  ]);

  const canEdit = user && ["admin", "coordinator"].includes(user.role);

  return (
    <div>
      <PageHeader
        title="Dashboard Builder"
        description="Ative/desative cards, reordene por drag-and-drop e salve layouts (TV, Executivo, Tráfego, Orgânico, Coordenação). O layout padrão de cada modo é aplicado no /tv e no Dashboard."
      />

      {!companies || companies.length === 0 ? (
        <EmptyState
          title="Nenhuma empresa encontrada"
          description="Aplique o schema e o seed (npm run db:verify)."
        />
      ) : !canEdit ? (
        <EmptyState
          title="Sem permissão para editar layouts"
          description="Apenas Admin e Coordenador podem montar dashboards. Fale com um administrador."
        />
      ) : (
        <BuilderClient companies={companies} layouts={layouts} />
      )}
    </div>
  );
}
