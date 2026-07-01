import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <h2 className="text-xl font-semibold text-text">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Placeholder de etapa futura — deixa claro o que virá, sem dado fake. */
export function StagePlaceholder({ stage }: { stage: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
      <p className="text-sm font-medium text-text">Em construção</p>
      <p className="mt-1 max-w-md text-xs text-text-muted">
        Esta tela será implementada na {stage}. A estrutura de rota e navegação
        já está pronta.
      </p>
    </div>
  );
}
