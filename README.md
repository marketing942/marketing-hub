# CPPEM Marketing Hub

Hub visual, minimalista e premium para o setor de marketing acompanhar em tempo real
a performance de **CPPEM Concursos**, **Unicive** e **Colégio CPPEM**.

Dois usos:

- **Modo TV** (`/tv`) — dashboard rotativo em tela cheia, troca de empresa a cada 20s.
- **Gestão** (`/dashboard`, `/overview`, `/builder`, …) — metas, cards, integrações,
  dados manuais, alertas, snapshots e layout.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · shadcn-style UI ·
lucide-react · Recharts · Framer Motion · TanStack Query · date-fns ·
Supabase (Auth / Postgres / RLS / Storage) · html2canvas-pro + jsPDF · Vercel.

## Rodar localmente

```bash
npm install
cp .env.example .env.local     # preencha as chaves do Supabase (mínimo)
npm run dev                     # http://localhost:3000  → /dashboard  (TV em /tv)
```

### Banco de dados (Supabase)

1. Crie um projeto no Supabase e preencha `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.
2. Aplique o schema + RLS + seed. Duas opções:
   - **SQL Editor** do Supabase: cole e rode `supabase/apply_all.sql` (schema + RLS) e
     depois `supabase/seed.sql` (empresas, integrações, catálogo de cards).
   - **Via script** (precisa `SUPABASE_DB_URL` + `npm i pg`): `npm run db:apply`.
3. Popule o catálogo/seed idempotente por REST: `npm run db:seed`.
4. Confira: `npm run db:verify` (checa tabelas e seed sem senha).
5. Crie o admin: `npm run create-admin marketing@cppem.com.br "SenhaForte" "Nome"`.
6. (Opcional) Métricas de exemplo para visualizar a UI: `npm run seed:sample`
   (limpar com `npm run seed:sample -- --clear`).

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` / `build` / `start` | Desenvolvimento / build / produção |
| `npm run lint` | ESLint |
| `npm run db:apply` | Aplica migrations via `SUPABASE_DB_URL` (requer `pg`) |
| `npm run db:seed` | Seed idempotente via REST + service role |
| `npm run db:verify` | Verifica schema e seed (sem senha) |
| `npm run create-admin <email> <senha> ["Nome"]` | Cria usuário admin |
| `npm run seed:sample` | Metas + métricas de exemplo (`-- --clear` remove) |

## Rotas

`/login` · `/tv` · `/dashboard` · `/overview` · `/builder` · `/companies` ·
`/manual-inputs` · `/alerts` · `/snapshots` · `/sync-status` ·
`/settings/{integrations,goals,users}` ·
API: `/api/sync/{provider|all}`, `/api/cron/marketing-sync`.

## Perfis de acesso (RLS por empresa)

- **Admin** — tudo.
- **Coordenador** — vê tudo; edita metas, dados manuais, layouts, alertas, snapshots.
- **Tráfego Pago** / **Social Media** — leitura + lançamentos manuais do seu escopo.
- **Visualizador/TV** — apenas visualização.

Acesso por empresa é controlado pela tabela `user_company_roles`; as políticas RLS
usam os helpers `is_admin()`, `can_access_company()` e `can_edit()`.

## Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente do `.env.example` (no mínimo as do Supabase +
   `CRON_SECRET`). As integrações podem ficar vazias até haver tokens.
3. O cron já está declarado em `vercel.json` (`/api/cron/marketing-sync`, diário) e
   é protegido pelo `CRON_SECRET`.
4. O bucket de Storage `snapshots` é criado automaticamente no primeiro salvamento
   (via service role).

## Princípios (não violar)

- Sem dado fake exibido como real; sem métrica mock em produção.
- Integração só aparece "conectada" após teste real; status honesto.
- Tudo que é configurável persiste no Supabase (nada só em estado local).
- Tokens de API nunca no client. Empresas padrão: apenas as três (sem "Grupo Mota").

> Contexto completo e histórico de decisões: `CONTEXTO-PROJETO.md`.
