-- ============================================================
-- Migration 016: Confirm existing unverified users
-- ============================================================
-- PURPOSE:
--   When you enable "Confirm email" in the Supabase dashboard,
--   any existing auth.users row with email_confirmed_at = NULL
--   will be locked out — they can no longer sign in.
--   This migration marks all such users as confirmed so existing
--   accounts continue to work after the setting is turned on.
--
-- SAFE to run multiple times (WHERE clause is a no-op if already run).
-- Does NOT change any public schema data or user IDs.
-- Does NOT affect Google OAuth users (they are already confirmed).
--
-- HOW TO RUN:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file and click Run
--   3. Then go to Authentication → Email → enable "Confirm email"
--      (do this AFTER running the migration, not before)
-- ============================================================

UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, created_at),
  updated_at         = now()
WHERE email_confirmed_at IS NULL;
