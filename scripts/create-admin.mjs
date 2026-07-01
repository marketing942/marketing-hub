/**
 * Cria (ou promove) um usuário admin no Supabase.
 *
 *   node scripts/create-admin.mjs <email> <senha> ["Nome Completo"]
 *
 * Usa a service role. E-mail já confirmado. Define role=admin no profiles.
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

const [, , email, password, fullName] = process.argv;
if (!email || !password) {
  console.error("Uso: node scripts/create-admin.mjs <email> <senha> [\"Nome\"]");
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Cria ou localiza o usuário
let userId;
const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName ?? email },
});

if (createErr) {
  if (/already been registered|already exists/i.test(createErr.message)) {
    // Já existe — localiza e atualiza a senha
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list.users.find((u) => u.email === email);
    if (!existing) {
      console.error("Usuário já existe mas não foi localizado.");
      process.exit(1);
    }
    userId = existing.id;
    await supabase.auth.admin.updateUserById(userId, { password });
    console.log("ℹ️  Usuário já existia — senha atualizada.");
  } else {
    console.error("❌ Erro ao criar usuário:", createErr.message);
    process.exit(1);
  }
} else {
  userId = created.user.id;
  console.log("✅ Usuário criado.");
}

// Garante profile com role=admin
const { error: profErr } = await supabase
  .from("profiles")
  .upsert(
    { id: userId, email, full_name: fullName ?? email, role: "admin", active: true },
    { onConflict: "id" },
  );

if (profErr) {
  console.error("❌ Erro ao definir profile admin:", profErr.message);
  process.exit(1);
}

console.log(`\n👤 Admin pronto:\n   Email: ${email}\n   Role:  admin\n`);
