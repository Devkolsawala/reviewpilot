-- Run in Supabase SQL Editor: Settings → SQL Editor → New query
--
-- CRITICAL BUG FIX: trial_ends_at keeps ending up NULL for new signups because
-- earlier migrations (002_fix_profiles_trigger, 003_ensure_profiles_trigger)
-- redefined handle_new_user WITHOUT the trial_ends_at column. If those were
-- (re)run after 008_add_trial, new profiles get NULL trial_ends_at.
--
-- This migration is BULLETPROOF:
--   1. Adds DEFAULT values at the column level so even a bare INSERT or upsert
--      with only `id` set gets a valid trial_ends_at + usage_period_start.
--   2. Backfills every existing row with a NULL trial_ends_at / usage_period_start.
--   3. Drops and recreates the handle_new_user trigger function with the
--      correct body — this is the authoritative definition, superseding
--      migrations 001/002/003/008/013.
--   4. Re-attaches the trigger to auth.users (idempotent).

-- ── 1. Column defaults ────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '7 days');

ALTER TABLE public.profiles
  ALTER COLUMN usage_period_start SET DEFAULT now();

-- ── 2. Backfill existing rows ─────────────────────────────────────────────────
UPDATE public.profiles
SET trial_ends_at = GREATEST(
  created_at + interval '7 days',
  now() + interval '7 days'
)
WHERE trial_ends_at IS NULL
  AND plan = 'free';

UPDATE public.profiles
SET usage_period_start = COALESCE(created_at, now())
WHERE usage_period_start IS NULL;

-- ── 3. Recreate the signup trigger (authoritative definition) ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    plan,
    trial_ends_at,
    usage_period_start
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'free',
    now() + interval '7 days',
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET trial_ends_at = COALESCE(public.profiles.trial_ends_at, EXCLUDED.trial_ends_at),
        usage_period_start = COALESCE(public.profiles.usage_period_start, EXCLUDED.usage_period_start);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Ensure the trigger is attached (idempotent) ────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
