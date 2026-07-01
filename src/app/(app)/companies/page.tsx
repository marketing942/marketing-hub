import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { fetchCompanies } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await fetchCompanies();

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Empresas acompanhadas pelo hub de marketing."
        actions={
          companies ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-good/30 bg-good/10 px-3 py-1 text-xs text-good">
              <span className="h-1.5 w-1.5 rounded-full bg-good" />
              Supabase conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              Schema pendente
            </span>
          )
        }
      />

      {companies === null ? (
        <EmptyState
          title="Nenhuma empresa encontrada no Supabase"
          description="Aplique o schema (supabase/apply_all.sql) no SQL Editor do Supabase. As 3 empresas são criadas pelo seed."
        />
      ) : companies.length === 0 ? (
        <EmptyState
          title="Seed não executado"
          description="O schema existe, mas nenhuma empresa foi inserida. Rode a seção de seed do apply_all.sql."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Card key={c.slug} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
                  style={{
                    backgroundColor: `${c.brandColor}22`,
                    color: c.brandColor,
                  }}
                >
                  {c.initials}
                </span>
                <div>
                  <p className="font-medium text-text">{c.name}</p>
                  <p className="text-xs text-text-muted">/{c.slug}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-good">
                  <span className="h-1.5 w-1.5 rounded-full bg-good" />
                  {c.status === "active" ? "Ativa" : "Inativa"}
                </span>
                <span className="text-text-muted">via Supabase</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
