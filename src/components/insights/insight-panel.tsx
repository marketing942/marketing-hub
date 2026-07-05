import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import type { CompanyMetrics } from "@/lib/metrics/types";
import { buildInsights, type InsightTone } from "@/lib/insights/build";
import { cn } from "@/lib/utils";

const TONE: Record<
  InsightTone,
  { icon: typeof Sparkles; text: string; bg: string }
> = {
  positive: { icon: TrendingUp, text: "text-good", bg: "bg-good/10" },
  attention: { icon: AlertTriangle, text: "text-warning", bg: "bg-warning/10" },
  negative: { icon: TrendingDown, text: "text-critical", bg: "bg-critical/10" },
  neutral: { icon: Sparkles, text: "text-text-muted", bg: "bg-border/30" },
};

/** Painel "Insights do Dia" — leitura server-side dos dados já carregados. */
export function InsightPanel({ data }: { data: CompanyMetrics[] }) {
  const insights = buildInsights(data);
  if (insights.length === 0) return null;

  return (
    <section className="mb-8 rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-green-neon" />
        <h3 className="text-sm font-semibold text-text">Insights do Dia</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((it, i) => {
          const tone = TONE[it.tone];
          const Icon = tone.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border-soft bg-bg-elevated p-3"
            >
              <span className={cn("mt-0.5 rounded-md p-1.5", tone.bg)}>
                <Icon className={cn("h-4 w-4", tone.text)} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{it.title}</p>
                <p className="mt-0.5 text-xs text-text-muted">{it.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
