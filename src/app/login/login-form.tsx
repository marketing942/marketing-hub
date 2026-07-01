"use client";

import { useActionState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { signIn, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

const initial: AuthState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initial);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green/15 text-green-neon">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-text">CPPEM Marketing Hub</p>
          <p className="text-xs text-text-muted">Acesso restrito</p>
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-text-muted">E-mail</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="voce@cppem.com.br"
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:border-green/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Senha</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:border-green/50 focus:outline-none"
          />
        </div>

        {state.error && (
          <p className="rounded-lg border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
