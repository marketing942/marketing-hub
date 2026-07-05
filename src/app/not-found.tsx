import Link from "next/link";
import { Compass } from "lucide-react";

/** 404 global. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-10 text-center">
      <span className="rounded-2xl bg-green/10 p-4">
        <Compass className="h-8 w-8 text-green-neon" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-text">Página não encontrada</h1>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        A rota que você tentou acessar não existe ou foi movida.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg border border-green/40 bg-green/10 px-4 py-2 text-sm font-medium text-green-neon transition-colors hover:bg-green/20"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
