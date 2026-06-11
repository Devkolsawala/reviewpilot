-- 041_aso_analyses.sql
-- ASO Analysis (paid feature) — stores one review-powered App Store
-- Optimization audit per run. Each row is an immutable snapshot of a listing
-- audit + the AI-generated recommendations for one user + package.
--
-- ADDITIVE ONLY — creates one new table + its indexes + RLS. Does not modify
-- or drop any existing column, table, constraint, or policy. Nothing here
-- touches Razorpay, auth, cron, AI reply, Recovery, or Issue Tracker tables.
--
-- Design notes:
--   * user_id references public.profiles(id) (NOT auth.users directly) to match
--     every other per-user table in this schema (connections, usage, issues).
--     profiles.id is itself a FK to auth.users, so the ownership chain is the
--     same; this keeps the RLS pattern identical to the existing tables.
--   * app_id is a nullable FK to public.connections(id) — the user's connected
--     app row. It is ON DELETE SET NULL so a past analysis is preserved for
--     history even if the user later removes the connection. package_name is
--     the durable identifier and is always stored.

CREATE TABLE IF NOT EXISTS public.aso_analyses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id           uuid REFERENCES public.connections(id) ON DELETE SET NULL,
  package_name     text NOT NULL,
  -- title, short_desc, long_desc, rating, installs, category, screenshot_count
  listing_snapshot jsonb NOT NULL,
  aso_score        int  NOT NULL CHECK (aso_score >= 0 AND aso_score <= 100),
  -- per-factor sub-scores + status chips (title / short / long / rating / assets)
  score_breakdown  jsonb NOT NULL,
  -- ai-generated rewrites + keyword_gaps
  recommendations  jsonb NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aso_analyses ENABLE ROW LEVEL SECURITY;

-- Users may read and create only their own analyses. No UPDATE/DELETE policy:
-- analyses are immutable history (a "re-run" inserts a new row). The analyze
-- route runs server-side and may use the service-role client (which bypasses
-- RLS); these policies guarantee correctness even for direct user-key access.
DROP POLICY IF EXISTS "Users can view own aso_analyses" ON public.aso_analyses;
CREATE POLICY "Users can view own aso_analyses" ON public.aso_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own aso_analyses" ON public.aso_analyses;
CREATE POLICY "Users can insert own aso_analyses" ON public.aso_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7-day cache lookup: latest analysis for this user + package.
CREATE INDEX IF NOT EXISTS idx_aso_analyses_user_package_created
  ON public.aso_analyses (user_id, package_name, created_at DESC);

COMMENT ON TABLE public.aso_analyses IS
  'Review-powered ASO audits (Growth/Agency feature). One immutable row per analysis run for a user + package. 7-day cache keyed on (user_id, package_name).';
COMMENT ON COLUMN public.aso_analyses.app_id IS
  'Nullable FK to connections(id); SET NULL on connection delete so history survives. package_name is the durable key.';
COMMENT ON COLUMN public.aso_analyses.listing_snapshot IS
  'Live Play Store listing at analysis time: { title, short_description, long_description, rating, installs, category, screenshot_count }.';
COMMENT ON COLUMN public.aso_analyses.score_breakdown IS
  'Per-factor audit: { title, short_desc, long_desc, rating, assets } each { score, max, status, detail }.';
COMMENT ON COLUMN public.aso_analyses.recommendations IS
  'AI output (post-validated): { title, short_description, long_description[], whats_new, keyword_gaps[] }.';
