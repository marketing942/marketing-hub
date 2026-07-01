"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import type { Company } from "@/lib/types";
import { CARD_CATALOG } from "@/lib/metrics/catalog";
import { saveManualEntry } from "@/lib/manual/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ManualMetricForm({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [metricKey, setMetricKey] = useState(CARD_CATALOG[0].key);
  const [date, setDate] = useState(todayISO());
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await saveManualEntry({
        companyId,
        metricKey,
        metricDate: date,
        value: value.trim() === "" ? null : Number(value),
        notes,
      });
      if (res.ok) {
        setMsg({ ok: true, text: "Lançamento salvo." });
        setValue("");
        setNotes("");
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error ?? "Erro ao salvar." });
      }
    });
  }

  const selectCls =
    "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-green/50 focus:outline-none";

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-text-muted">Empresa</label>
            <select className={selectCls} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Métrica</label>
            <select className={selectCls} value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
              {CARD_CATALOG.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Data</label>
            <input type="date" className={selectCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Valor</label>
            <input
              type="number"
              step="any"
              className={selectCls}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ex.: 12"
              required
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Observação (opcional)</label>
          <textarea
            className={selectCls}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Motivo ou contexto do lançamento"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Salvando..." : "Salvar lançamento"}
          </Button>
          {msg && (
            <span className={`inline-flex items-center gap-1 text-xs ${msg.ok ? "text-good" : "text-critical"}`}>
              {msg.ok && <Check className="h-3.5 w-3.5" />}
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
