"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Camera,
  X,
} from "lucide-react";
import Link from "next/link";
import type { CompanyMetrics } from "@/lib/metrics/types";
import { CARD_BY_KEY, TV_CARD_KEYS } from "@/lib/metrics/catalog";
import type { LayoutCardEntry } from "@/lib/layouts/types";
import { ROTATION_INTERVAL_MS } from "@/lib/companies";
import { useCompanyRotation } from "@/hooks/use-company-rotation";
import { useClock } from "@/hooks/use-clock";
import { MetricCard } from "@/components/cards/metric-card";
import { EmptyState } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TVDashboard({
  data,
  layouts = {},
}: {
  data: CompanyMetrics[];
  layouts?: Record<string, LayoutCardEntry[]>;
}) {
  const count = Math.max(data.length, 1);
  const { index, paused, progress, next, prev, togglePause } =
    useCompanyRotation(count, ROTATION_INTERVAL_MS);
  const clock = useClock();
  const rootRef = useRef<HTMLDivElement>(null);

  const current = data[index];

  function toggleFullscreen() {
    const el = rootRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  if (!current) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg p-10">
        <EmptyState
          title="Nenhuma empresa para exibir"
          description="Confirme o seed (npm run db:verify) e o acesso do usuário às empresas."
          className="max-w-md"
        />
      </div>
    );
  }

  const company = current.company;
  // Layout salvo no Builder (modo TV) tem prioridade; senão usa o catálogo padrão.
  const layoutCards = layouts[company.id];
  const ordered =
    layoutCards && layoutCards.length > 0
      ? layoutCards.map((c) => ({ key: c.key, size: c.size }))
      : TV_CARD_KEYS.map((k) => ({ key: k, size: "md" as const }));

  const tvCards = ordered
    .map((o) => ({
      key: o.key,
      size: o.size,
      def: CARD_BY_KEY[o.key],
      point: current.values[o.key],
      goal: current.goals[o.key],
    }))
    .filter((c) => c.def && (c.point != null || c.goal != null));

  return (
    <div
      ref={rootRef}
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-bg px-8 py-6"
    >
      {/* Cabeçalho */}
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold glow-green"
            style={{
              backgroundColor: `${company.brandColor}22`,
              color: company.brandColor,
            }}
          >
            {company.initials}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-text">
              {company.name}
            </h1>
            <p className="mt-0.5 text-sm text-text-muted">
              Empresa {index + 1} de {count} · rotação a cada 20s
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-3xl font-semibold tabular-nums text-text">
            {clock
              ? clock.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "--:--:--"}
          </p>
          <p className="text-xs text-text-muted">
            {clock
              ? clock.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
              : ""}
          </p>
        </div>
      </header>

      {/* Timer de rotação */}
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-card-alt">
        <div
          className="h-full rounded-full bg-green-neon transition-[width] duration-100 ease-linear"
          style={{ width: `${(paused ? 0 : progress) * 100}%` }}
        />
      </div>

      {/* Cards */}
      <div className="flex flex-1 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={company.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
          >
            {tvCards.length === 0 ? (
              <EmptyState
                title={`Sem dados para ${company.name}`}
                description="Nenhuma métrica ou meta registrada ainda. Configure metas e integrações para exibir na TV."
                className="mx-auto max-w-xl"
              />
            ) : (
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                {tvCards.map((c) => (
                  <div key={c.key} className={cn(c.size === "lg" && "lg:col-span-2")}>
                    <MetricCard
                      label={c.def.label}
                      value={c.point?.value ?? null}
                      previous={c.point?.previous ?? null}
                      format={c.def.format}
                      source={c.point?.source ?? "supabase"}
                      goal={c.goal}
                      updatedAt={c.point?.updatedAt}
                      higherIsBetter={c.def.higherIsBetter}
                      size="lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controles */}
      <footer className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.map((d, i) => (
            <span
              key={d.company.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-8 bg-green-neon" : "w-3 bg-border",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <TvBtn onClick={prev} title="Empresa anterior">
            <ChevronLeft className="h-5 w-5" />
          </TvBtn>
          <TvBtn onClick={togglePause} title={paused ? "Retomar" : "Pausar"}>
            {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </TvBtn>
          <TvBtn onClick={next} title="Próxima empresa">
            <ChevronRight className="h-5 w-5" />
          </TvBtn>
          <TvBtn onClick={() => {}} title="Salvar snapshot (Etapa 9)" disabled>
            <Camera className="h-5 w-5" />
          </TvBtn>
          <TvBtn onClick={toggleFullscreen} title="Tela cheia">
            <Maximize className="h-5 w-5" />
          </TvBtn>
          <Link href="/dashboard">
            <TvBtn title="Sair do modo TV">
              <X className="h-5 w-5" />
            </TvBtn>
          </Link>
        </div>
      </footer>
    </div>
  );
}

function TvBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-text-muted transition-colors",
        "hover:border-green/40 hover:text-green-neon",
        "disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-muted",
      )}
    >
      {children}
    </button>
  );
}
