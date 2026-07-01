"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plug, RefreshCw, CheckCircle2, XCircle, MinusCircle, Loader2 } from "lucide-react";
import type { IntegrationView } from "@/lib/integrations/queries";
import { testIntegration, syncNow } from "@/lib/integrations/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_UI = {
  connected: { label: "Conectado", cls: "text-good", Icon: CheckCircle2 },
  error: { label: "Erro", cls: "text-critical", Icon: XCircle },
  disconnected: { label: "Desconectado", cls: "text-text-muted", Icon: MinusCircle },
} as const;

export function IntegrationStatusCard({ data }: { data: IntegrationView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"test" | "sync" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const s = STATUS_UI[data.status];

  function test() {
    setMsg(null);
    setAction("test");
    startTransition(async () => {
      const r = await testIntegration(data.id);
      setMsg({ ok: r.ok, text: r.message });
      setAction(null);
      router.refresh();
    });
  }

  function sync() {
    setMsg(null);
    setAction("sync");
    startTransition(async () => {
      const r = await syncNow(data.id);
      setMsg({ ok: r.ok, text: r.message });
      setAction(null);
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green/10 text-green-neon">
            <Plug className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-text">{data.label}</p>
            <span className={cn("inline-flex items-center gap-1 text-xs", s.cls)}>
              <s.Icon className="h-3.5 w-3.5" />
              {s.label}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={test} disabled={pending}>
            {pending && action === "test" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Testar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={sync}
            disabled={pending || !data.configured}
            title={!data.configured ? "Configure os tokens primeiro" : "Sincronizar agora"}
          >
            {pending && action === "sync" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-text-muted">{data.description}</p>

      {/* Env vars mascaradas */}
      <div className="mt-4 space-y-1.5">
        {data.env.map((e) => (
          <div key={e.key} className="flex items-center justify-between text-xs">
            <span className="font-mono text-text-muted">{e.key}</span>
            {e.set ? (
              <span className="font-mono text-text">{e.masked}</span>
            ) : (
              <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
                não definido
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Contas mapeadas */}
      <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-3 text-xs">
        <span className="text-text-muted">
          {data.accounts.length > 0
            ? `${data.accounts.length} conta(s) mapeada(s) · ${data.accountLabel}`
            : `Nenhuma conta mapeada (${data.accountLabel})`}
        </span>
        <span className="text-text-muted">
          {data.lastSyncedAt
            ? `Sync há ${formatDistanceToNowStrict(new Date(data.lastSyncedAt), { locale: ptBR })}`
            : "Nunca sincronizado"}
        </span>
      </div>

      {(msg || data.lastError) && (
        <p
          className={cn(
            "mt-3 rounded-lg px-3 py-2 text-xs",
            msg
              ? msg.ok
                ? "bg-good/10 text-good"
                : "bg-critical/10 text-critical"
              : "bg-critical/10 text-critical",
          )}
        >
          {msg ? msg.text : data.lastError}
        </p>
      )}
    </Card>
  );
}
