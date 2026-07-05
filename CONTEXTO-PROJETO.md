# CPPEM Marketing Hub — Contexto do Projeto

> Arquivo de memória da conversa. Serve para retomar o desenvolvimento caso o projeto seja fechado.
> Última atualização: 2026-07-04 (Etapa 9)

---

## Visão geral

Sistema **CPPEM Marketing Hub**: hub visual minimalista, escuro e premium para o setor de marketing
acompanhar em tempo real a performance das empresas:

- **CPPEM Concursos**
- **Unicive**
- **Colégio CPPEM**

> ⚠️ NÃO incluir "Grupo Mota" como empresa do dashboard. Apenas as 3 acima.

Dois usos principais:
1. **TV** — dashboard rotativo, troca de empresa automaticamente a cada **20 segundos**.
2. **Computador** — login de coordenador/gestor para configurar metas, cards, integrações, dados manuais e layout.

---

## Stack obrigatória

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui + lucide-react
- Recharts (gráficos) + Framer Motion (animações leves)
- Supabase: Auth + Postgres + RLS + Storage + Edge Functions
- Vercel (deploy) + Vercel Cron (ou Edge Functions cron) para sync
- TanStack Query ou SWR (cache/atualização) + date-fns
- Server Actions / Route Handlers no backend
- **Sem Rails** nesta versão (deploy Vercel favorece Next.js fullstack + Supabase).

## Identidade visual (tema dark premium)

- Fundo principal: `#0B0F0D` ou `#0F1411` (chumbo quase preto, não preto puro)
- Cards: `#111815` ou `#141A17`
- Bordas: `#243028`
- Verde principal: `#16A34A` | Verde claro: `#22C55E` | Verde neon destaque: `#4ADE80`
- Texto principal: `#FFFFFF` | Texto secundário: `#A3A3A3`
- Status: verde = bom, amarelo = atenção, vermelho = crítico
- Objetivo: elegante, limpo, leitura rápida à distância (TV).

---

## Arquitetura escolhida

- Next.js 15 App Router fullstack + Supabase, deploy Vercel.
- UI: React Server/Client Components, shadcn/ui, Tailwind, Framer Motion.
- Data: Server Components + TanStack Query (client) / Server Actions (mutations).
- Backend: Route Handlers `/api/*` + Server Actions.
- Integrações: `lib/integrations/*` server-only (tokens nunca no client).
- Sync: Vercel Cron -> `/api/cron/marketing-sync` protegido por `CRON_SECRET`.
- Auth: Supabase Auth (`@supabase/ssr`) + middleware de sessão.
- RLS por empresa via `user_company_roles`.

## Rotas principais

- `/login` — auth
- `/tv` — dashboard rotativo fullscreen (20s)
- `/dashboard` — visão do gestor (filtros, gráficos, insights)
- `/overview` — visão geral consolidada (3 empresas)
- `/builder` — dashboard builder (drag & drop, layouts)
- `/companies`
- `/manual-inputs` — dados manuais + auditoria
- `/alerts`
- `/snapshots`
- `/sync-status`
- `/settings/integrations`, `/settings/goals`, `/settings/users`
- API: `/api/sync/{meta-ads,google-ads,instagram,ga4,all}`, `/api/cron/marketing-sync`,
  `/api/snapshots`, `/api/alerts`, `/api/dashboard-layouts`, `/api/metrics`

## Perfis de acesso

- **Admin** — tudo (APIs, empresas, metas, cards, usuários, rotação TV, alertas).
- **Coordenador/Gestor** — vê tudo, edita metas/dados manuais, monta dashboard, snapshots, export, alertas, logs.
- **Tráfego Pago** — vê mídia paga (Meta/Google Ads), atualiza dados manuais de tráfego; sem permissões.
- **Social Media** — vê orgânico, atualiza posts/stories/reels/observações; sem dados financeiros.
- **Visualizador/TV** — só vê `/tv`; não edita nada.

Permissões por empresa: usuário pode ver empresas específicas (tabela `user_company_roles`).

## Cards

**Mídia paga (padrão):** CPL vs meta, Custo tráfego vs teto, CTR vs meta, ROI vs meta, Leads pagos do dia,
CPC, CPM, Conversões, Investimento diário, Taxa de conversão de lead.

**Orgânicos:** Seguidores IG, novos seguidores/dia, cliques na bio, nº posts, nº stories, nº reels,
alcance orgânico, impressões orgânicas, engajamento, taxa de engajamento, melhores reels, stories com mais cliques.

**Leads diários:** orgânicos, pagos, totais, por hora, crescimento vs ontem, origem principal, % pago vs orgânico,
empresa com mais leads.

**Cada card mostra:** nome, valor atual, meta/teto, % atingimento, status (dentro/atenção/crítico),
variação vs dia anterior, fonte do dado, última atualização.

**Cards adicionais recomendados:** CAC, conversão lead->venda, receita atribuída, ticket médio, ROAS,
melhor/pior campanha, melhor/pior criativo, frequência, conversão da landing, leads por canal/campanha/formulário,
comparativos (hoje vs ontem, semana vs semana), projeção de fechamento do mês.

## Regras de cálculo

- CPL = spend / paid_leads
- CTR = clicks / impressions * 100
- CPC = spend / clicks
- CPM = spend / impressions * 1000
- ROI = revenue / spend (se houver receita)
- total_leads = paid_leads + organic_leads
- % atingimento: métricas "menor é melhor" (CPL, custo) comparam contra teto; "maior é melhor" (leads, ROI, CTR) contra meta.
- Status: verde=dentro, amarelo=atenção, vermelho=crítico.

## Tabelas Supabase (migrations)

profiles, companies, user_company_roles, marketing_integrations, marketing_integration_accounts,
dashboard_cards, dashboard_layouts, dashboard_layout_cards, marketing_goals, marketing_metrics_daily,
marketing_metrics_realtime, paid_ads_campaigns, paid_ads_adsets, paid_ads_ads, organic_metrics_daily,
lead_metrics_daily, manual_metric_entries, metric_snapshots, marketing_alerts, sync_jobs, sync_logs, audit_logs.

Seeds: companies -> cppem-concursos, unicive, colegio-cppem.
metric_key exemplos: cpl, traffic_cost, ctr, roi, cpc, cpm, paid_leads, organic_leads, total_leads,
instagram_followers, link_clicks, posts_count, stories_count, reels_count, reach, impressions, engagement.

## Integrações (deixar tudo pronto, tokens depois)

- **Meta Ads API** — campanhas/adsets/ads, spend, impressões, cliques, CTR, CPC, CPM, leads, conversões, CPL, ROAS, status.
  Mapear empresa -> ad account (X/Y/Z).
- **Google Ads API** — campanhas, custo, cliques, impressões, CTR, CPC médio, conversões, custo/conversão, taxa conversão. Mapear customer_id por empresa.
- **Instagram Graph API** — seguidores, alcance, impressões, cliques, mídias, reels, stories, engajamento. Faltou API -> campo manual.
- **GA4** — sessões, usuários, eventos, conversões, origem/mídia, cliques, páginas, leads por origem.
- **Supabase** — fonte de verdade.

## Sincronização

Meta 15min, Google 30min, Instagram 1h, GA4 30min, manual imediato, alertas 15min.
Endpoints: `/api/sync/{meta-ads,google-ads,instagram,ga4,all}`, `/api/cron/marketing-sync`.
Cada sync: por empresa, salva histórico, não duplica, registra log/erro, mostra última sync no dashboard.

## Alertas

CPL acima meta, CTR abaixo meta, investimento perto do teto, ROI abaixo meta, campanha gastando sem lead,
queda brusca de leads, nenhum lead pago no dia, nenhum post/reel/story no dia, dados desatualizados,
API com erro, empresa sem meta. Cada alerta: empresa, métrica, problema, gravidade, ação recomendada,
horário, status (aberto/em análise/resolvido/ignorado).

## Insights do Dia

Regras simples inicialmente (o que melhorou/piorou, gargalo, empresa em atenção, métrica fora da meta,
o que fazer hoje, campanhas para pausar/observar/escalar). Depois integrar IA.

## Variáveis de ambiente

NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN,
GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_REFRESH_TOKEN,
GA4_PROPERTY_ID, CRON_SECRET.

## Regras finais (não violar)

- Nada de visual fake; sem dado mock aparecendo como real (mock só como fallback dev marcado "demo").
- Não mostrar API conectada sem teste real.
- Tudo configurável persiste no Supabase (nada só em estado local).
- Erros mostram mensagem clara; dados reais têm fonte + horário; dados manuais mostram quem alterou.
- Tokens nunca no client. Empresas padrão: só as 3. Sem "Grupo Mota".
- `/tv` precisa parecer pronto para TV do setor de marketing.

---

## Componentes obrigatórios

AppShell, TVDashboard, CompanyRotator, CompanyHeader, MetricCard, KPIStatusBadge, GoalProgressBar,
MetricTrend, LeadSplitCard, OrganicMetricsGrid, PaidMetricsGrid, AlertBanner, InsightPanel,
DashboardBuilder, CardSelector, CardOrderManager, IntegrationStatusCard, GoalEditor, ManualMetricForm,
SyncStatusPanel, SnapshotButton, ExportButton, FullscreenButton, UserCompanyAccessManager.

## Hooks

use-company, use-dashboard-metrics, use-dashboard-layout, use-company-rotation, use-integrations,
use-goals, use-alerts, use-manual-metrics.

---

## PLANO DE ETAPAS (progresso)

- [x] **Etapa 1 — Base do projeto**: ✅ CONCLUÍDA. Next.js 16 + React 19 + Tailwind v4, deps instaladas,
      tema dark (tokens CPPEM em globals.css), AppShell + nav, todas as rotas, `/tv` rotativo (20s, Framer Motion,
      pausa/prox/ant/fullscreen), `/dashboard` com MetricCard + dados demo marcados. Build passou (15 rotas).
- [x] **Etapa 2 — Banco e autenticação**: ✅ CONCLUÍDA. Schema aplicado (22 tabelas + RLS), seed (3 empresas,
      4 integrações, 22 cards). Login real com Supabase Auth: server actions (signIn/signOut), tela /login funcional,
      getCurrentUser, proteção de rotas no middleware, usuário no AppShell com logout. Admin criado
      (marketing@cppem.com.br, role=admin). Build OK (todas as rotas do app protegidas/dinâmicas).
- [x] **Etapa 3 — Dashboard TV**: ✅ CONCLUÍDA. /tv e /dashboard leem dados REAIS do Supabase via
      `lib/metrics/dashboard-data.ts` (fetchDashboardData: goals + marketing_metrics_daily atual/anterior + realtime override).
      Catálogo de cards em `lib/metrics/catalog.ts`. Empty state quando sem dados. Rotação 20s, fullscreen, pausa/prox/ant.
      MetricCard agora usa `updatedAt` ISO + `UpdatedAgo` (sem mismatch de hidratação). demo-data.ts descontinuado (não importado).
      middleware→proxy (Next 16: `src/proxy.ts`). Metas + métricas de EXEMPLO semeadas (`npm run seed:sample`, limpar com --clear).
      Validado login+RLS+query como admin (6 métricas, 21 metas).
- [x] **Etapa 4 — Métricas e metas**: ✅ CONCLUÍDA. /settings/goals funcional (GoalsEditor client + server action
      `saveCompanyGoals` com upsert/delete e permissão admin/coordenador; RLS validado). /overview consolidada
      (KPIs: leads totais, investimento, CPL médio, ROI médio; melhor empresa; empresa em atenção; ranking por
      % de metas atingidas). `lib/goals/{queries,actions}.ts`. Empty states e checagem de permissão.
- [x] **Etapa 5 — Dados manuais**: ✅ CONCLUÍDA. /manual-inputs (ManualMetricForm: empresa/métrica/data/valor/observação)
      + histórico com autor. `lib/manual/{actions,queries}.ts`. saveManualEntry insere em manual_metric_entries (RLS
      por acesso à empresa, created_by/updated_by) + auditoria em audit_logs via service role. dashboard-data agora
      aplica override manual (fonte "Manual", prioridade máxima). Validado insert+embed profiles sob RLS.
- [x] **Etapa 6 — Integrações + Sync**: ✅ CONCLUÍDA (estrutura real). `lib/integrations/`: providers.ts, adapters.ts
      (server: isConfigured/testConnection/syncAccount — Meta e Instagram fazem ping real no Graph API quando há token;
      Google/GA4 prontos p/ credenciais), sync.ts (runProviderSync/runAllSync via service role; grava sync_jobs/sync_logs,
      atualiza marketing_integrations, upsert em marketing_metrics_daily), queries.ts (status real + env mascarado),
      actions.ts (testIntegration/syncNow), auth-guard.ts (CRON_SECRET|admin). Rotas: /api/sync/[provider], /api/sync/all,
      /api/cron/marketing-sync. UI: /settings/integrations (IntegrationStatusCard) e /sync-status. vercel.json cron */15.
      Status HONESTO: sem token = "desconectado". FALTA (quando houver tokens): preencher env + mapear
      marketing_integration_accounts (empresa→conta) + completar syncAccount Google/GA4.
- [x] **Etapa 7 — Dashboard Builder**: ✅ CONCLUÍDA. `/builder` funcional (BuilderClient): seletor de empresa +
      modo (TV/Executivo/Tráfego/Orgânico/Coordenação), lista de layouts do escopo, criar/editar/excluir, definir
      padrão, ativar/desativar cards, **drag-and-drop** (framer-motion `Reorder`) para reordenar e tamanho P/M/G
      (G ocupa 2 colunas). `lib/layouts/{types,queries,actions}.ts` (types client-safe separado do server-only;
      saveLayout/deleteLayout/setDefaultLayout com permissão admin/coordenador, upsert dashboard_layouts +
      replace dashboard_layout_cards, 1 padrão por empresa+modo). Aplicado no **/tv** (modo tv) e **/dashboard**
      (modo executive): layout padrão define ordem/tamanho/quais cards; sem layout → fallback catálogo. Build OK.
- [x] **Etapa 8 — Alertas e insights**: ✅ CONCLUÍDA. Motor de regras puro `lib/alerts/rules.ts`
      (métrica fora da meta, empresa sem meta, investimento sem leads, queda brusca de leads, sem publicações
      orgânicas, dados desatualizados). `lib/alerts/generate.ts` (buildMetricsForAlerts com client de sessão OU
      admin + generateAlerts: dedupe por empresa+regra em alertas abertos, insere novos e auto-resolve os que não
      valem mais; metadata.auto/rule). `lib/alerts/{queries,actions}.ts` (fetchAlerts; updateAlertStatus +
      generateAlertsNow, permissão admin/coordenador). UI `/alerts` (AlertsClient): filtros por status/empresa,
      contadores, ações aberto/em análise/resolvido/ignorado/reabrir, botão "Gerar alertas agora". Geração
      automática no cron `/api/cron/marketing-sync` (service role, após o sync). Insights: `lib/insights/build.ts`
      + `InsightPanel` (server) renderizado no /overview ("Insights do Dia": leads hoje vs ontem, melhor empresa,
      empresa em atenção, gargalos, o que fazer hoje). Build OK.
- [x] **Etapa 9 — Exportação e snapshots**: ✅ CONCLUÍDA. Captura client `lib/snapshots/capture.ts`
      (**html2canvas-pro** — troca do html2canvas 1.4.1, que não parseia `color-mix/oklch` do Tailwind v4; +
      jsPDF via import dinâmico; imageUrlToDataUrl p/ baixar snapshots salvos). `lib/snapshots/actions.ts`
      (saveSnapshot: ensureBucket público "snapshots" via service role, upload PNG, insert em metric_snapshots com
      created_by; deleteSnapshot autor/admin remove linha+arquivo). `lib/snapshots/queries.ts` (fetchSnapshots +
      autor). UI: `SnapshotControls` (PNG/PDF/Salvar) no /dashboard; botão de snapshot **reativado no /tv**
      (captura tela cheia + salva); `/snapshots` (SnapshotsGallery: filtro por empresa, download PNG/PDF, abrir,
      excluir, **comparação lado a lado** de 2). next.config: remotePatterns do host Supabase p/ next/image. Build OK.
- [ ] Etapa 10 — Testes, limpeza, empty/loading/error states, RLS, deploy Vercel, README

---

## Log de sessões

### 2026-07-01
- Definida arquitetura, rotas, tabelas, componentes e ordem.
- Etapa 1 concluída. Projeto em `cppem-marketing-hub/` (subpasta). Node 24, npm 11.
- Stack real detectada: **Next.js 16.2.9 (Turbopack) + React 19.2 + Tailwind v4** (config em CSS via `@theme`).
  ⚠️ Next 16 tem breaking changes vs training data — há `node_modules/next/dist/docs/` para consultar.
- Estrutura criada:
  - `src/app/(app)/*` (route group com AppShell) + `/tv` e `/login` fora do shell.
  - `src/lib/`: types.ts, companies.ts, utils.ts, demo-data.ts, metrics/{calculations,status,formatting}.ts
  - `src/components/`: ui/{button,card}, layout/{app-shell,page-header,nav-config}, cards/metric-card, tv/tv-dashboard, providers
  - `src/hooks/`: use-company-rotation.ts, use-clock.ts
  - `.env.example` com todas as variáveis. README atualizado.
- Comando de dev: `cd cppem-marketing-hub && npm run dev` → http://localhost:3000
- Etapa 2 iniciada: Supabase integrado.
  - Projeto Supabase: `hyvhlmcldmygqukhuxmb.supabase.co` (URL/anon/service_role no .env.local — Meta/Google/GA4 ainda vazios).
  - Conexão testada OK (Auth health 200, REST service role OK).
  - Arquivos: `src/lib/supabase/{client,server,admin,middleware,queries}.ts`, `src/middleware.ts`.
  - SQL: `supabase/migrations/0001_init.sql`, `0002_rls.sql`, `supabase/seed.sql`, `supabase/apply_all.sql`.
  - Scripts: `npm run db:verify` (checa via REST, sem senha), `npm run db:apply` (precisa `SUPABASE_DB_URL` + `npm i pg`).
  - RLS: helpers `is_admin()`, `can_access_company(cid)`, `can_edit()`; trigger cria profile ao criar auth user.
  - ✅ SCHEMA APLICADO E SEED FEITO (2026-07-01): 22/22 tabelas, 3 empresas, 4 integrações, 22 cards.
    - Bug corrigido no seed: coluna `format` do card `traffic_cost` estava com 'Wallet' (inválido no enum card_format) → 'currency'.
    - Descoberto que o usuário havia colado a chave ANON em `SUPABASE_SERVICE_ROLE_KEY`; já corrigido para a service_role real.
    - Seed aplicado via `scripts/db-seed.mjs` (REST + service role, idempotente). Verificação via `npm run db:verify`.
- Etapa 2 concluída: auth completo.
  - Arquivos: `src/lib/auth/{actions,user}.ts`, `src/app/login/{page,login-form}.tsx`, middleware protege rotas.
  - Scripts: `npm run create-admin <email> <senha> ["Nome"]`, `npm run db:seed`.
  - Admin: marketing@cppem.com.br (role=admin). Senha temporária definida em 2026-07-01 — usuário deve trocar.
  - Rotas públicas no middleware: /login, /auth, /api/cron, /api/sync. Resto exige login.
### 2026-07-03
- Etapa 7 concluída: Dashboard Builder. Arquivos: `src/lib/layouts/{types,queries,actions}.ts`,
  `src/components/builder/builder-client.tsx`, `/builder` page. `/tv` e `/dashboard` pages agora resolvem o
  layout padrão via `resolveLayoutsByCompany` e passam para os componentes (TVDashboard/DashboardView aplicam
  ordem, tamanho e seleção de cards; fallback para o catálogo quando não há layout). Drag-and-drop com
  framer-motion `Reorder` (sem nova dependência). Type-check e `npm run build` OK (18 rotas).
- ⚠️ Git: remote ajustado para `git@github.com:marketing942/marketing-hub.git`; push via HTTPS falhou (403 — a
  credencial salva no Windows é da conta `H4zzard`, sem acesso de escrita). Pendente: token/colaborador correto.
- Etapa 8 concluída. Arquivos: `src/lib/alerts/{rules,generate,queries,actions}.ts`,
  `src/lib/insights/build.ts`, `src/components/alerts/alerts-client.tsx`, `src/components/insights/insight-panel.tsx`,
  `/alerts` page, InsightPanel no /overview, geração no cron. Type-check + build OK (18 rotas).
- Etapa 9 concluída. Arquivos: `src/lib/snapshots/{capture,queries,actions}.ts`,
  `src/components/snapshots/{snapshot-controls,snapshots-gallery}.tsx`, `/snapshots` page, SnapshotControls no
  /dashboard, botão reativado no /tv, next.config remotePatterns. Dependência: **html2canvas-pro** (removido
  html2canvas). Type-check + build OK.
  ⚠️ Runtime: o bucket "snapshots" é criado sob demanda no 1º save (service role). Se o Storage exigir políticas,
  o bucket é público (leitura ok); escrita/exclusão são feitas via service role no server.
- **PRÓXIMO: Etapa 10** — Testes, limpeza, empty/loading/error states, revisão de RLS, deploy Vercel, README.
  Pendências opcionais acumuladas: /settings/users + UserCompanyAccessManager (Etapa 2), gráficos/histórico (Recharts),
  syncAccount Google Ads/GA4 completos, mapeamento de contas na UI de integrações,
  alerta "API com erro" (precisa mapear integração→empresa).
