-- 023_digest_logs_test_flag.sql
-- Adds an is_test flag so test sends can coexist with real sends in the same
-- period without colliding on the (user_id, digest_type, period_start) unique
-- index. Also widens the status CHECK to include statuses we now log.

-- ────────────────────────────────────────────────────────────────────────────
-- digest_logs.is_test column
-- ────────────────────────────────────────────────────────────────────────────
alter table public.digest_logs
  add column if not exists is_test boolean default false;

-- Drop the old unique index and recreate it scoped to non-test rows only.
drop index if exists public.digest_logs_dedupe_idx;

create unique index if not exists digest_logs_dedupe_idx
  on public.digest_logs (user_id, digest_type, period_start)
  where is_test = false;

create index if not exists digest_logs_user_recent_idx
  on public.digest_logs (user_id, created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- Widen status CHECK so additional outcomes (disabled, no_recipient) can be
-- recorded. We drop the old check and add a more permissive one.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.digest_logs
  drop constraint if exists digest_logs_status_check;

alter table public.digest_logs
  add constraint digest_logs_status_check
  check (status in (
    'sent',
    'failed',
    'skipped_no_activity',
    'skipped_unsubscribed',
    'disabled',
    'no_recipient'
  ));

-- ────────────────────────────────────────────────────────────────────────────
-- Backfill missing unsubscribe_token values on digest_preferences.
-- Safe no-op when every row already has a token.
-- ────────────────────────────────────────────────────────────────────────────
update public.digest_preferences
   set unsubscribe_token = encode(gen_random_bytes(24), 'hex')
 where unsubscribe_token is null;
