"use client";

import { useState } from "react";
import type { CompanyMetrics } from "@/lib/metrics/types";
import { CARD_CATALOG } from "@/lib/metrics/catalog";
import { MetricCard } from "@/components/cards/metric-card";
import { EmptyState } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardView({ data }: { data: CompanyMetrics[] }) {
  const [activeId, setActiveId] = useState<string>(data[0]?.company.id ?? "");
  const active = data.find((d) => d.company.id === activeId) ?? data[0];

  if (!active) {
    return (
      <EmptyState
        title="Nenhuma empresa disponível"
        description="Confirme se o seed foi aplicado (npm run db:verify) e se seu usuário tem acesso às empresas."
      />
    );
  }

  const byCategory = (cat: string) => CARD_CATALOG.filter((c) => c.category === cat);

  return (
    <div>
      {/* Seletor de empresa */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {data.map(({ company: c }) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              active.company.id === c.id
                ? "border-green/50 bg-green/10 text-green-neon"
                : "border-border bg-card text-text-muted hover:text-text",
            )}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold"
              style={{ backgroundColor: `${c.brandColor}22`, color: c.brandColor }}
            >
              {c.initials}
            </span>
            {c.name}
          </button>
        ))}
      </div>

      {!active.hasData ? (
        <EmptyState
          title={`Sem dados para ${active.company.name}`}
          description="Ainda não há métricas registradas. Elas serão preenchidas pelas integrações (Meta/Google/Instagram/GA4) ou por lançamentos manuais. Configure metas em Metas e dados em Dados Manuais."
        />
      ) : (
        <>
          <Section title="Mídia paga" metrics={active} cards={byCategory("paid")} />
          <Section title="Leads do dia" metrics={active} cards={byCategory("leads")} />
          <Section title="Orgânico" metrics={active} cards={byCategory("organic")} />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  metrics,
  cards,
}: {
  title: string;
  metrics: CompanyMetrics;
  cards: typeof CARD_CATALOG;
}) {
  // Só mostra cards que têm valor OU meta configurada.
  const visible = cards.filter(
    (c) => metrics.values[c.key] != null || metrics.goals[c.key] != null,
  );
  if (visible.length === 0) return null;

  return (
    <section className="mb-8">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted/70">
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((c) => {
          const p = metrics.values[c.key];
          return (
            <MetricCard
              key={c.key}
              label={c.label}
              value={p?.value ?? null}
              previous={p?.previous ?? null}
              format={c.format}
              source={p?.source ?? "supabase"}
              goal={metrics.goals[c.key]}
              updatedAt={p?.updatedAt}
              higherIsBetter={c.higherIsBetter}
            />
          );
        })}
      </div>
    </section>
  );
}
