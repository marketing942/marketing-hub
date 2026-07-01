import type { Company, Goal, MetricSource } from "@/lib/types";

export interface MetricPoint {
  value: number | null;
  previous: number | null;
  source: MetricSource;
  updatedAt: string | null;
}

export interface CompanyMetrics {
  company: Company;
  values: Record<string, MetricPoint>;
  goals: Record<string, Goal>;
  hasData: boolean;
  metricDate: string | null;
}
