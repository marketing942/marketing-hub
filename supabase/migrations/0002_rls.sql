-- ============================================================================
-- RLS — CPPEM Marketing Hub
-- Service role (usado em sync/cron) ignora RLS automaticamente.
-- ============================================================================

-- Habilita RLS em todas as tabelas
alter table profiles enable row level security;
alter table companies enable row level security;
alter table user_company_roles enable row level security;
alter table marketing_integrations enable row level security;
alter table marketing_integration_accounts enable row level security;
alter table dashboard_cards enable row level security;
alter table dashboard_layouts enable row level security;
alter table dashboard_layout_cards enable row level security;
alter table marketing_goals enable row level security;
alter table marketing_metrics_realtime enable row level security;
alter table marketing_metrics_daily enable row level security;
alter table paid_ads_campaigns enable row level security;
alter table paid_ads_adsets enable row level security;
alter table paid_ads_ads enable row level security;
alter table organic_metrics_daily enable row level security;
alter table lead_metrics_daily enable row level security;
alter table manual_metric_entries enable row level security;
alter table metric_snapshots enable row level security;
alter table marketing_alerts enable row level security;
alter table sync_jobs enable row level security;
alter table sync_logs enable row level security;
alter table audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles for update
  using (id = auth.uid() or is_admin());

drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles for all
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- COMPANIES — leitura por qualquer autenticado; escrita admin
-- ---------------------------------------------------------------------------
drop policy if exists companies_select on companies;
create policy companies_select on companies for select
  using (auth.uid() is not null);

drop policy if exists companies_admin on companies;
create policy companies_admin on companies for all
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- USER_COMPANY_ROLES — próprio ou admin; escrita admin
-- ---------------------------------------------------------------------------
drop policy if exists ucr_select on user_company_roles;
create policy ucr_select on user_company_roles for select
  using (user_id = auth.uid() or is_admin());

drop policy if exists ucr_admin on user_company_roles;
create policy ucr_admin on user_company_roles for all
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- INTEGRAÇÕES — leitura autenticada; escrita admin/coordenador
-- ---------------------------------------------------------------------------
drop policy if exists integrations_select on marketing_integrations;
create policy integrations_select on marketing_integrations for select
  using (auth.uid() is not null);
drop policy if exists integrations_edit on marketing_integrations;
create policy integrations_edit on marketing_integrations for all
  using (can_edit()) with check (can_edit());

drop policy if exists int_accounts_select on marketing_integration_accounts;
create policy int_accounts_select on marketing_integration_accounts for select
  using (can_access_company(company_id));
drop policy if exists int_accounts_edit on marketing_integration_accounts;
create policy int_accounts_edit on marketing_integration_accounts for all
  using (can_edit()) with check (can_edit());

-- ---------------------------------------------------------------------------
-- DASHBOARD_CARDS (catálogo) — leitura autenticada; escrita admin
-- ---------------------------------------------------------------------------
drop policy if exists cards_select on dashboard_cards;
create policy cards_select on dashboard_cards for select
  using (auth.uid() is not null);
drop policy if exists cards_admin on dashboard_cards;
create policy cards_admin on dashboard_cards for all
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- LAYOUTS — leitura por acesso à empresa (ou layout global); escrita can_edit
-- ---------------------------------------------------------------------------
drop policy if exists layouts_select on dashboard_layouts;
create policy layouts_select on dashboard_layouts for select
  using (company_id is null or can_access_company(company_id));
drop policy if exists layouts_edit on dashboard_layouts;
create policy layouts_edit on dashboard_layouts for all
  using (can_edit()) with check (can_edit());

drop policy if exists layout_cards_select on dashboard_layout_cards;
create policy layout_cards_select on dashboard_layout_cards for select
  using (exists (
    select 1 from dashboard_layouts l
    where l.id = layout_id
      and (l.company_id is null or can_access_company(l.company_id))
  ));
drop policy if exists layout_cards_edit on dashboard_layout_cards;
create policy layout_cards_edit on dashboard_layout_cards for all
  using (can_edit()) with check (can_edit());

-- ---------------------------------------------------------------------------
-- GOALS — leitura por acesso; escrita can_edit
-- ---------------------------------------------------------------------------
drop policy if exists goals_select on marketing_goals;
create policy goals_select on marketing_goals for select
  using (can_access_company(company_id));
drop policy if exists goals_edit on marketing_goals;
create policy goals_edit on marketing_goals for all
  using (can_edit()) with check (can_edit());

-- ---------------------------------------------------------------------------
-- MÉTRICAS (somente leitura para usuários; escrita via service role no sync)
-- ---------------------------------------------------------------------------
drop policy if exists rt_select on marketing_metrics_realtime;
create policy rt_select on marketing_metrics_realtime for select
  using (can_access_company(company_id));

drop policy if exists daily_select on marketing_metrics_daily;
create policy daily_select on marketing_metrics_daily for select
  using (can_access_company(company_id));

drop policy if exists campaigns_select on paid_ads_campaigns;
create policy campaigns_select on paid_ads_campaigns for select
  using (can_access_company(company_id));
drop policy if exists adsets_select on paid_ads_adsets;
create policy adsets_select on paid_ads_adsets for select
  using (can_access_company(company_id));
drop policy if exists ads_select on paid_ads_ads;
create policy ads_select on paid_ads_ads for select
  using (can_access_company(company_id));

drop policy if exists organic_select on organic_metrics_daily;
create policy organic_select on organic_metrics_daily for select
  using (can_access_company(company_id));
drop policy if exists leads_select on lead_metrics_daily;
create policy leads_select on lead_metrics_daily for select
  using (can_access_company(company_id));

-- ---------------------------------------------------------------------------
-- MANUAL ENTRIES — quem tem acesso à empresa pode inserir/editar
-- ---------------------------------------------------------------------------
drop policy if exists manual_select on manual_metric_entries;
create policy manual_select on manual_metric_entries for select
  using (can_access_company(company_id));
drop policy if exists manual_write on manual_metric_entries;
create policy manual_write on manual_metric_entries for all
  using (can_access_company(company_id))
  with check (can_access_company(company_id));

-- ---------------------------------------------------------------------------
-- SNAPSHOTS — acesso por empresa; escrita por autenticado com acesso
-- ---------------------------------------------------------------------------
drop policy if exists snapshots_select on metric_snapshots;
create policy snapshots_select on metric_snapshots for select
  using (company_id is null or can_access_company(company_id));
drop policy if exists snapshots_write on metric_snapshots;
create policy snapshots_write on metric_snapshots for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- ALERTAS — leitura por acesso; update de status por can_edit
-- ---------------------------------------------------------------------------
drop policy if exists alerts_select on marketing_alerts;
create policy alerts_select on marketing_alerts for select
  using (can_access_company(company_id));
drop policy if exists alerts_edit on marketing_alerts;
create policy alerts_edit on marketing_alerts for all
  using (can_edit()) with check (can_edit());

-- ---------------------------------------------------------------------------
-- SYNC / AUDIT — leitura para admin/coordenador
-- ---------------------------------------------------------------------------
drop policy if exists sync_jobs_select on sync_jobs;
create policy sync_jobs_select on sync_jobs for select using (can_edit());
drop policy if exists sync_logs_select on sync_logs;
create policy sync_logs_select on sync_logs for select using (can_edit());
drop policy if exists audit_select on audit_logs;
create policy audit_select on audit_logs for select using (can_edit());
