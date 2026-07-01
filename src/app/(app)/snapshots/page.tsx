import { PageHeader, StagePlaceholder } from "@/components/layout/page-header";

export default function SnapshotsPage() {
  return (
    <div>
      <PageHeader
        title="Snapshots"
        description="Capturas salvas do dashboard, com download em imagem/PDF e comparação entre snapshots."
      />
      <StagePlaceholder stage="Etapa 9 (exportação e snapshots)" />
    </div>
  );
}
