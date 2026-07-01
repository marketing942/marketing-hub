-- ============================================================================
-- CPPEM Marketing Hub — Schema inicial (Etapa 2)
-- Postgres / Supabase. Idempotente onde possível.
-- ============================================================================

-- Extensões
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin','coordinator','paid_traffic','social_media','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type company_status as enum ('active','inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metric_source as enum ('meta_ads','google_ads','instagram','ga4','manual','supabase');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_direction as enum ('higher','lower');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_period as enum ('daily','weekly','monthly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type card_category as enum ('paid','organic','leads','custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type card_source_type as enum ('api','manual','calculated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type card_format as enum ('currency','number','percent','decimal','integer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type layout_mode as enum ('tv','executive','paid','organic','coordination');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_severity as enum ('critical','warning','info');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_status as enum ('open','reviewing','resolved','ignored');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sync_status as enum ('pending','running','success','error');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- FUNÇÃO: updated_at automático
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ----------------------------------------------------------------------------
-- PROFILES (1:1 com auth.users)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role user_role not null default 'viewer',
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- COMPANIES
-- ----------------------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status company_status not null default 'active',
  brand_color text not null default '#16a34a',
  logo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_companies_updated on companies;
create trigger trg_companies_updated before update on companies
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- USER_COMPANY_ROLES (acesso por empresa)
-- ----------------------------------------------------------------------------
create table if not exists user_company_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  role user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);
create index if not exists idx_ucr_user on user_company_roles(user_id);
create index if not exists idx_ucr_company on user_company_roles(company_id);

-- ----------------------------------------------------------------------------
-- FUNÇÕES DE PERMISSÃO (SECURITY DEFINER para evitar recursão em RLS)
-- ----------------------------------------------------------------------------
create or replace function current_role_name()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Vê todas as empresas: admin e coordinator. Demais: só empresas atribuídas.
create or replace function can_access_company(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','coordinator'))
    or exists (select 1 from user_company_roles ucr where ucr.user_id = auth.uid() and ucr.company_id = cid);
$$;

create or replace function can_edit()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin','coordinator'));
$$;

-- ----------------------------------------------------------------------------
-- MARKETING_INTEGRATIONS (config por provedor — sem tokens em texto puro no client)
-- ----------------------------------------------------------------------------
create table if not exists marketing_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,          -- meta_ads | google_ads | instagram | ga4
  status text not null default 'disconnected', -- disconnected | connected | error
  config jsonb not null default '{}',
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_integrations_updated on marketing_integrations;
create trigger trg_integrations_updated before update on marketing_integrations
  for each row execute function set_updated_at();

-- Mapeia empresa -> conta (ad account / customer_id / property / ig account)
create table if not exists marketing_integration_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  provider text not null,
  external_account_id text not null,      -- act_xxx / customer_id / property_id
  account_name text,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, provider)
);
drop trigger if exists trg_int_accounts_updated on marketing_integration_accounts;
create trigger trg_int_accounts_updated before update on marketing_integration_accounts
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- DASHBOARD_CARDS (catálogo de cards)
-- ----------------------------------------------------------------------------
create table if not exists dashboard_cards (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text,
  metric_key text not null,
  category card_category not null default 'paid',
  default_enabled boolean not null default true,
  source_type card_source_type not null default 'api',
  format card_format not null default 'number',
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- DASHBOARD_LAYOUTS + LAYOUT_CARDS
-- ----------------------------------------------------------------------------
create table if not exists dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  mode layout_mode not null default 'executive',
  is_default boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_layouts_updated on dashboard_layouts;
create trigger trg_layouts_updated before update on dashboard_layouts
  for each row execute function set_updated_at();

create table if not exists dashboard_layout_cards (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references dashboard_layouts(id) on delete cascade,
  card_id uuid not null references dashboard_cards(id) on delete cascade,
  enabled boolean not null default true,
  position int not null default 0,
  size text not null default 'md',
  config jsonb not null default '{}',
  unique (layout_id, card_id)
);

-- ----------------------------------------------------------------------------
-- MARKETING_GOALS
-- ----------------------------------------------------------------------------
create table if not exists marketing_goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  metric_key text not null,
  goal_type goal_direction not null default 'higher',
  target_value numeric,
  warning_value numeric,
  critical_value numeric,
  period goal_period not null default 'daily',
  active boolean not null default true,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, metric_key, period)
);
drop trigger if exists trg_goals_updated on marketing_goals;
create trigger trg_goals_updated before update on marketing_goals
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- MÉTRICAS
-- ----------------------------------------------------------------------------
create table if not exists marketing_metrics_realtime (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  metric_key text not null,
  value numeric,
  source metric_source not null default 'supabase',
  source_detail text,
  measured_at timestamptz,
  synced_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  unique (company_id, metric_key)
);
create index if not exists idx_rt_company on marketing_metrics_realtime(company_id);

create table if not exists marketing_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  metric_date date not null,
  paid_leads numeric,
  organic_leads numeric,
  total_leads numeric,
  spend numeric,
  cpl numeric,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  roi numeric,
  conversions numeric,
  instagram_followers numeric,
  link_clicks numeric,
  posts_count numeric,
  stories_count numeric,
  reels_count numeric,
  reach numeric,
  impressions numeric,
  engagement numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, metric_date)
);
drop trigger if exists trg_daily_updated on marketing_metrics_daily;
create trigger trg_daily_updated before update on marketing_metrics_daily
  for each row execute function set_updated_at();
create index if not exists idx_daily_company_date on marketing_metrics_daily(company_id, metric_date desc);

-- ----------------------------------------------------------------------------
-- PAID ADS (campanhas / adsets / ads)
-- ----------------------------------------------------------------------------
create table if not exists paid_ads_campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  provider text not null,
  external_id text not null,
  name text,
  status text,
  spend numeric,
  impressions numeric,
  clicks numeric,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  leads numeric,
  conversions numeric,
  cpl numeric,
  roas numeric,
  metric_date date,
  updated_at timestamptz not null default now(),
  unique (provider, external_id, metric_date)
);
create index if not exists idx_campaigns_company on paid_ads_campaigns(company_id, metric_date desc);

create table if not exists paid_ads_adsets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_external_id text,
  provider text not null,
  external_id text not null,
  name text,
  status text,
  spend numeric,
  impressions numeric,
  clicks numeric,
  leads numeric,
  metric_date date,
  updated_at timestamptz not null default now(),
  unique (provider, external_id, metric_date)
);
create index if not exists idx_adsets_company on paid_ads_adsets(company_id, metric_date desc);

create table if not exists paid_ads_ads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  adset_external_id text,
  provider text not null,
  external_id text not null,
  name text,
  status text,
  spend numeric,
  impressions numeric,
  clicks numeric,
  leads numeric,
  frequency numeric,
  metric_date date,
  updated_at timestamptz not null default now(),
  unique (provider, external_id, metric_date)
);
create index if not exists idx_ads_company on paid_ads_ads(company_id, metric_date desc);

-- ----------------------------------------------------------------------------
-- ORGÂNICO + LEADS
-- ----------------------------------------------------------------------------
create table if not exists organic_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  metric_date date not null,
  instagram_followers numeric,
  new_followers numeric,
  link_clicks numeric,
  posts_count numeric,
  stories_count numeric,
  reels_count numeric,
  reach numeric,
  impressions numeric,
  engagement numeric,
  engagement_rate numeric,
  source metric_source not null default 'instagram',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, metric_date)
);
drop trigger if exists trg_organic_updated on organic_metrics_daily;
create trigger trg_organic_updated before update on organic_metrics_daily
  for each row execute function set_updated_at();

create table if not exists lead_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  metric_date date not null,
  paid_leads numeric default 0,
  organic_leads numeric default 0,
  total_leads numeric default 0,
  leads_by_hour jsonb not null default '{}',
  main_source text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, metric_date)
);
drop trigger if exists trg_leads_updated on lead_metrics_daily;
create trigger trg_leads_updated before update on lead_metrics_daily
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- DADOS MANUAIS + auditoria
-- ----------------------------------------------------------------------------
create table if not exists manual_metric_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  metric_key text not null,
  metric_date date not null default current_date,
  value numeric,
  notes text,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_manual_updated on manual_metric_entries;
create trigger trg_manual_updated before update on manual_metric_entries
  for each row execute function set_updated_at();
create index if not exists idx_manual_company_date on manual_metric_entries(company_id, metric_date desc);

-- ----------------------------------------------------------------------------
-- SNAPSHOTS
-- ----------------------------------------------------------------------------
create table if not exists metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  title text,
  image_url text,
  data jsonb not null default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ALERTAS
-- ----------------------------------------------------------------------------
create table if not exists marketing_alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  metric_key text,
  severity alert_severity not null default 'warning',
  title text not null,
  description text,
  recommendation text,
  status alert_status not null default 'open',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'
);
create index if not exists idx_alerts_company on marketing_alerts(company_id, status);

-- ----------------------------------------------------------------------------
-- SYNC
-- ----------------------------------------------------------------------------
create table if not exists sync_jobs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  company_id uuid references companies(id) on delete cascade,
  status sync_status not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  records_processed int default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_sync_jobs_provider on sync_jobs(provider, created_at desc);

create table if not exists sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references sync_jobs(id) on delete cascade,
  level text not null default 'info',
  message text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUDIT
-- ----------------------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  entity text,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on audit_logs(created_at desc);

-- ----------------------------------------------------------------------------
-- TRIGGER: cria profile ao criar usuário no auth
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
