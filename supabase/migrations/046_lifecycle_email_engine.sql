-- 046_lifecycle_email_engine.sql
-- Foundation for the lifecycle / nurture email engine (Phase 1).
--
-- Audiences (Phase 2+): analyzer_leads + FREE-plan users. ASO is DEFERRED
-- (no capture surface yet) but 'aso_lead' is pre-listed in the audience CHECK
-- so wiring it in later needs NO ALTER.
--
-- ADDITIVE ONLY — three brand-new tables + their indexes + RLS. Nothing here
-- modifies, drops, or re-types any existing column/table/constraint/policy.
-- Touches NOTHING in Razorpay, auth, RLS on existing tables, the digest/poll
-- cron, the Inbox, Issue Tracker, Recovery, Sentiment, Version Impact, the
-- analyzer tool, or /insights.
--
-- Isolation pattern matches the analyzer tables (public_app_analyses,
-- analyzer_leads): RLS ENABLED with NO policies, so the anon/auth keys can
-- never reach these rows. All access is server-side via the service-role
-- admin client (which bypasses RLS).
--
-- Run MANUALLY in the Supabase SQL Editor. Do not run via CLI.

-- ────────────────────────────────────────────────────────────────────────────
-- 1. lifecycle_enrollments
--    One row per (email, sequence_key). Tracks where each person is in a
--    sequence and when their next step is due. user_id is nullable because
--    lead audiences have no account.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.lifecycle_enrollments (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  -- Nullable: analyzer/aso leads have no profile. SET NULL (not CASCADE) so an
  -- enrollment survives profile deletion for audit; the email is the durable key.
  user_id       uuid references public.profiles(id) on delete set null,
  audience      text not null
                  check (audience in ('analyzer_lead', 'free_user', 'aso_lead')),
  sequence_key  text not null,
  current_step  int  not null default 0,
  next_send_at  timestamptz,
  status        text not null default 'active'
                  check (status in ('active','completed','unsubscribed','suppressed','converted')),
  enrolled_at   timestamptz not null default now(),
  last_sent_at  timestamptz,
  -- Dedup guarantee: an email is enrolled in a given sequence at most once.
  unique (email, sequence_key)
);

-- Due-selection: "active enrollments whose next step is due".
create index if not exists idx_lifecycle_enrollments_due
  on public.lifecycle_enrollments (status, next_send_at);

-- Cross-audience dedup lookups by email (free-user sequence wins over leads).
create index if not exists idx_lifecycle_enrollments_email
  on public.lifecycle_enrollments (email);

alter table public.lifecycle_enrollments enable row level security;

comment on table public.lifecycle_enrollments is
  'Lifecycle/nurture sequence enrollments. Service-role only (RLS on, no policies). Unique (email, sequence_key).';
comment on column public.lifecycle_enrollments.audience is
  'analyzer_lead | free_user | aso_lead (aso reserved/deferred — no capture surface yet).';
comment on column public.lifecycle_enrollments.status is
  'active | completed | unsubscribed | suppressed | converted (converted = now an active paid customer).';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. lifecycle_sends
--    Append-only send log enforcing send-once idempotency. One SUCCESSFUL (or
--    in-flight) send per (enrollment, step) — equivalent to (email, sequence,
--    step) since (email, sequence_key) is unique on the enrollment.
--
--    The unique index is PARTIAL (excludes 'failed') so a genuinely failed
--    attempt can be retried on a later cron run, while a 'pending'/'sent' row
--    blocks any duplicate. This makes cron re-runs safe to re-execute.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.lifecycle_sends (
  id                 uuid primary key default gen_random_uuid(),
  enrollment_id      uuid not null references public.lifecycle_enrollments(id) on delete cascade,
  sequence_key       text not null,
  step               int  not null,
  status             text not null default 'pending'
                       check (status in ('pending','sent','failed','skipped')),
  resend_message_id  text,
  sent_at            timestamptz,
  created_at         timestamptz not null default now()
);

-- Send-once: at most one non-failed row per (enrollment, step). A 'failed' row
-- is excluded so the step can be retried; 'pending'/'sent' block duplicates.
create unique index if not exists uq_lifecycle_sends_once
  on public.lifecycle_sends (enrollment_id, step)
  where status <> 'failed';

create index if not exists idx_lifecycle_sends_enrollment
  on public.lifecycle_sends (enrollment_id, created_at desc);

alter table public.lifecycle_sends enable row level security;

comment on table public.lifecycle_sends is
  'Per-step send log + send-once idempotency for lifecycle emails. Service-role only (RLS on, no policies).';
comment on index public.uq_lifecycle_sends_once is
  'Send-once guarantee: one pending/sent row per (enrollment, step); failed rows excluded so retries are allowed.';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. email_suppression
--    Global, email-keyed block list checked before EVERY lifecycle send.
--    Reasons: unsubscribe | bounce | complaint | paid | manual.
--    (This is separate from the digest's user-keyed email_unsubscribes; the
--    send wrapper also honors email_unsubscribes list='all' for logged-in users.)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_suppression (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  reason      text not null
                check (reason in ('unsubscribe','bounce','complaint','paid','manual')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_email_suppression_email
  on public.email_suppression (email);

alter table public.email_suppression enable row level security;

comment on table public.email_suppression is
  'Global email block list for lifecycle sends (unsubscribe|bounce|complaint|paid|manual). Unique (email). Service-role only (RLS on, no policies).';
