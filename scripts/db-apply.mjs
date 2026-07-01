/**
 * Aplica as migrations + seed no Postgres do Supabase.
 *
 * Uso:
 *   node scripts/db-apply.mjs
 *
 * Requer a variável SUPABASE_DB_URL no .env.local (Connection string / URI do
 * projeto: Supabase → Project Settings → Database → Connection string → URI).
 * Ex.: postgresql://postgres.<ref>:<senha>@aws-0-<região>.pooler.supabase.com:6543/postgres
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Carrega .env.local
const envPath = path.join(root, ".env.local");
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
}

const connectionString = process.env.SUPABASE_DB_URL || env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    "\n❌ SUPABASE_DB_URL não encontrada no .env.local.\n" +
      "   Copie de: Supabase → Project Settings → Database → Connection string → URI\n" +
      "   e adicione ao .env.local como: SUPABASE_DB_URL=postgresql://...\n",
  );
  process.exit(1);
}

const files = [
  "supabase/migrations/0001_init.sql",
  "supabase/migrations/0002_rls.sql",
  "supabase/seed.sql",
];

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("✅ Conectado ao Postgres.\n");
  for (const f of files) {
    const sql = fs.readFileSync(path.join(root, f), "utf8");
    process.stdout.write(`→ Aplicando ${f} ... `);
    await client.query(sql);
    console.log("ok");
  }
  const { rows } = await client.query(
    "select slug, name from companies order by sort_order",
  );
  console.log("\n🏢 Empresas no banco:");
  for (const r of rows) console.log(`   • ${r.name} (${r.slug})`);
  console.log("\n✅ Schema + seed aplicados com sucesso.");
} catch (e) {
  console.error("\n❌ Erro ao aplicar:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
