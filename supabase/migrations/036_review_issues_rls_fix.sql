-- 036_review_issues_rls_fix.sql
--
-- Fix two bugs from migration 034:
--
-- 1. review_issues has RLS enabled with a SELECT policy but NO INSERT policy.
--    Every call to linkRecoverableReview from a user-session client logs:
--      "new row violates row-level security policy for table review_issues"
--    The issues table's count was still bumped (different table, has INSERT
--    policy), so the UI shows "N reviews" on an issue row but the drill-down
--    finds zero — because no review_issues row was ever inserted.
--
-- 2. Existing issue rows have inflated/stale review_count and avg_rating from
--    runs that happened before this fix. We recompute both from the (now
--    correctly populated) link table once the backfill completes.
--
-- Additive + idempotent — safe to re-run.

-- ----------------------------------------------------------------------------
-- 1. Add the missing INSERT policy
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own review_issues" ON public.review_issues;
CREATE POLICY "Users can insert own review_issues" ON public.review_issues
  FOR INSERT WITH CHECK (
    issue_id IN (SELECT id FROM public.issues WHERE user_id = auth.uid())
  );

-- Also add DELETE (not currently used but completes the policy set, so users
-- could unlink in the future without touching RLS again).
DROP POLICY IF EXISTS "Users can delete own review_issues" ON public.review_issues;
CREATE POLICY "Users can delete own review_issues" ON public.review_issues
  FOR DELETE USING (
    issue_id IN (SELECT id FROM public.issues WHERE user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 2. Backfill missing review_issues join rows for already-classified reviews
-- ----------------------------------------------------------------------------
-- For each (recoverable review with a label), find the issue on the same
-- connection whose label matches via:
--   (a) exact case-insensitive match, OR
--   (b) substring containment in either direction (mirrors the JS clustering
--       in src/lib/reviews/issues.ts well enough for backfill purposes).
-- DISTINCT ON ensures one link per review; prefer the SHORTEST matching issue
-- label as the canonical cluster (matches the JS code which uses the first
-- existing issue it finds — which tends to have the original, shorter label).
--
-- Runs as service-role (migrations bypass RLS), so the new INSERT policy
-- doesn't gate this.
INSERT INTO public.review_issues (review_id, issue_id)
SELECT DISTINCT ON (r.id) r.id, i.id
FROM public.reviews r
JOIN public.connections c ON c.id = r.connection_id
JOIN public.issues i
  ON i.connection_id = r.connection_id
  AND i.user_id = c.user_id
WHERE r.is_recoverable = true
  AND r.issue_label IS NOT NULL
  AND TRIM(r.issue_label) <> ''
  AND (
    LOWER(TRIM(r.issue_label)) = LOWER(TRIM(i.label))
    OR LOWER(TRIM(r.issue_label)) LIKE '%' || LOWER(TRIM(i.label)) || '%'
    OR LOWER(TRIM(i.label)) LIKE '%' || LOWER(TRIM(r.issue_label)) || '%'
  )
ORDER BY r.id, LENGTH(i.label) ASC, i.first_seen_at ASC
ON CONFLICT (review_id, issue_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Recompute review_count and avg_rating from the link table
-- ----------------------------------------------------------------------------
-- This corrects any drift introduced by the pre-fix code, where count was
-- bumped even when the link insert silently failed.
UPDATE public.issues i
SET
  review_count = COALESCE(sub.cnt, 0),
  avg_rating = sub.avg,
  updated_at = now()
FROM (
  SELECT
    ri.issue_id,
    COUNT(*)::int AS cnt,
    ROUND(AVG(r.rating)::numeric, 1) AS avg
  FROM public.review_issues ri
  JOIN public.reviews r ON r.id = ri.review_id
  GROUP BY ri.issue_id
) sub
WHERE i.id = sub.issue_id;

-- Any issue row with zero linked reviews (orphan from broken inserts) gets
-- zeroed out rather than left stale. UI hides 0-review issues anyway.
UPDATE public.issues i
SET review_count = 0, avg_rating = NULL, updated_at = now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.review_issues ri WHERE ri.issue_id = i.id
);
