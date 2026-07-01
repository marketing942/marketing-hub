# CPPEM Marketing Hub

Hub visual, minimalista e premium para o setor de marketing acompanhar em tempo real
a performance de **CPPEM Concursos**, **Unicive** e **Colégio CPPEM**.

Modo TV (rotação automática a cada 20s) + painel de gestão (metas, cards, integrações,
dados manuais e layout).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · lucide-react · Recharts ·
Framer Motion · TanStack Query · date-fns · Supabase (Auth/Postgres/RLS/Storage) · Vercel.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencher quando as integrações forem ativadas (Etapa 2+)
npm run dev
```

Abra http://localhost:3000 (redireciona para `/dashboard`). Modo TV em `/tv`.

## Status por etapa

- [x] **Etapa 1 — Base**: projeto, tema dark, layout/nav, rotas, `/tv` rotativo e `/dashboard`
      com dados de demonstração (marcados como `Demo`).
- [ ] Etapa 2 — Banco Supabase, migrations, seeds, login e RLS
- [ ] Etapa 3 — Dashboard TV com dados reais do Supabase
- [ ] Etapa 4 — Métricas, metas e histórico
- [ ] Etapa 5 — Dados manuais + auditoria
- [ ] Etapa 6 — Integrações (Meta/Google/IG/GA4) + sync
- [ ] Etapa 7 — Dashboard Builder
- [ ] Etapa 8 — Alertas e insights
- [ ] Etapa 9 — Snapshots e exportação
- [ ] Etapa 10 — Testes, empty/loading/error, deploy

## Observações

- Dados atuais são **de demonstração** (`src/lib/demo-data.ts`) e ficam claramente
  marcados na UI. A partir da Etapa 3, o dashboard lê do Supabase e mostra empty state
  quando não houver dados reais.
- Tokens de API nunca ficam no client. O contexto completo do projeto está em
  `../CONTEXTO-PROJETO.md`.
