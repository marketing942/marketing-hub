/** Tipos compartilhados das integrações (client-safe). */

export type ProviderId = "meta_ads" | "google_ads" | "instagram" | "ga4";

export type ConnectionStatus = "connected" | "disconnected" | "error";

export interface TestResult {
  ok: boolean;
  status: ConnectionStatus;
  message: string;
}

/** Linha de métrica produzida por um sync (mapeia para marketing_metrics_daily). */
export interface SyncMetricRow {
  metricKey: string;
  value: number | null;
}

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** Variáveis de ambiente necessárias (para exibir mascaradas e checar config). */
  envKeys: string[];
  /** Descrição curta do que a integração puxa. */
  description: string;
  /** Nome do identificador de conta por empresa (ex.: Ad Account, Customer ID). */
  accountLabel: string;
}
