/**
 * Aplica o seed (empresas, integrações, catálogo de cards) via REST usando a
 * service role — upsert idempotente. Não precisa de senha do banco.
 *
 *   node scripts/db-seed.mjs
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

async function upsert(table, rows, onConflict) {
  const r = await fetch(
    `${url}/rest/v1/${table}?on_conflict=${onConflict}`,
    {
      method: "POST",
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    },
  );
  if (!r.ok) {
    console.error(`❌ ${table}:`, r.status, await r.text());
    process.exit(1);
  }
  console.log(`✅ ${table}: ${rows.length} registros`);
}

const companies = [
  { name: "CPPEM Concursos", slug: "cppem-concursos", status: "active", brand_color: "#16a34a", sort_order: 1 },
  { name: "Unicive", slug: "unicive", status: "active", brand_color: "#22c55e", sort_order: 2 },
  { name: "Colégio CPPEM", slug: "colegio-cppem", status: "active", brand_color: "#4ade80", sort_order: 3 },
];

const integrations = [
  { provider: "meta_ads", status: "disconnected" },
  { provider: "google_ads", status: "disconnected" },
  { provider: "instagram", status: "disconnected" },
  { provider: "ga4", status: "disconnected" },
];

const c = (key, title, metric_key, category, default_enabled, source_type, format, icon, sort_order) =>
  ({ key, title, metric_key, category, default_enabled, source_type, format, icon, sort_order });

const cards = [
  c("cpl", "CPL", "cpl", "paid", true, "api", "currency", "DollarSign", 1),
  c("traffic_cost", "Custo de Tráfego", "traffic_cost", "paid", true, "api", "currency", "Wallet", 2),
  c("ctr", "CTR", "ctr", "paid", true, "api", "percent", "MousePointer", 3),
  c("roi", "ROI", "roi", "paid", true, "calculated", "decimal", "TrendingUp", 4),
  c("paid_leads", "Leads Pagos", "paid_leads", "leads", true, "api", "integer", "UserPlus", 5),
  c("organic_leads", "Leads Orgânicos", "organic_leads", "leads", true, "manual", "integer", "Users", 6),
  c("total_leads", "Leads Totais", "total_leads", "leads", true, "calculated", "integer", "Users", 7),
  c("cpc", "CPC", "cpc", "paid", false, "api", "currency", "MousePointer", 8),
  c("cpm", "CPM", "cpm", "paid", false, "api", "currency", "Eye", 9),
  c("conversions", "Conversões", "conversions", "paid", false, "api", "integer", "Target", 10),
  c("spend", "Investimento Diário", "spend", "paid", false, "api", "currency", "Wallet", 11),
  c("conversion_rate", "Taxa de Conversão", "conversion_rate", "paid", false, "calculated", "percent", "Percent", 12),
  c("instagram_followers", "Seguidores IG", "instagram_followers", "organic", false, "api", "integer", "Instagram", 13),
  c("new_followers", "Novos Seguidores", "new_followers", "organic", false, "api", "integer", "UserPlus", 14),
  c("link_clicks", "Cliques na Bio", "link_clicks", "organic", false, "manual", "integer", "Link", 15),
  c("posts_count", "Posts Publicados", "posts_count", "organic", false, "manual", "integer", "Image", 16),
  c("stories_count", "Stories Publicados", "stories_count", "organic", false, "manual", "integer", "Circle", 17),
  c("reels_count", "Reels Publicados", "reels_count", "organic", false, "manual", "integer", "Video", 18),
  c("reach", "Alcance", "reach", "organic", false, "api", "integer", "Radio", 19),
  c("impressions", "Impressões", "impressions", "organic", false, "api", "integer", "Eye", 20),
  c("engagement", "Engajamento", "engagement", "organic", false, "api", "integer", "Heart", 21),
  c("engagement_rate", "Taxa de Engajamento", "engagement_rate", "organic", false, "calculated", "percent", "Heart", 22),
];

await upsert("companies", companies, "slug");
await upsert("marketing_integrations", integrations, "provider");
await upsert("dashboard_cards", cards, "key");
console.log("\n🌱 Seed concluído.");
