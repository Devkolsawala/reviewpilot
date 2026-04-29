-- 022_daily_digest.sql
-- Daily/weekly digest email feature.
-- Adds:
--   1. digest_preferences  — per-user opt-in + delivery prefs
--   2. digest_logs         — idempotency + audit trail for sends
--   3. email_unsubscribes  — list-scoped opt-outs (digest, campaigns, all)

-- ────────────────────────────────────────────────────────────────────────────
-- email_unsubscribes (does not yet exist in this project)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  email text,                              -- captured for safety even if user_id is null
  list text not null check (list in ('digest', 'campaigns', 'all')),
  token text unique,                       -- the value embedded in /u/<token> links
  created_at timestamptz default now()
);

create unique index if not exists email_unsubscribes_user_list_idx
  on public.email_unsubscribes (user_id, list)
  where user_id is not null;

create index if not exists email_unsubscribes_email_list_idx
  on public.email_unsubscribes (email, list);

alter table public.email_unsubscribes enable row level security;

create policy "users read own unsubscribes"
  on public.email_unsubscribes for select
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- digest_preferences
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.digest_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  daily_enabled boolean default false,
  weekly_enabled boolean default false,
  daily_send_hour smallint default 20 check (daily_send_hour between 0 and 23),
  weekly_send_dow smallint default 1 check (weekly_send_dow between 0 and 6), -- 0=Sun, 1=Mon
  weekly_send_hour smallint default 9 check (weekly_send_hour between 0 and 23),
  timezone text default 'Asia/Kolkata',
  recipient_email text,                    -- defaults to profile email if null
  cc_emails text[] default '{}'::text[],
  skip_if_no_activity boolean default true,
  include_lowest_rated boolean default true,
  include_top_keywords boolean default true,
  include_quota_usage boolean default true,
  unsubscribe_token text unique,           -- stable token used in /u/<token> links
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- digest_logs (idempotency + audit)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.digest_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  digest_type text not null check (digest_type in ('daily', 'weekly')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null check (status in ('sent', 'skipped_no_activity', 'skipped_unsubscribed', 'failed')),
  recipient_email text,
  cc_emails text[],
  payload jsonb,
  resend_message_id text,
  error_message text,
  created_at timestamptz default now()
);

create unique index if not exists digest_logs_dedupe_idx
  on public.digest_logs (user_id, digest_type, period_start);

create index if not exists digest_logs_user_recent_idx
  on public.digest_logs (user_id, created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- RLS for new digest tables
-- ────────────────────────────────────────────────────────────────────────────
alter table public.digest_preferences enable row level security;
alter table public.digest_logs enable row level security;

create policy "users manage own digest prefs"
  on public.digest_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own digest logs"
  on public.digest_logs for select
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- updated_at trigger
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.touch_digest_prefs_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists digest_prefs_updated_at on public.digest_preferences;
create trigger digest_prefs_updated_at
  before update on public.digest_preferences
  for each row execute function public.touch_digest_prefs_updated_at();
