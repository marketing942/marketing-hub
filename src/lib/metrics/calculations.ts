/**
 * Fórmulas de marketing. Todas retornam `null` quando não há dados suficientes
 * (divisão por zero / valores ausentes) para evitar NaN/Infinity na UI.
 */

function safeDiv(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

/** CPL = spend / paid_leads */
export function cpl(spend: number | null, paidLeads: number | null) {
  return safeDiv(spend, paidLeads);
}

/** CTR = clicks / impressions * 100 */
export function ctr(clicks: number | null, impressions: number | null) {
  const r = safeDiv(clicks, impressions);
  return r == null ? null : r * 100;
}

/** CPC = spend / clicks */
export function cpc(spend: number | null, clicks: number | null) {
  return safeDiv(spend, clicks);
}

/** CPM = spend / impressions * 1000 */
export function cpm(spend: number | null, impressions: number | null) {
  const r = safeDiv(spend, impressions);
  return r == null ? null : r * 1000;
}

/** ROI = revenue / spend */
export function roi(revenue: number | null, spend: number | null) {
  return safeDiv(revenue, spend);
}

/** Total de leads = pagos + orgânicos */
export function totalLeads(paid: number | null, organic: number | null) {
  if (paid == null && organic == null) return null;
  return (paid ?? 0) + (organic ?? 0);
}

/** Taxa de conversão de lead = conversions / leads * 100 */
export function conversionRate(conversions: number | null, leads: number | null) {
  const r = safeDiv(conversions, leads);
  return r == null ? null : r * 100;
}

/** Variação percentual em relação ao valor anterior. */
export function pctChange(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
