import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PROVIDERS } from "./providers";
import { ADAPTERS } from "./adapters";
import type { ConnectionStatus, ProviderId } from "./types";

export interface EnvField {
  key: string;
  set: boolean;
  masked: string;
}

export interface IntegrationView {
  id: ProviderId;
  label: string;
  description: string;
  accountLabel: string;
  status: ConnectionStatus;
  configured: boolean;
  missingEnv: string[];
  env: EnvField[];
  lastSyncedAt: string | null;
  lastError: string | null;
  accounts: { companyId: string; externalAccountId: string }[];
}

function mask(value: string | undefined): EnvField["masked"] {
  if (!value || value.trim() === "") return "";
  const v = value.trim();
  if (v.length <= 6) return "••••";
  return `${v.slice(0, 3)}••••${v.slice(-4)}`;
}

/** Status real de cada integração (nunca "conectado" sem base real). */
export async function fetchIntegrations(): Promise<IntegrationView[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("marketing_integrations")
    .select("provider, status, last_synced_at, last_error");
  const { data: accounts } = await supabase
    .from("marketing_integration_accounts")
    .select("provider, company_id, external_account_id");

  const byProvider = Object.fromEntries((rows ?? []).map((r) => [r.provider, r]));

  return PROVIDERS.map((p) => {
    const adapter = ADAPTERS[p.id];
    const configured = adapter.isConfigured();
    const dbRow = byProvider[p.id];

    // Status honesto: se não configurado, é "disconnected" independentemente do banco.
    let status: ConnectionStatus = "disconnected";
    if (configured) {
      status = (dbRow?.status as ConnectionStatus) ?? "disconnected";
      if (status === "connected" && !dbRow?.last_synced_at) status = "disconnected";
    }

    return {
      id: p.id,
      label: p.label,
      description: p.description,
      accountLabel: p.accountLabel,
      status,
      configured,
      missingEnv: adapter.missingEnv(),
      env: p.envKeys.map((k) => ({
        key: k,
        set: !!(process.env[k] && process.env[k]!.trim() !== ""),
        masked: mask(process.env[k]),
      })),
      lastSyncedAt: dbRow?.last_synced_at ?? null,
      lastError: dbRow?.last_error ?? null,
      accounts: (accounts ?? [])
        .filter((a) => a.provider === p.id)
        .map((a) => ({ companyId: a.company_id, externalAccountId: a.external_account_id })),
    };
  });
}
