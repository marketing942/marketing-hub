/** Carregamento em tela cheia do Modo TV. */
export default function TVLoading() {
  return (
    <div className="flex h-screen w-screen flex-col bg-bg px-8 py-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-2xl bg-card-alt" />
        <div className="space-y-2">
          <div className="h-7 w-64 animate-pulse rounded bg-card-alt" />
          <div className="h-4 w-40 animate-pulse rounded bg-card-alt/70" />
        </div>
      </div>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-card-alt" />
      <div className="flex flex-1 items-center">
        <div className="grid w-full grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
