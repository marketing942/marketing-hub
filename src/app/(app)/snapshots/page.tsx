import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/card";
import { fetchCompanies } from "@/lib/supabase/queries";
import { fetchSnapshots } from "@/lib/snapshots/queries";
import { getCurrentUser } from "@/lib/auth/user";
import { SnapshotsGallery } from "@/components/snapshots/snapshots-gallery";

export const dynamic = "force-dynamic";

export default async function SnapshotsPage() {
  const [companies, snapshots, user] = await Promise.all([
    fetchCompanies(),
    fetchSnapshots(),
    getCurrentUser(),
  ]);

  const canManageAll = !!user && ["admin", "coordinator"].includes(user.role);

  return (
    <div>
      <PageHeader
        title="Snapshots"
        description="Capturas salvas do dashboard, com download em imagem/PDF e comparação entre snapshots."
      />

      {!companies ? (
        <EmptyState
          title="Nenhuma empresa encontrada"
          description="Aplique o schema e o seed (npm run db:verify)."
        />
      ) : (
        <SnapshotsGallery
          companies={companies}
          snapshots={snapshots}
          currentUserId={user?.id ?? null}
          canManageAll={canManageAll}
        />
      )}
    </div>
  );
}
