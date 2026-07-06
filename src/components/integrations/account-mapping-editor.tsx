"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import type { Company } from "@/lib/types";
import type { ProviderId } from "@/lib/integrations/types";
import { saveAccountMapping } from "@/lib/integrations/actions";
import { Button } from "@/components/ui/button";

export function AccountMappingEditor({
  provider,
  accountLabel,
  companies,
  current,
}: {
  provider: ProviderId;
  accountLabel: string;
  companies: Company[];
  /** Mapeamento atual { [companyId]: externalAccountId }. */
  current: Record<string, string>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(companies.map((c) => [c.id, current[c.id] ?? ""])),
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function save() {
    setMsg(null);
    startTransition(async () => {
      // Salva apenas as empresas cujo valor mudou.
      const changed = companies.filter(
        (c) => (draft[c.id] ?? "") !== (current[c.id] ?? ""),
      );
      if (changed.length === 0) {
        setMsg({ ok: true, text: "Nada para salvar." });
        return;
      }
      const results = await Promise.all(
        changed.map((c) =>
          saveAccountMapping({
            provider,
            companyId: c.id,
            externalAccountId: draft[c.id] ?? "",
            accountName: c.name,
          }),
        ),
      );
      const failed = results.find((r) => !r.ok);
      setMsg(
        failed
          ? { ok: false, text: failed.message }
          : { ok: true, text: "Contas salvas." },
      );
      router.refresh();
    });
  }

  return (
    <div className="mt-4 border-t border-border-soft pt-4">
      <p className="mb-2 text-xs font-medium text-text">
        Contas por empresa
        <span className="ml-1 font-normal text-text-muted">({accountLabel})</span>
      </p>
      <div className="space-y-2">
        {companies.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
              style={{ backgroundColor: `${c.brandColor}22`, color: c.brandColor }}
              title={c.name}
            >
              {c.initials}
            </span>
            <input
              value={draft[c.id] ?? ""}
              onChange={(e) => {
                setDraft((d) => ({ ...d, [c.id]: e.target.value }));
                setMsg(null);
              }}
              placeholder={accountLabel}
              className="w-full rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 font-mono text-xs text-text placeholder:text-text-muted/50 focus:border-green/50 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Salvar contas
        </Button>
        {msg && (
          <span className={msg.ok ? "text-xs text-good" : "text-xs text-critical"}>
            {msg.text}
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] text-text-muted">
        Deixe em branco para remover o mapeamento. Ex.: Meta usa <code>act_1234567890</code>;
        Google usa o Customer ID; GA4 usa o Property ID.
      </p>
    </div>
  );
}
