/**
 * Tipos de domínio do CPPEM Marketing Hub.
 * Reaproveitados por dashboard, TV, builder, integrações e sync.
 */

/** Empresas suportadas. NUNCA incluir "Grupo Mota". */
export type CompanySlug = "cppem-concursos" | "unicive" | "colegio-cppem";

export interface Company {
  id: string;
  slug: CompanySlug;
  name: string;
  shortName: string;
  initials: string;
  status: "active" | "inactive";
  brandColor: string;
  logoUrl?: string | null;
}

/** Fontes possíveis de um dado. */
export type MetricSource =
  | "meta_ads"
  | "google_ads"
  | "instagram"
  | "ga4"
  | "manual"
  | "supabase";

/** Chaves de métrica conhecidas (metric_key). */
export type MetricKey =
  | "cpl"
  | "traffic_cost"
  | "ctr"
  | "roi"
  | "cpc"
  | "cpm"
  | "conversions"
  | "conversion_rate"
  | "paid_leads"
  | "organic_leads"
  | "total_leads"
  | "spend"
  | "instagram_followers"
  | "new_followers"
  | "link_clicks"
  | "posts_count"
  | "stories_count"
  | "reels_count"
  | "reach"
  | "impressions"
  | "engagement"
  | "engagement_rate";

/** Direção da meta: "higher" = maior é melhor; "lower" = menor é melhor (teto). */
export type GoalDirection = "higher" | "lower";

/** Categoria do card. */
export type MetricCategory = "paid" | "organic" | "leads" | "custom";

/** Como o card é formatado na UI. */
export type MetricFormat =
  | "currency"
  | "number"
  | "percent"
  | "decimal"
  | "integer";

/** Status calculado de uma métrica frente à meta. */
export type MetricStatus = "good" | "warning" | "critical" | "unknown";

export interface MetricValue {
  key: MetricKey | string;
  value: number | null;
  source: MetricSource;
  measuredAt?: string | null;
  updatedAt?: string | null;
  /** Marca dados de demonstração (fallback de dev). Nunca exibir como real. */
  demo?: boolean;
}

export interface Goal {
  metricKey: MetricKey | string;
  direction: GoalDirection;
  target: number | null; // meta (higher) ou teto (lower)
  warning?: number | null;
  critical?: number | null;
}

/** Severidade de alertas. */
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "open" | "reviewing" | "resolved" | "ignored";

/** Perfis de acesso. */
export type UserRole =
  | "admin"
  | "coordinator"
  | "paid_traffic"
  | "social_media"
  | "viewer";
