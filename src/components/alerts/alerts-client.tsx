"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  Eye,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import type { Company, AlertSeverity, AlertStatus } from "@/lib/types";
import type { AlertItem } from "@/lib/alerts/queries";
import { updateAlertStatus, generateAlertsNow } from "@/lib/alerts/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SEVERITY: Record<
  AlertSeverity,
  { label: string; icon: typeof Info; text: string; bg: string; border: string }
> = {
  critical: { label: "Crítico", icon: AlertOctagon, text: "text-critical", bg: "bg-critical/10", border: "border-critical/30" },
  warning: { label: "Atenção", icon: AlertTriangle, text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  info: { label: "Info", icon: Info, text: "text-text-muted", bg: "bg-border/30", border: "border-border" },
};

const STATUS_FILTERS: { value: AlertStatus | "all"; label: string }[] = [
  { value: "open", label: "Abertos" },
  { value: "reviewing", label: "Em análise" },
  { value: "resolved", label: "Resolvidos" },
  { value: "ignored", label: "Ignorados" },
  { value: "all", label: "Todos" },
];

const STATUS_LABEL: Record<AlertStatus, string> = {
  open: "Aberto",
  reviewing: "Em análise",
  resolved: "Resolvido",
  ignored: "Ignorado",
};

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export function AlertsClient({
  companies,
  alerts,
  canEdit,
}: {
  companies: Company[];
  alerts: AlertItem[];
  canEdit: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("open");
  const [companyFilter, setCompanyFilter] = useState<string | "all">("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const companyById = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c])),
    [companies],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: alerts.length };
    for (const a of alerts) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [alerts]);

  const visible = useMemo(() => {
    return alerts
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .filter((a) => companyFilter === "all" || a.companyId === companyFilter)
      .sort((a, b) => {
        const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        if (s !== 0) return s;
        return b.detectedAt.localeCompare(a.detectedAt);
      });
  }, [alerts, statusFilter, companyFilter]);

  function changeStatus(id: string, status: AlertStatus) {
    setBusyId(id);
    setMsg(null);
    startTransition(async () => {
      const res = await updateAlertStatus(id, status);
      setBusyId(null);
      if (!res.ok) setMsg(res.error ?? "Erro ao atualizar.");
    });
  }

  function generate() {
    setMsg(null);
    startTransition(async () => {
      const res = await generateAlertsNow();
      if (res.ok) {
        setMsg(
          `Alertas atualizados: ${res.created ?? 0} novo(s), ${res.resolved ?? 0} resolvido(s).`,
        );
      } else {
        setMsg(res.error ?? "Erro ao gerar alertas.");
      }
    });
  }

  return (
    <div>
      {/* Barra de ações */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f.value
                  ? "border-green/50 bg-green/10 text-green-neon"
                  : "border-border bg-card text-text-muted hover:text-text",
              )}
            >
              {f.label}
              <span className="rounded bg-card-alt px-1.5 text-[10px] tabular-nums text-text-muted">
                {counts[f.value] ?? 0}
              </span>
            </button>
          ))}
        </div>
        {canEdit && (
          <Button onClick={generate} disabled={pending} size="sm" variant="outline">
            {pending && !busyId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Gerar alertas agora
          </Button>
        )}
      </div>

      {/* Filtro por empresa */}
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip active={companyFilter === "all"} onClick={() => setCompanyFilter("all")}>
          Todas
        </FilterChip>
        {companies.map((c) => (
          <FilterChip
            key={c.id}
            active={companyFilter === c.id}
            onClick={() => setCompanyFilter(c.id)}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold"
              style={{ backgroundColor: `${c.brandColor}22`, color: c.brandColor }}
            >
              {c.initials}
            </span>
            {c.name}
          </FilterChip>
        ))}
      </div>

      {msg && (
        <p className="mb-4 rounded-md border border-border bg-card px-3 py-2 text-xs text-text-muted">
          {msg}
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title="Nenhum alerta neste filtro"
          description={
            canEdit
              ? "Tudo dentro do esperado — ou clique em “Gerar alertas agora” para reavaliar as regras."
              : "Nenhum alerta a exibir para o filtro selecionado."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {visible.map((a) => {
            const sev = SEVERITY[a.severity];
            const Icon = sev.icon;
            const company = companyById[a.companyId];
            const isBusy = busyId === a.id && pending;
            return (
              <div
                key={a.id}
                className={cn(
                  "rounded-xl border bg-card p-4",
                  a.status === "open" ? sev.border : "border-border",
                  (a.status === "resolved" || a.status === "ignored") && "opacity-60",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn("mt-0.5 rounded-lg p-2", sev.bg)}>
                    <Icon className={cn("h-4 w-4", sev.text)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-text">{a.title}</h4>
                      {company && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${company.brandColor}22`,
                            color: company.brandColor,
                          }}
                        >
                          {company.name}
                        </span>
                      )}
                      <span className="rounded bg-card-alt px-1.5 py-0.5 text-[10px] text-text-muted">
                        {STATUS_LABEL[a.status]}
                      </span>
                    </div>
                    {a.description && (
                      <p className="mt-1 text-sm text-text-muted">{a.description}</p>
                    )}
                    {a.recommendation && (
                      <p className="mt-1.5 text-xs text-green-neon/90">
                        → {a.recommendation}
                      </p>
                    )}
                    <p
                      className="mt-1.5 text-[11px] text-text-muted/60"
                      suppressHydrationWarning
                    >
                      {new Date(a.detectedAt).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-1">
                      {isBusy && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
                      {a.status !== "reviewing" && a.status !== "resolved" && (
                        <IconBtn title="Marcar em análise" onClick={() => changeStatus(a.id, "reviewing")}>
                          <Eye className="h-4 w-4" />
                        </IconBtn>
                      )}
                      {a.status !== "resolved" && (
                        <IconBtn title="Resolver" onClick={() => changeStatus(a.id, "resolved")}>
                          <Check className="h-4 w-4" />
                        </IconBtn>
                      )}
                      {a.status !== "ignored" && (
                        <IconBtn title="Ignorar" onClick={() => changeStatus(a.id, "ignored")}>
                          <X className="h-4 w-4" />
                        </IconBtn>
                      )}
                      {a.status !== "open" && (
                        <IconBtn title="Reabrir" onClick={() => changeStatus(a.id, "open")}>
                          <RotateCcw className="h-4 w-4" />
                        </IconBtn>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
        active
          ? "border-green/50 bg-green/10 text-green-neon"
          : "border-border bg-card text-text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-green/40 hover:text-green-neon"
    >
      {children}
    </button>
  );
}
