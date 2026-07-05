import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AlertSeverity, AlertStatus } from "@/lib/types";

export interface AlertItem {
  id: string;
  companyId: string;
  metricKey: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string | null;
  recommendation: string | null;
  detectedAt: string;
  resolvedAt: string | null;
  auto: boolean;
}

interface Row {
  id: string;
  company_id: string;
  metric_key: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string | null;
  recommendation: string | null;
  detected_at: string;
  resolved_at: string | null;
  metadata: { auto?: boolean } | null;
}

/** Alertas visíveis (RLS por empresa), mais recentes primeiro. */
export async function fetchAlerts(limit = 200): Promise<AlertItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketing_alerts")
    .select(
      "id, company_id, metric_key, severity, status, title, description, recommendation, detected_at, resolved_at, metadata",
    )
    .order("detected_at", { ascending: false })
    .limit(limit);

  return (data as Row[] | null ?? []).map((r) => ({
    id: r.id,
    companyId: r.company_id,
    metricKey: r.metric_key,
    severity: r.severity,
    status: r.status,
    title: r.title,
    description: r.description,
    recommendation: r.recommendation,
    detectedAt: r.detected_at,
    resolvedAt: r.resolved_at,
    auto: r.metadata?.auto === true,
  }));
}
