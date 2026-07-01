import type {
  CompanySlug,
  Goal,
  MetricFormat,
  MetricKey,
  MetricSource,
} from "./types";

/**
 * DADOS DE DEMONSTRAÇÃO — usados APENAS para prévia visual da Etapa 1.
 * Tudo aqui é marcado como `demo: true`. Nas etapas seguintes, o dashboard
 * lê do Supabase e mostra empty state quando não houver dados reais.
 */

export interface DemoMetric {
  key: MetricKey;
  label: string;
  value: number;
  previous: number;
  format: MetricFormat;
  source: MetricSource;
  category: "paid" | "organic" | "leads";
  updatedMinAgo: number;
}

export interface DemoCompanyData {
  metrics: DemoMetric[];
  goals: Partial<Record<MetricKey, Goal>>;
}

const g = (
  direction: Goal["direction"],
  target: number,
  metricKey: MetricKey,
): Goal => ({ metricKey, direction, target });

export const DEMO_DATA: Record<CompanySlug, DemoCompanyData> = {
  "cppem-concursos": {
    goals: {
      cpl: g("lower", 10, "cpl"),
      traffic_cost: g("lower", 500, "traffic_cost"),
      ctr: g("higher", 2, "ctr"),
      roi: g("higher", 3, "roi"),
      paid_leads: g("higher", 40, "paid_leads"),
      organic_leads: g("higher", 25, "organic_leads"),
      total_leads: g("higher", 65, "total_leads"),
    },
    metrics: [
      { key: "cpl", label: "CPL", value: 8.43, previous: 9.12, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 3 },
      { key: "traffic_cost", label: "Custo de Tráfego", value: 412.5, previous: 388.0, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 3 },
      { key: "ctr", label: "CTR", value: 2.34, previous: 2.1, format: "percent", source: "meta_ads", category: "paid", updatedMinAgo: 3 },
      { key: "roi", label: "ROI", value: 3.4, previous: 3.1, format: "decimal", source: "manual", category: "paid", updatedMinAgo: 60 },
      { key: "cpc", label: "CPC", value: 1.12, previous: 1.2, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 3 },
      { key: "cpm", label: "CPM", value: 18.4, previous: 19.9, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 3 },
      { key: "paid_leads", label: "Leads Pagos", value: 49, previous: 42, format: "integer", source: "meta_ads", category: "leads", updatedMinAgo: 3 },
      { key: "organic_leads", label: "Leads Orgânicos", value: 28, previous: 30, format: "integer", source: "manual", category: "leads", updatedMinAgo: 45 },
      { key: "total_leads", label: "Leads Totais", value: 77, previous: 72, format: "integer", source: "supabase", category: "leads", updatedMinAgo: 3 },
      { key: "instagram_followers", label: "Seguidores IG", value: 48230, previous: 48100, format: "integer", source: "instagram", category: "organic", updatedMinAgo: 55 },
    ],
  },
  unicive: {
    goals: {
      cpl: g("lower", 12, "cpl"),
      traffic_cost: g("lower", 600, "traffic_cost"),
      ctr: g("higher", 1.8, "ctr"),
      roi: g("higher", 2.5, "roi"),
      paid_leads: g("higher", 35, "paid_leads"),
      organic_leads: g("higher", 20, "organic_leads"),
      total_leads: g("higher", 55, "total_leads"),
    },
    metrics: [
      { key: "cpl", label: "CPL", value: 13.7, previous: 12.4, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 5 },
      { key: "traffic_cost", label: "Custo de Tráfego", value: 585.0, previous: 540.0, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 5 },
      { key: "ctr", label: "CTR", value: 1.62, previous: 1.75, format: "percent", source: "meta_ads", category: "paid", updatedMinAgo: 5 },
      { key: "roi", label: "ROI", value: 2.2, previous: 2.6, format: "decimal", source: "manual", category: "paid", updatedMinAgo: 90 },
      { key: "cpc", label: "CPC", value: 1.55, previous: 1.4, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 5 },
      { key: "cpm", label: "CPM", value: 24.1, previous: 22.0, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 5 },
      { key: "paid_leads", label: "Leads Pagos", value: 33, previous: 38, format: "integer", source: "meta_ads", category: "leads", updatedMinAgo: 5 },
      { key: "organic_leads", label: "Leads Orgânicos", value: 21, previous: 19, format: "integer", source: "manual", category: "leads", updatedMinAgo: 30 },
      { key: "total_leads", label: "Leads Totais", value: 54, previous: 57, format: "integer", source: "supabase", category: "leads", updatedMinAgo: 5 },
      { key: "instagram_followers", label: "Seguidores IG", value: 21540, previous: 21490, format: "integer", source: "instagram", category: "organic", updatedMinAgo: 70 },
    ],
  },
  "colegio-cppem": {
    goals: {
      cpl: g("lower", 15, "cpl"),
      traffic_cost: g("lower", 400, "traffic_cost"),
      ctr: g("higher", 2, "ctr"),
      roi: g("higher", 3, "roi"),
      paid_leads: g("higher", 25, "paid_leads"),
      organic_leads: g("higher", 15, "organic_leads"),
      total_leads: g("higher", 40, "total_leads"),
    },
    metrics: [
      { key: "cpl", label: "CPL", value: 11.2, previous: 10.5, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 8 },
      { key: "traffic_cost", label: "Custo de Tráfego", value: 320.0, previous: 300.0, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 8 },
      { key: "ctr", label: "CTR", value: 2.05, previous: 1.9, format: "percent", source: "meta_ads", category: "paid", updatedMinAgo: 8 },
      { key: "roi", label: "ROI", value: 3.1, previous: 2.9, format: "decimal", source: "manual", category: "paid", updatedMinAgo: 120 },
      { key: "cpc", label: "CPC", value: 0.98, previous: 1.05, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 8 },
      { key: "cpm", label: "CPM", value: 16.2, previous: 17.1, format: "currency", source: "meta_ads", category: "paid", updatedMinAgo: 8 },
      { key: "paid_leads", label: "Leads Pagos", value: 29, previous: 24, format: "integer", source: "meta_ads", category: "leads", updatedMinAgo: 8 },
      { key: "organic_leads", label: "Leads Orgânicos", value: 16, previous: 14, format: "integer", source: "manual", category: "leads", updatedMinAgo: 40 },
      { key: "total_leads", label: "Leads Totais", value: 45, previous: 38, format: "integer", source: "supabase", category: "leads", updatedMinAgo: 8 },
      { key: "instagram_followers", label: "Seguidores IG", value: 12870, previous: 12820, format: "integer", source: "instagram", category: "organic", updatedMinAgo: 65 },
    ],
  },
};
