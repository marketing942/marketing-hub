import type { MetricFormat, MetricSource } from "@/lib/types";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const NUM = new Intl.NumberFormat("pt-BR");
const NUM2 = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata um valor conforme o formato do card. Trata null como travessão. */
export function formatMetric(
  value: number | null | undefined,
  format: MetricFormat,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  switch (format) {
    case "currency":
      return BRL.format(value);
    case "percent":
      return `${NUM2.format(value)}%`;
    case "decimal":
      return NUM2.format(value);
    case "integer":
      return NUM.format(Math.round(value));
    case "number":
    default:
      return NUM.format(value);
  }
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${NUM.format(Math.round(value))}%`;
}

export function formatSignedPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${NUM2.format(value)}%`;
}

export const SOURCE_LABEL: Record<MetricSource, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  instagram: "Instagram",
  ga4: "GA4",
  manual: "Manual",
  supabase: "Supabase",
};
