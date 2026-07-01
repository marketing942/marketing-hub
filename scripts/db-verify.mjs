/**
 * Verifica se o schema foi aplicado corretamente no Supabase.
 * Usa a REST API com a service role (não precisa de senha do banco).
 *
 *   node scripts/db-verify.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const env = {};
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: service, Authorization: `Bearer ${service}` };

const TABLES = [
  "profiles", "companies", "user_company_roles", "marketing_integrations",
  "marketing_integration_accounts", "dashboard_cards", "dashboard_layouts",
  "dashboard_layout_cards", "marketing_goals", "marketing_metrics_daily",
  "marketing_metrics_realtime", "paid_ads_campaigns", "paid_ads_adsets",
  "paid_ads_ads", "organic_metrics_daily", "lead_metrics_daily",
  "manual_metric_entries", "metric_snapshots", "marketing_alerts",
  "sync_jobs", "sync_logs", "audit_logs",
];

let ok = 0, missing = [];
for (const t of TABLES) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=0`, { headers: H });
  if (r.status === 200) ok++;
  else missing.push(`${t} (${r.status})`);
}

console.log(`\n📋 Tabelas: ${ok}/${TABLES.length} encontradas.`);
if (missing.length) console.log("   Faltando:", missing.join(", "));

// Empresas e cards
const comp = await fetch(`${url}/rest/v1/companies?select=slug,name&order=sort_order`, { headers: H });
if (comp.status === 200) {
  const rows = await comp.json();
  console.log(`\n🏢 Empresas (${rows.length}):`);
  rows.forEach((c) => console.log(`   • ${c.name} (${c.slug})`));
}
const cards = await fetch(`${url}/rest/v1/dashboard_cards?select=key&limit=100`, { headers: H });
if (cards.status === 200) {
  const rows = await cards.json();
  console.log(`\n🃏 Cards no catálogo: ${rows.length}`);
}

console.log(
  missing.length === 0
    ? "\n✅ Schema aplicado com sucesso!"
    : "\n⚠️ Ainda faltam tabelas — rode o apply_all.sql no SQL Editor.",
);
