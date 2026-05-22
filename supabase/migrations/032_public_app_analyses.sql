-- 032_public_app_analyses.sql
-- Tables for the public "Play Store Review Analyzer" free tool.
-- Service-role only (no end-user RLS) — all reads/writes happen server-side from
-- the analyzer API routes using the admin client. Both tables are additive.

create table if not exists public.public_app_analyses (
  package_id    text primary key,
  app_name      text,
  app_icon_url  text,
  rating        numeric,
  rating_count  integer,
  analysis      jsonb,
  scraped_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '7 days')
);

create index if not exists idx_public_app_analyses_expires
  on public.public_app_analyses (expires_at);

create table if not exists public.analyzer_rate_limits (
  ip_hash          text not null,
  day              date not null default current_date,
  fresh_count      integer not null default 0,
  unique_packages  text[] not null default array[]::text[],
  email_unlocked   boolean not null default false,
  primary key (ip_hash, day)
);

-- Service-role only. Enable RLS and add NO policies so the anon/auth keys
-- cannot reach these rows; the admin client bypasses RLS.
alter table public.public_app_analyses enable row level security;
alter table public.analyzer_rate_limits enable row level security;

comment on table public.public_app_analyses is
  'Cached Play Store analyses for the public free tool; 7-day TTL.';
comment on table public.analyzer_rate_limits is
  'Per-IP daily quota for the public analyzer (hashed IPs).';

-- ── Analyzer leads ──────────────────────────────────────────────────────────
-- Captures email addresses submitted via the "Unlock 5 more analyses + PDF
-- report" gate on /tools/play-store-analyzer. Service-role only — written
-- from the email-report API route, never read from the browser.
--
-- Composite PK (email, package_id) is idempotent: the same person requesting
-- a PDF for the same app twice updates nothing; requesting a PDF for a
-- different app creates a separate row so we know which apps a lead cares
-- about. The IP hash is the same per-day salted hash used in
-- analyzer_rate_limits.

create table if not exists public.analyzer_leads (
  email       text        not null,
  package_id  text        not null,
  ip_hash     text,
  created_at  timestamptz not null default now(),
  primary key (email, package_id)
);

create index if not exists idx_analyzer_leads_created
  on public.analyzer_leads (created_at desc);

alter table public.analyzer_leads enable row level security;

comment on table public.analyzer_leads is
  'Email leads captured via the public analyzer PDF-report gate.';
