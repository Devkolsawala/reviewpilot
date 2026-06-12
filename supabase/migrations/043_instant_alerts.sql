-- 043_instant_alerts.sql
-- AI-verified instant negative-review alerts + in-app notification feed.
--
-- Adds:
--   1. alert_preferences  — per-workspace opt-in + thresholds for instant alerts
--   2. notifications      — in-app feed rows (TopBar bell)
--   3. reviews.alerted_at — idempotency stamp: a review alerts AT MOST once, ever
--   4. 'alerts' as a new allowed value on email_unsubscribes.list
--
-- Additive only — no existing column is altered or dropped. The only touch on
-- an existing table beyond new columns is widening the email_unsubscribes.list
-- CHECK constraint with one new allowed value ('alerts'); every previously
-- valid row remains valid.

-- ────────────────────────────────────────────────────────────────────────────
-- alert_preferences
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.alert_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default false,
  -- Alert when rating <= min_rating AND the AI confirmed negative sentiment.
  min_rating int not null default 2 check (min_rating between 1 and 3),
  -- Optional user keywords (refund, scam, legal…) — case-insensitive,
  -- word-boundary matched against review text.
  keywords text[] not null default '{}'::text[],
  -- Max alert EMAILS per UTC day. Bell notifications are never capped.
  daily_cap int not null default 5 check (daily_cap between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.alert_preferences enable row level security;

-- Owner + team members can read (same get_effective_owner_id pattern as
-- migration 009). Writes go through the service role only — the preferences
-- API uses the admin client after an explicit owner/admin role check.
drop policy if exists "Team can read alert preferences" on public.alert_preferences;
create policy "Team can read alert preferences" on public.alert_preferences
  for select using (user_id = public.get_effective_owner_id(auth.uid()));

drop trigger if exists alert_prefs_updated_at on public.alert_preferences;
create trigger alert_prefs_updated_at
  before update on public.alert_preferences
  for each row execute function public.touch_digest_prefs_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- notifications (in-app feed)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  -- Always the WORKSPACE OWNER's id (connections.user_id) so the whole team
  -- sees one shared feed via the RLS policy below.
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'negative_review', 'recovery', 'issue_created',
    'sync_failure', 'quota_warning', 'digest_sent'
  )),
  title text not null,
  body text,
  href text,                                -- deep link into the dashboard
  review_id uuid references public.reviews(id) on delete set null,
  -- True when this notification ALSO produced an alert email. Used to count
  -- today's sends against alert_preferences.daily_cap.
  email_sent boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_recent_idx
  on public.notifications (user_id, created_at desc);

-- Unread badge count — partial index keeps the 60s poll cheap.
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Team can read notifications" on public.notifications;
create policy "Team can read notifications" on public.notifications
  for select using (user_id = public.get_effective_owner_id(auth.uid()));

-- Writes (insert from cron, read_at updates from mark-read) go through the
-- service role only — no insert/update policies on purpose.

-- ────────────────────────────────────────────────────────────────────────────
-- reviews.alerted_at — the idempotency gate
-- ────────────────────────────────────────────────────────────────────────────
-- Set exactly once via UPDATE … WHERE alerted_at IS NULL. Survives cron
-- retries, review edits, and re-syncs: once stamped, the review can never
-- alert again.
alter table public.reviews
  add column if not exists alerted_at timestamptz;

comment on column public.reviews.alerted_at is
  'Set once by the instant-alert pass when this review triggered an alert. Never cleared — a review alerts at most once, ever.';

-- ────────────────────────────────────────────────────────────────────────────
-- email_unsubscribes: allow list='alerts'
-- ────────────────────────────────────────────────────────────────────────────
-- Widens the allowed value set with one new entry. All existing rows
-- ('digest'|'campaigns'|'all') remain valid; digest behavior is unchanged.
alter table public.email_unsubscribes
  drop constraint if exists email_unsubscribes_list_check;
alter table public.email_unsubscribes
  add constraint email_unsubscribes_list_check
  check (list in ('digest', 'campaigns', 'all', 'alerts'));
