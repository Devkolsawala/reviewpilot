-- ============================================================
-- Phase 2 helper: look up a profile's plan by email
-- Used by the invite API to block paid-plan invitees.
-- Requires SECURITY DEFINER to cross the auth schema boundary.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_profile_plan_by_email(email_arg text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT p.plan
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = email_arg
  LIMIT 1;
$$;
