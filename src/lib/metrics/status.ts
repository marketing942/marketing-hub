import type { Goal, MetricStatus } from "@/lib/types";

export interface AttainmentResult {
  /** Percentual de atingimento (0–100+, ou null se indefinido). */
  pct: number | null;
  status: MetricStatus;
}

/**
 * Calcula atingimento e status de uma métrica frente à sua meta.
 *
 * - direction "higher" (leads, ROI, CTR): compara valor contra a META.
 *   pct = valor / meta * 100. Quanto maior, melhor.
 * - direction "lower" (CPL, custo/teto): compara valor contra o TETO.
 *   pct = valor / teto * 100. Ficar abaixo do teto é bom.
 *
 * Status:
 * - warning/critical podem ser definidos explicitamente na meta; caso
 *   contrário caímos em limiares padrão razoáveis.
 */
export function computeAttainment(
  value: number | null,
  goal: Goal | null | undefined,
): AttainmentResult {
  if (value == null || goal == null || goal.target == null || goal.target === 0) {
    return { pct: null, status: "unknown" };
  }

  const pct = (value / goal.target) * 100;

  if (goal.direction === "lower") {
    // menor é melhor (teto). Ex.: CPL, custo de tráfego.
    const critical = goal.critical ?? goal.target; // >= teto = crítico
    const warning = goal.warning ?? goal.target * 0.85; // perto do teto = atenção
    let status: MetricStatus = "good";
    if (value >= critical) status = "critical";
    else if (value >= warning) status = "warning";
    return { pct, status };
  }

  // maior é melhor (meta). Ex.: leads, ROI, CTR.
  const critical = goal.critical ?? goal.target * 0.6; // muito abaixo = crítico
  const warning = goal.warning ?? goal.target * 0.85; // abaixo da meta = atenção
  let status: MetricStatus = "good";
  if (value < critical) status = "critical";
  else if (value < warning) status = "warning";
  return { pct, status };
}

export const STATUS_LABEL: Record<MetricStatus, string> = {
  good: "Dentro da meta",
  warning: "Atenção",
  critical: "Crítico",
  unknown: "Sem meta",
};

/** Classes de cor por status (usadas em badges/barras). */
export const STATUS_COLOR: Record<
  MetricStatus,
  { text: string; bg: string; ring: string; dot: string }
> = {
  good: {
    text: "text-good",
    bg: "bg-good/10",
    ring: "ring-good/30",
    dot: "bg-good",
  },
  warning: {
    text: "text-warning",
    bg: "bg-warning/10",
    ring: "ring-warning/30",
    dot: "bg-warning",
  },
  critical: {
    text: "text-critical",
    bg: "bg-critical/10",
    ring: "ring-critical/30",
    dot: "bg-critical",
  },
  unknown: {
    text: "text-text-muted",
    bg: "bg-border/40",
    ring: "ring-border",
    dot: "bg-text-muted",
  },
};
