import { PageHeader, StagePlaceholder } from "@/components/layout/page-header";

export default function UsersSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gestão de usuários, perfis (Admin, Coordenador, Tráfego, Social, Visualizador) e acesso por empresa."
      />
      <StagePlaceholder stage="Etapa 2 (auth e permissões)" />
    </div>
  );
}
