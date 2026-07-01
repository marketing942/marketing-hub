import "server-only";
import type { ProviderId, SyncMetricRow, TestResult } from "./types";

/** Um adaptador sabe se está configurado, testar conexão e sincronizar uma conta. */
export interface ProviderAdapter {
  id: ProviderId;
  isConfigured(): boolean;
  /** Quais env vars estão presentes (para diagnóstico, sem revelar valores). */
  missingEnv(): string[];
  testConnection(): Promise<TestResult>;
  /** Sincroniza uma conta de empresa. Retorna métricas do dia. */
  syncAccount(externalAccountId: string): Promise<SyncMetricRow[]>;
}

function env(key: string) {
  const v = process.env[key];
  return v && v.trim() !== "" ? v.trim() : null;
}

function missing(keys: string[]) {
  return keys.filter((k) => !env(k));
}

const notConfigured = (label: string, keys: string[]): TestResult => ({
  ok: false,
  status: "disconnected",
  message: `${label} não configurado. Defina ${keys.join(", ")} no ambiente.`,
});

// ── Meta Ads ────────────────────────────────────────────────────────────────
const META_KEYS = ["META_APP_ID", "META_APP_SECRET", "META_ACCESS_TOKEN"];
const META_API = "https://graph.facebook.com/v21.0";

export const metaAds: ProviderAdapter = {
  id: "meta_ads",
  isConfigured: () => missing(META_KEYS).length === 0,
  missingEnv: () => missing(META_KEYS),
  async testConnection() {
    const token = env("META_ACCESS_TOKEN");
    if (!token) return notConfigured("Meta Ads", META_KEYS);
    try {
      const r = await fetch(`${META_API}/me?fields=id,name&access_token=${token}`);
      const body = await r.json();
      if (r.ok && body.id) {
        return { ok: true, status: "connected", message: `Conectado como ${body.name ?? body.id}.` };
      }
      return {
        ok: false,
        status: "error",
        message: body?.error?.message ?? "Token inválido ou sem permissão.",
      };
    } catch (e) {
      return { ok: false, status: "error", message: `Falha de rede: ${(e as Error).message}` };
    }
  },
  async syncAccount(adAccountId) {
    const token = env("META_ACCESS_TOKEN");
    if (!token) throw new Error("Meta Ads não configurado.");
    const fields = "spend,impressions,clicks,ctr,cpc,cpm,actions";
    const r = await fetch(
      `${META_API}/${adAccountId}/insights?fields=${fields}&date_preset=today&access_token=${token}`,
    );
    const body = await r.json();
    if (!r.ok) throw new Error(body?.error?.message ?? "Erro na Graph API.");
    const row = body.data?.[0] ?? {};
    const leads = Number(
      (row.actions ?? []).find((a: { action_type: string }) => a.action_type === "lead")?.value ?? 0,
    );
    const spend = num(row.spend);
    const out: SyncMetricRow[] = [
      { metricKey: "spend", value: spend },
      { metricKey: "traffic_cost", value: spend },
      { metricKey: "impressions", value: num(row.impressions) },
      { metricKey: "ctr", value: num(row.ctr) },
      { metricKey: "cpc", value: num(row.cpc) },
      { metricKey: "cpm", value: num(row.cpm) },
      { metricKey: "paid_leads", value: leads || null },
      { metricKey: "cpl", value: spend != null && leads ? spend / leads : null },
    ];
    return out;
  },
};

// ── Google Ads ──────────────────────────────────────────────────────────────
const GADS_KEYS = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_REFRESH_TOKEN",
];
export const googleAds: ProviderAdapter = {
  id: "google_ads",
  isConfigured: () => missing(GADS_KEYS).length === 0,
  missingEnv: () => missing(GADS_KEYS),
  async testConnection() {
    if (missing(GADS_KEYS).length) return notConfigured("Google Ads", GADS_KEYS);
    // Credenciais presentes — validação completa (OAuth) fica pronta para quando os IDs forem preenchidos.
    return {
      ok: true,
      status: "connected",
      message: "Credenciais presentes. Mapeie o Customer ID por empresa para sincronizar.",
    };
  },
  async syncAccount() {
    throw new Error("Sync Google Ads: implementar chamada à API com o Customer ID mapeado.");
  },
};

// ── Instagram ───────────────────────────────────────────────────────────────
const IG_KEYS = ["META_ACCESS_TOKEN"];
export const instagram: ProviderAdapter = {
  id: "instagram",
  isConfigured: () => missing(IG_KEYS).length === 0,
  missingEnv: () => missing(IG_KEYS),
  async testConnection() {
    const token = env("META_ACCESS_TOKEN");
    if (!token) return notConfigured("Instagram", IG_KEYS);
    try {
      const r = await fetch(`${META_API}/me?access_token=${token}`);
      const body = await r.json();
      if (r.ok && body.id)
        return { ok: true, status: "connected", message: "Token Meta válido para Instagram Graph." };
      return { ok: false, status: "error", message: body?.error?.message ?? "Token inválido." };
    } catch (e) {
      return { ok: false, status: "error", message: `Falha de rede: ${(e as Error).message}` };
    }
  },
  async syncAccount(igAccountId) {
    const token = env("META_ACCESS_TOKEN");
    if (!token) throw new Error("Instagram não configurado.");
    const r = await fetch(
      `${META_API}/${igAccountId}?fields=followers_count,media_count&access_token=${token}`,
    );
    const body = await r.json();
    if (!r.ok) throw new Error(body?.error?.message ?? "Erro na Graph API.");
    return [
      { metricKey: "instagram_followers", value: num(body.followers_count) },
    ];
  },
};

// ── GA4 ─────────────────────────────────────────────────────────────────────
const GA4_KEYS = ["GA4_PROPERTY_ID"];
export const ga4: ProviderAdapter = {
  id: "ga4",
  isConfigured: () => missing(GA4_KEYS).length === 0,
  missingEnv: () => missing(GA4_KEYS),
  async testConnection() {
    if (missing(GA4_KEYS).length) return notConfigured("GA4", GA4_KEYS);
    return {
      ok: true,
      status: "connected",
      message: "Property ID presente. Configure a credencial de service account para coletar dados.",
    };
  },
  async syncAccount() {
    throw new Error("Sync GA4: implementar Data API com service account.");
  },
};

export const ADAPTERS: Record<ProviderId, ProviderAdapter> = {
  meta_ads: metaAds,
  google_ads: googleAds,
  instagram,
  ga4,
};

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
