import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { fetchCompanies } from "@/lib/supabase/queries";
import { fetchGoalsByCompany } from "@/lib/goals/queries";
import { getCurrentUser } from "@/lib/auth/user";
import { GoalsEditor } from "@/components/settings/goals-editor";

export const dynamic = "force-dynamic";

export default async function GoalsSettingsPage() {
  const [companies, goalsByCompany, user] = await Promise.all([
    fetchCompanies(),
    fetchGoalsByCompany(),
    getCurrentUser(),
  ]);

  const canEdit = user && ["admin", "coordinator"].includes(user.role);

  return (
    <div>
      <PageHeader
        title="Metas"
        description="Defina metas e tetos por empresa: CPL, custo de tráfego, CTR, ROI, leads, CPC, CPM e mais."
      />

      {!companies || companies.length === 0 ? (
        <EmptyState
          title="Nenhuma empresa encontrada"
          description="Aplique o schema e o seed (npm run db:verify)."
        />
      ) : !canEdit ? (
        <EmptyState
          title="Sem permissão para editar metas"
          description="Apenas Admin e Coordenador podem editar metas. Fale com um administrador."
        />
      ) : (
        <GoalsEditor companies={companies} goalsByCompany={goalsByCompany} />
      )}
    </div>
  );
}
