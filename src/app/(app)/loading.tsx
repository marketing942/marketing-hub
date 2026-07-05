/** Skeleton de carregamento para as telas do app (App Router). */
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Cabeçalho */}
      <div className="mb-6 space-y-2">
        <div className="h-6 w-48 rounded-md bg-card-alt" />
        <div className="h-4 w-80 max-w-full rounded bg-card-alt/70" />
      </div>

      {/* Linha de filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-32 rounded-lg bg-card-alt" />
        ))}
      </div>

      {/* Grade de cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
