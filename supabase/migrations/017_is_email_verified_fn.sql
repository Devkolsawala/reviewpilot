-- ============================================================
-- Migration 017: is_email_verified() helper
-- ============================================================
-- PURPOSE:
--   Lets the "/api/auth/check-verified" route tell the signup
--   page whether a given email has been confirmed. Needed for
--   the case where the user clicks the confirmation link in a
--   DIFFERENT browser / profile / device from the one they
--   signed up on — Supabase's client-side onAuthStateChange
--   does not propagate across browser contexts, so we fall
--   back to polling this function server-side.
--
-- SECURITY:
--   Returns a boolean only. Does not expose any PII beyond the
--   fact that a given email is or is not confirmed, which is
--   already inferable from the signup flow itself. Granted to
--   anon + authenticated so the signup page (unauthenticated)
--   can call it via RPC. Uses SECURITY DEFINER to cross the
--   auth schema boundary, mirroring get_profile_plan_by_email
--   (migration 010).
--
-- SAFE to run multiple times (CREATE OR REPLACE).
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_email_verified(email_arg text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (
      SELECT email_confirmed_at IS NOT NULL
      FROM auth.users
      WHERE email = email_arg
      LIMIT 1
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_email_verified(text) TO anon, authenticated;
