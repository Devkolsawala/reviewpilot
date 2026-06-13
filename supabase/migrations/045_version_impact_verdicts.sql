-- 045_version_impact_verdicts.sql
-- Version Impact Analyzer — caches the ON-DEMAND AI "verdict" (plain-English
-- diagnosis) for a specific version pair of one connected app. The deterministic
-- per-version metrics + theme deltas are computed live from review data and are
-- NEVER stored here — only the (Growth/Agency-gated) AI verdict is cached.
--
-- ADDITIVE ONLY — creates one new table + its index + RLS. Does not modify or
-- drop any existing column, table, constraint, or policy. Nothing here touches
-- Razorpay, auth, cron, AI reply, WhatsApp, alerts, the digest pipeline, or the
-- review fetch/post/reply routes. This feature only READS review data.
--
-- Design notes (mirrors aso_analyses (041) + executive_summaries (044)):
--   * user_id stores the WORKSPACE OWNER's id (connections.user_id is always the
--     owner — see migration 009 team RLS). Pooling to the owner means the 7-day
--     cache is shared across the whole team and the unique key can safely exclude
--     user_id (a teammate re-requesting the same pair reuses the cached verdict).
--   * connection_id is a nullable FK to public.connections(id), ON DELETE SET
--     NULL so a cached verdict survives a connection removal for history.
--   * data_hash is a hash of the deterministic deltas the verdict was generated
--     from. When new reviews land and the deltas change, the hash changes and the
--     old cache row no longer matches — so the verdict auto-invalidates.
--   * Write path: service role only (the verdict route inserts via the admin
--     client). Read path: owner + team members via get_effective_owner_id (the
--     same team-read pattern as executive_summaries / alert_preferences).

CREATE TABLE IF NOT EXISTS public.version_impact_verdicts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.connections(id) ON DELETE SET NULL,
  -- The two version LABELS (app_version_name) being compared. version_a is the
  -- older release, version_b the newer one.
  version_a     text NOT NULL,
  version_b     text NOT NULL,
  -- Hash of the deterministic deltas fed to the model (see route). Cache busts
  -- automatically when underlying review data changes.
  data_hash     text NOT NULL,
  -- { verdict, diagnosis, action } — the validated/coerced model output.
  verdict       jsonb NOT NULL,
  model         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- One cached verdict per app + version pair + data snapshot. A re-run with the
  -- same data reuses it; new data (new hash) inserts a fresh row.
  UNIQUE (connection_id, version_a, version_b, data_hash)
);

ALTER TABLE public.version_impact_verdicts ENABLE ROW LEVEL SECURITY;

-- Team-read: any member of the workspace can read the owner's cached verdicts.
DROP POLICY IF EXISTS "Team can read version_impact_verdicts" ON public.version_impact_verdicts;
CREATE POLICY "Team can read version_impact_verdicts" ON public.version_impact_verdicts
  FOR SELECT USING (user_id = public.get_effective_owner_id(auth.uid()));

-- No INSERT/UPDATE/DELETE policies — writes go through the service role only.

-- 7-day cache lookup: latest verdict for an app + version pair.
CREATE INDEX IF NOT EXISTS idx_version_impact_verdicts_lookup
  ON public.version_impact_verdicts (connection_id, version_a, version_b, created_at DESC);

COMMENT ON TABLE public.version_impact_verdicts IS
  'Cached AI verdicts for the Version Impact Analyzer (Growth/Agency feature). One row per workspace owner + connection + version pair + data snapshot. Deterministic metrics are computed live and never stored here. 7-day TTL + data_hash invalidation.';
COMMENT ON COLUMN public.version_impact_verdicts.user_id IS
  'Always the workspace OWNER id (connections.user_id), so the cache is pooled across the team.';
COMMENT ON COLUMN public.version_impact_verdicts.data_hash IS
  'Hash of the deterministic deltas the verdict was generated from; changes when review data changes, auto-invalidating the cache.';
COMMENT ON COLUMN public.version_impact_verdicts.verdict IS
  'Validated model output: { verdict: string, diagnosis: string, action: string|null }.';
