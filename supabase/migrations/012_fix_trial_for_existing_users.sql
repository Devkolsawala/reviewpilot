-- Run in Supabase SQL Editor: Settings → SQL Editor → New query
--
-- BUG FIX: Set trial_ends_at for existing free users who don't have it set.
-- Migration 008 should have populated this, but users who signed up before
-- that migration was run (or on a DB that skipped it) have NULL trial_ends_at,
-- which causes the trial banner to never appear.
--
-- Strategy: give each affected user 7 days from NOW so they get a full trial
-- window rather than getting immediately expired from a past created_at date.
UPDATE public.profiles
SET trial_ends_at = GREATEST(
  created_at + interval '7 days',
  now() + interval '7 days'
)
WHERE plan = 'free'
  AND trial_ends_at IS NULL;
