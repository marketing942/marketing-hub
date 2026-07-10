import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADAPTERS } from "./adapters";
import type { ProviderId } from "./types";

/** metric_key -> coluna em marketing_metrics_daily. */
const DAILY_COLUMN: Record<string, string> = {
  spend: "spend",
  traffic_cost: "spend",
  cpl: "cpl",
  ctr: "ctr",
  cpc: "cpc",
  cpm: "cpm",
  roi: "roi",
  conversions: "conversions",
  paid_leads: "paid_leads",
  organic_leads: "organic_leads",
  total_leads: "total_leads",
  instagram_followers: "instagram_followers",
  link_clicks: "link_clicks",
  posts_count: "posts_count",
  stories_count: "stories_count",
  reels_count: "reels_count",
  reach: "reach",
  impressions: "impressions",
  engagement: "engagement",
};

export interface SyncSummary {
  provider: ProviderId;
  jobId: string | null;
  status: "success" | "error";
  recordsProcessed: number;
  message: string;
}

/** Executa a sincronização de um provedor. Honesto: se não configurado, falha com mensagem clara. */
export async function runProviderSync(
  provider: ProviderId,
  opts: { companySlug?: string } = {},
): Promise<SyncSummary> {
  const admin = createAdminClient();
  const adapter = ADAPTERS[provider];

  // Cria job
  const { data: job } = await admin
    .from("sync_jobs")
    .insert({ provider, status: "running", started_at: new Date().toISOString() })
    .select("id")
    .single();
  const jobId = job?.id ?? null;

  const log = async (level: string, message: string) => {
    if (jobId) await admin.from("sync_logs").insert({ sync_job_id: jobId, level, message });
  };

  const finish = async (
    status: "success" | "error",
    records: number,
    message: string,
  ): Promise<SyncSummary> => {
    if (jobId) {
      await admin
        .from("sync_jobs")
        .update({
          status,
          finished_at: new Date().toISOString(),
          records_processed: records,
          error_message: status === "error" ? message : null,
        })
        .eq("id", jobId);
    }
    await admin
      .from("marketing_integrations")
      .update({
        status: status === "success" ? "connected" : "error",
        last_synced_at: status === "success" ? new Date().toISOString() : undefined,
        last_error: status === "error" ? message : null,
      })
      .eq("provider", provider);
    return { provider, jobId, status, recordsProcessed: records, message };
  };

  // Não configurado → falha honesta
  if (!adapter.isConfigured()) {
    const msg = `Integração não configurada. Faltando: ${adapter.missingEnv().join(", ")}`;
    await log("error", msg);
    return finish("error", 0, msg);
  }

  // Contas mapeadas por empresa
  let query = admin
    .from("marketing_integration_accounts")
    .select("company_id, external_account_id, active, companies!inner(slug)")
    .eq("provider", provider)
    .eq("active", true);
  if (opts.companySlug) query = query.eq("companies.slug", opts.companySlug);

  const { data: accounts } = await query;

  if (!accounts || accounts.length === 0) {
    const msg = "Nenhuma conta mapeada por empresa para este provedor (marketing_integration_accounts).";
    await log("warn", msg);
    return finish("error", 0, msg);
  }

  let records = 0; // total de valores (não-nulos) efetivamente gravados
  let okAccounts = 0; // contas que responderam sem erro
  const errors: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const acc of accounts) {
    try {
      const rows = await adapter.syncAccount(acc.external_account_id);
      const patch: Record<string, unknown> = {
        company_id: acc.company_id,
        metric_date: today,
      };
      let written = 0;
      for (const r of rows) {
        const col = DAILY_COLUMN[r.metricKey];
        if (col && r.value != null) {
          patch[col] = r.value;
          written++;
        }
      }
      const { error } = await admin
        .from("marketing_metrics_daily")
        .upsert(patch, { onConflict: "company_id,metric_date" });
      if (error) throw new Error(error.message);
      records += written;
      okAccounts++;
      await log(
        "info",
        `Empresa ${acc.company_id}: ${written} métricas com valor (de ${rows.length}).`,
      );
    } catch (e) {
      errors.push((e as Error).message);
      await log("error", `Empresa ${acc.company_id}: ${(e as Error).message}`);
    }
  }

  // Status honesto: se NENHUMA conta respondeu, é erro (mostra a causa no card).
  if (okAccounts === 0) {
    const cause = errors[0] ?? "Nenhuma conta retornou dados.";
    return finish(
      "error",
      0,
      `Falha em todas as ${accounts.length} conta(s). Causa: ${cause}`,
    );
  }

  // Sucesso parcial: algumas contas falharam.
  if (errors.length > 0) {
    return finish(
      "success",
      records,
      `Parcial: ${okAccounts}/${accounts.length} conta(s) OK, ${records} métricas. ` +
        `Falha em ${errors.length}: ${errors[0]}`,
    );
  }

  // Tudo ok — mas pode não haver gasto/veiculação hoje (records = 0 é legítimo).
  const note =
    records === 0
      ? " — nenhum dado para hoje ainda (sem veiculação/gasto no período)."
      : "";
  return finish("success", records, `Sincronização concluída (${records} métricas)${note}.`);
}

/** Sincroniza todos os provedores. */
export async function runAllSync(companySlug?: string): Promise<SyncSummary[]> {
  const providers: ProviderId[] = ["meta_ads", "google_ads", "instagram", "ga4"];
  const out: SyncSummary[] = [];
  for (const p of providers) out.push(await runProviderSync(p, { companySlug }));
  return out;
}
