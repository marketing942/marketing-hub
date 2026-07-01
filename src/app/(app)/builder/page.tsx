import { PageHeader, StagePlaceholder } from "@/components/layout/page-header";

export default function BuilderPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard Builder"
        description="Ative/desative cards, reordene por drag-and-drop e salve layouts (TV, Executivo, Tráfego, Orgânico, Coordenação)."
      />
      <StagePlaceholder stage="Etapa 7 (dashboard builder)" />
    </div>
  );
}
