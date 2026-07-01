/**
 * Semeia METAS (config real) + MÉTRICAS DE EXEMPLO no Supabase para pré-visualizar
 * o dashboard/TV com dados reais do banco (via service role).
 *
 *   node scripts/seed-sample.mjs          → insere metas + métricas de exemplo (hoje e ontem)
 *   node scripts/seed-sample.mjs --clear  → remove as métricas de exemplo (mantém as metas)
 *
 * ⚠️ As métricas inseridas são EXEMPLO para demonstração. Limpe com --clear
 * antes de usar em produção. As metas podem ser mantidas/editadas em /settings/goals.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clear = process.argv.includes("--clear");

const { data: companies } = await supabase
  .from("companies")
  .select("id, slug, name")
  .order("sort_order");

const bySlug = Object.fromEntries(companies.map((c) => [c.slug, c]));

function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}
const today = isoDate(0);
const yesterday = isoDate(1);

// Metas por empresa (direção: lower = teto; higher = meta)
const GOALS = {
  "cppem-concursos": {
    cpl: ["lower", 10], traffic_cost: ["lower", 500], ctr: ["higher", 2], roi: ["higher", 3],
    paid_leads: ["higher", 40], organic_leads: ["higher", 25], total_leads: ["higher", 65],
  },
  unicive: {
    cpl: ["lower", 12], traffic_cost: ["lower", 600], ctr: ["higher", 1.8], roi: ["higher", 2.5],
    paid_leads: ["higher", 35], organic_leads: ["higher", 20], total_leads: ["higher", 55],
  },
  "colegio-cppem": {
    cpl: ["lower", 15], traffic_cost: ["lower", 400], ctr: ["higher", 2], roi: ["higher", 3],
    paid_leads: ["higher", 25], organic_leads: ["higher", 15], total_leads: ["higher", 40],
  },
};

// Métricas de exemplo (hoje / ontem) por empresa
const METRICS = {
  "cppem-concursos": {
    today: { spend: 412.5, cpl: 8.43, ctr: 2.34, cpc: 1.12, cpm: 18.4, roi: 3.4, conversions: 12, paid_leads: 49, organic_leads: 28, total_leads: 77, instagram_followers: 48230, reach: 15400, impressions: 42300, engagement: 2100 },
    yest:  { spend: 388.0, cpl: 9.12, ctr: 2.10, cpc: 1.20, cpm: 19.9, roi: 3.1, conversions: 10, paid_leads: 42, organic_leads: 30, total_leads: 72, instagram_followers: 48100, reach: 14800, impressions: 40100, engagement: 1980 },
  },
  unicive: {
    today: { spend: 585.0, cpl: 13.7, ctr: 1.62, cpc: 1.55, cpm: 24.1, roi: 2.2, conversions: 7, paid_leads: 33, organic_leads: 21, total_leads: 54, instagram_followers: 21540, reach: 8200, impressions: 23100, engagement: 990 },
    yest:  { spend: 540.0, cpl: 12.4, ctr: 1.75, cpc: 1.40, cpm: 22.0, roi: 2.6, conversions: 9, paid_leads: 38, organic_leads: 19, total_leads: 57, instagram_followers: 21490, reach: 8000, impressions: 22400, engagement: 940 },
  },
  "colegio-cppem": {
    today: { spend: 320.0, cpl: 11.2, ctr: 2.05, cpc: 0.98, cpm: 16.2, roi: 3.1, conversions: 8, paid_leads: 29, organic_leads: 16, total_leads: 45, instagram_followers: 12870, reach: 5400, impressions: 15200, engagement: 720 },
    yest:  { spend: 300.0, cpl: 10.5, ctr: 1.90, cpc: 1.05, cpm: 17.1, roi: 2.9, conversions: 7, paid_leads: 24, organic_leads: 14, total_leads: 38, instagram_followers: 12820, reach: 5200, impressions: 14600, engagement: 690 },
  },
};

if (clear) {
  for (const slug of Object.keys(METRICS)) {
    const c = bySlug[slug];
    if (!c) continue;
    await supabase.from("marketing_metrics_daily").delete().eq("company_id", c.id).in("metric_date", [today, yesterday]);
  }
  console.log("🧹 Métricas de exemplo (hoje/ontem) removidas. Metas mantidas.");
  process.exit(0);
}

// Metas
let goalCount = 0;
for (const [slug, goals] of Object.entries(GOALS)) {
  const c = bySlug[slug];
  if (!c) continue;
  const rows = Object.entries(goals).map(([metric_key, [dir, target]]) => ({
    company_id: c.id, metric_key, goal_type: dir, target_value: target, period: "daily", active: true,
  }));
  const { error } = await supabase.from("marketing_goals").upsert(rows, { onConflict: "company_id,metric_key,period" });
  if (error) { console.error("❌ metas", slug, error.message); process.exit(1); }
  goalCount += rows.length;
}
console.log(`🎯 Metas: ${goalCount} registros`);

// Métricas
let metricCount = 0;
for (const [slug, days] of Object.entries(METRICS)) {
  const c = bySlug[slug];
  if (!c) continue;
  const rows = [
    { company_id: c.id, metric_date: today, ...days.today },
    { company_id: c.id, metric_date: yesterday, ...days.yest },
  ];
  const { error } = await supabase.from("marketing_metrics_daily").upsert(rows, { onConflict: "company_id,metric_date" });
  if (error) { console.error("❌ métricas", slug, error.message); process.exit(1); }
  metricCount += rows.length;
}
console.log(`📈 Métricas de EXEMPLO: ${metricCount} registros (hoje + ontem)`);
console.log("\n✅ Pronto. Abra /dashboard e /tv para ver os dados reais do Supabase.");
console.log("   Para limpar as métricas de exemplo: node scripts/seed-sample.mjs --clear");
