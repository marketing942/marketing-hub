import type { MetricCategory, MetricFormat } from "@/lib/types";

export interface CardDef {
  key: string;
  label: string;
  format: MetricFormat;
  category: MetricCategory;
  /** true = maior é melhor (leads, ROI, CTR); false = menor é melhor (CPL, custo). */
  higherIsBetter: boolean;
  /** Aparece no modo TV por padrão. */
  tv?: boolean;
}

export const CARD_CATALOG: CardDef[] = [
  { key: "cpl", label: "CPL", format: "currency", category: "paid", higherIsBetter: false, tv: true },
  { key: "traffic_cost", label: "Custo de Tráfego", format: "currency", category: "paid", higherIsBetter: false, tv: true },
  { key: "ctr", label: "CTR", format: "percent", category: "paid", higherIsBetter: true, tv: true },
  { key: "roi", label: "ROI", format: "decimal", category: "paid", higherIsBetter: true, tv: true },
  { key: "cpc", label: "CPC", format: "currency", category: "paid", higherIsBetter: false },
  { key: "cpm", label: "CPM", format: "currency", category: "paid", higherIsBetter: false },
  { key: "conversions", label: "Conversões", format: "integer", category: "paid", higherIsBetter: true },
  { key: "spend", label: "Investimento Diário", format: "currency", category: "paid", higherIsBetter: false },
  { key: "paid_leads", label: "Leads Pagos", format: "integer", category: "leads", higherIsBetter: true, tv: true },
  { key: "organic_leads", label: "Leads Orgânicos", format: "integer", category: "leads", higherIsBetter: true, tv: true },
  { key: "total_leads", label: "Leads Totais", format: "integer", category: "leads", higherIsBetter: true, tv: true },
  { key: "instagram_followers", label: "Seguidores IG", format: "integer", category: "organic", higherIsBetter: true, tv: true },
  { key: "new_followers", label: "Novos Seguidores", format: "integer", category: "organic", higherIsBetter: true },
  { key: "link_clicks", label: "Cliques na Bio", format: "integer", category: "organic", higherIsBetter: true },
  { key: "posts_count", label: "Posts Publicados", format: "integer", category: "organic", higherIsBetter: true },
  { key: "stories_count", label: "Stories Publicados", format: "integer", category: "organic", higherIsBetter: true },
  { key: "reels_count", label: "Reels Publicados", format: "integer", category: "organic", higherIsBetter: true },
  { key: "reach", label: "Alcance", format: "integer", category: "organic", higherIsBetter: true },
  { key: "impressions", label: "Impressões", format: "integer", category: "organic", higherIsBetter: true },
  { key: "engagement", label: "Engajamento", format: "integer", category: "organic", higherIsBetter: true },
];

export const CARD_BY_KEY = Object.fromEntries(
  CARD_CATALOG.map((c) => [c.key, c]),
) as Record<string, CardDef>;

export const TV_CARD_KEYS = CARD_CATALOG.filter((c) => c.tv).map((c) => c.key);
