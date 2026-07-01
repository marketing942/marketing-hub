"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, TrendingDown, TrendingUp } from "lucide-react";
import type { Company } from "@/lib/types";
import { CARD_CATALOG } from "@/lib/metrics/catalog";
import { saveCompanyGoals, type GoalInput } from "@/lib/goals/actions";
import type { GoalEntry } from "@/lib/goals/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Draft = Record<string, { target: string; warning: string; critical: string }>;

function buildDraft(goals: Record<string, GoalEntry> | undefined): Draft {
  const d: Draft = {};
  for (const c of CARD_CATALOG) {
    const g = goals?.[c.key];
    d[c.key] = {
      target: g?.target != null ? String(g.target) : "",
      warning: g?.warning != null ? String(g.warning) : "",
      critical: g?.critical != null ? String(g.critical) : "",
    };
  }
  return d;
}

export function GoalsEditor({
  companies,
  goalsByCompany,
}: {
  companies: Company[];
  goalsByCompany: Record<string, Record<string, GoalEntry>>;
}) {
  const [activeId, setActiveId] = useState(companies[0]?.id ?? "");
  const [draft, setDraft] = useState<Draft>(() =>
    buildDraft(goalsByCompany[companies[0]?.id]),
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchCompany(id: string) {
    setActiveId(id);
    setDraft(buildDraft(goalsByCompany[id]));
    setSaved(false);
    setError(null);
  }

  function setField(key: string, field: keyof Draft[string], value: string) {
    setDraft((d) => ({ ...d, [key]: { ...d[key], [field]: value } }));
    setSaved(false);
  }

  function save() {
    setError(null);
    const goals: GoalInput[] = CARD_CATALOG.map((c) => {
      const row = draft[c.key];
      const num = (s: string) => (s.trim() === "" ? null : Number(s));
      return {
        metricKey: c.key,
        direction: c.higherIsBetter ? "higher" : "lower",
        target: num(row.target),
        warning: num(row.warning),
        critical: num(row.critical),
      };
    });
    startTransition(async () => {
      const res = await saveCompanyGoals(activeId, goals);
      if (res.ok) {
        setSaved(true);
        goalsByCompany[activeId] = Object.fromEntries(
          goals
            .filter((g) => g.target != null)
            .map((g) => [g.metricKey, { ...g } as GoalEntry]),
        );
      } else {
        setError(res.error ?? "Erro ao salvar.");
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => switchCompany(c.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                activeId === c.id
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
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-critical">{error}</span>}
          {saved && !pending && (
            <span className="inline-flex items-center gap-1 text-xs text-good">
              <Check className="h-3.5 w-3.5" /> Salvo
            </span>
          )}
          <Button onClick={save} disabled={pending} size="sm">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Salvando..." : "Salvar metas"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card-alt/50 text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Métrica</th>
              <th className="px-4 py-3 font-medium">Direção</th>
              <th className="px-4 py-3 font-medium">Meta / Teto</th>
              <th className="px-4 py-3 font-medium">Atenção</th>
              <th className="px-4 py-3 font-medium">Crítico</th>
            </tr>
          </thead>
          <tbody>
            {CARD_CATALOG.map((c) => {
              const row = draft[c.key];
              const suffix =
                c.format === "currency" ? "R$" : c.format === "percent" ? "%" : "";
              return (
                <tr key={c.key} className="border-b border-border-soft last:border-0">
                  <td className="px-4 py-2 font-medium text-text">{c.label}</td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs",
                        c.higherIsBetter ? "text-good" : "text-warning",
                      )}
                    >
                      {c.higherIsBetter ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {c.higherIsBetter ? "Maior melhor" : "Menor melhor (teto)"}
                    </span>
                  </td>
                  <NumCell value={row.target} suffix={suffix} onChange={(v) => setField(c.key, "target", v)} />
                  <NumCell value={row.warning} suffix={suffix} onChange={(v) => setField(c.key, "warning", v)} />
                  <NumCell value={row.critical} suffix={suffix} onChange={(v) => setField(c.key, "critical", v)} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Deixe a Meta/Teto em branco para remover a meta da métrica. Atenção e Crítico
        são opcionais — quando vazios, o sistema usa limiares automáticos.
      </p>
    </div>
  );
}

function NumCell({
  value,
  suffix,
  onChange,
}: {
  value: string;
  suffix: string;
  onChange: (v: string) => void;
}) {
  return (
    <td className="px-4 py-2">
      <div className="flex items-center gap-1">
        {suffix && <span className="text-[11px] text-text-muted">{suffix}</span>}
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="w-24 rounded-md border border-border bg-bg-elevated px-2 py-1 text-sm text-text placeholder:text-text-muted/50 focus:border-green/50 focus:outline-none"
        />
      </div>
    </td>
  );
}
