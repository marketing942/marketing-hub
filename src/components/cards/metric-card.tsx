import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal, MetricFormat, MetricSource } from "@/lib/types";
import { computeAttainment, STATUS_COLOR, STATUS_LABEL } from "@/lib/metrics/status";
import {
  formatMetric,
  formatPct,
  formatSignedPct,
  SOURCE_LABEL,
} from "@/lib/metrics/formatting";
import { pctChange } from "@/lib/metrics/calculations";
import { UpdatedAgo } from "./updated-ago";

export interface MetricCardProps {
  label: string;
  value: number | null;
  previous?: number | null;
  format: MetricFormat;
  source: MetricSource;
  goal?: Goal | null;
  updatedAt?: string | null;
  /** true quando maior valor de variação é bom (leads) vs custo (ruim). */
  higherIsBetter?: boolean;
  size?: "md" | "lg";
  className?: string;
}

export function MetricCard({
  label,
  value,
  previous,
  format,
  source,
  goal,
  updatedAt,
  higherIsBetter = true,
  size = "md",
  className,
}: MetricCardProps) {
  const { pct, status } = computeAttainment(value, goal);
  const colors = STATUS_COLOR[status];
  const change = pctChange(value, previous ?? null);

  const changeGood =
    change == null ? null : higherIsBetter ? change >= 0 : change <= 0;

  const isLg = size === "lg";

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border border-border bg-card p-4",
        "transition-colors hover:border-green/30",
        isLg && "p-6",
        className,
      )}
    >
      {/* faixa de status à esquerda */}
      <span
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-full",
          colors.dot,
        )}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-2 pl-2">
        <p
          className={cn(
            "font-medium text-text-muted",
            isLg ? "text-sm" : "text-xs",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
            colors.bg,
            colors.text,
            colors.ring,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="pl-2">
        <p
          className={cn(
            "mt-2 font-semibold tracking-tight text-text",
            isLg ? "text-4xl" : "text-2xl",
          )}
        >
          {formatMetric(value, format)}
        </p>

        <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
          {goal?.target != null && (
            <span>
              {goal.direction === "lower" ? "Teto" : "Meta"}:{" "}
              {formatMetric(goal.target, format)}
            </span>
          )}
          {pct != null && (
            <span className={colors.text}>
              · {formatPct(pct)}{" "}
              {goal?.direction === "lower" ? "do teto" : "da meta"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border-soft pl-2 pt-2 text-[11px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          {change == null ? (
            <Minus className="h-3 w-3" />
          ) : changeGood ? (
            <ArrowUpRight
              className={cn(
                "h-3 w-3",
                higherIsBetter ? "text-good" : "text-critical rotate-90",
              )}
            />
          ) : (
            <ArrowDownRight
              className={cn(
                "h-3 w-3",
                higherIsBetter ? "text-critical" : "text-good",
              )}
            />
          )}
          <span
            className={cn(
              change == null
                ? ""
                : changeGood
                  ? "text-good"
                  : "text-critical",
            )}
          >
            {formatSignedPct(change)}
          </span>
          <span className="text-text-muted/70">vs ontem</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded bg-card-alt px-1.5 py-0.5 text-[10px]">
            {SOURCE_LABEL[source]}
          </span>
          <UpdatedAgo updatedAt={updatedAt} />
        </span>
      </div>
    </div>
  );
}
