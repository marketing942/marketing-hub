"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Error boundary das telas do app. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-critical/30 bg-card p-10 text-center">
      <span className="rounded-xl bg-critical/10 p-3">
        <AlertTriangle className="h-6 w-6 text-critical" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-text">Algo deu errado</h2>
      <p className="mt-1 max-w-md text-sm text-text-muted">
        Não foi possível carregar esta tela. Tente novamente — se persistir,
        verifique as variáveis de ambiente do Supabase e a conexão.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-text-muted/60">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-5">
        <Button onClick={reset} size="sm">
          <RotateCcw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
