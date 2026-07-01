-- ============================================================================
-- SEED — CPPEM Marketing Hub
-- Idempotente (upsert por slug/key). Apenas as 3 empresas. Sem "Grupo Mota".
-- ============================================================================

-- Empresas
insert into companies (name, slug, status, brand_color, sort_order) values
  ('CPPEM Concursos', 'cppem-concursos', 'active', '#16a34a', 1),
  ('Unicive',         'unicive',         'active', '#22c55e', 2),
  ('Colégio CPPEM',   'colegio-cppem',   'active', '#4ade80', 3)
on conflict (slug) do update
  set name = excluded.name,
      brand_color = excluded.brand_color,
      sort_order = excluded.sort_order,
      status = excluded.status;

-- Integrações (registros base, desconectados até configurar tokens)
insert into marketing_integrations (provider, status) values
  ('meta_ads', 'disconnected'),
  ('google_ads', 'disconnected'),
  ('instagram', 'disconnected'),
  ('ga4', 'disconnected')
on conflict (provider) do nothing;

-- Catálogo de cards padrão
insert into dashboard_cards (key, title, metric_key, category, default_enabled, source_type, format, icon, sort_order) values
  ('cpl',                 'CPL',                 'cpl',                 'paid',    true,  'api',        'currency', 'DollarSign',  1),
  ('traffic_cost',        'Custo de Tráfego',    'traffic_cost',        'paid',    true,  'api',        'currency', 'Wallet',      2),
  ('ctr',                 'CTR',                 'ctr',                 'paid',    true,  'api',        'percent',  'MousePointer',3),
  ('roi',                 'ROI',                 'roi',                 'paid',    true,  'calculated', 'decimal',  'TrendingUp',  4),
  ('paid_leads',          'Leads Pagos',         'paid_leads',          'leads',   true,  'api',        'integer',  'UserPlus',    5),
  ('organic_leads',       'Leads Orgânicos',     'organic_leads',       'leads',   true,  'manual',     'integer',  'Users',       6),
  ('total_leads',         'Leads Totais',        'total_leads',         'leads',   true,  'calculated', 'integer',  'Users',       7),
  ('cpc',                 'CPC',                 'cpc',                 'paid',    false, 'api',        'currency', 'MousePointer',8),
  ('cpm',                 'CPM',                 'cpm',                 'paid',    false, 'api',        'currency', 'Eye',         9),
  ('conversions',         'Conversões',          'conversions',         'paid',    false, 'api',        'integer',  'Target',      10),
  ('spend',               'Investimento Diário', 'spend',               'paid',    false, 'api',        'currency', 'Wallet',      11),
  ('conversion_rate',     'Taxa de Conversão',   'conversion_rate',     'paid',    false, 'calculated', 'percent',  'Percent',     12),
  ('instagram_followers', 'Seguidores IG',       'instagram_followers', 'organic', false, 'api',        'integer',  'Instagram',   13),
  ('new_followers',       'Novos Seguidores',    'new_followers',       'organic', false, 'api',        'integer',  'UserPlus',    14),
  ('link_clicks',         'Cliques na Bio',      'link_clicks',         'organic', false, 'manual',     'integer',  'Link',        15),
  ('posts_count',         'Posts Publicados',    'posts_count',         'organic', false, 'manual',     'integer',  'Image',       16),
  ('stories_count',       'Stories Publicados',  'stories_count',       'organic', false, 'manual',     'integer',  'Circle',      17),
  ('reels_count',         'Reels Publicados',    'reels_count',         'organic', false, 'manual',     'integer',  'Video',       18),
  ('reach',               'Alcance',             'reach',               'organic', false, 'api',        'integer',  'Radio',       19),
  ('impressions',         'Impressões',          'impressions',         'organic', false, 'api',        'integer',  'Eye',         20),
  ('engagement',          'Engajamento',         'engagement',          'organic', false, 'api',        'integer',  'Heart',       21),
  ('engagement_rate',     'Taxa de Engajamento', 'engagement_rate',     'organic', false, 'calculated', 'percent',  'Heart',       22)
on conflict (key) do update
  set title = excluded.title,
      category = excluded.category,
      format = excluded.format,
      source_type = excluded.source_type,
      sort_order = excluded.sort_order;
