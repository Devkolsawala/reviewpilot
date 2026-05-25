  -- 037_review_edits_and_recovery_backfill.sql
  --
  -- Three fixes from the in-app QA pass:
  --
  -- 1. Recovery Rate dashboard card stayed at "Not enough data yet" even after
  --    a 1★ review was edited to 5★, because the qualifying rows had
  --    original_rating IS NULL. Migration 034 added the column nullable with no
  --    default, so rows inserted before 034 (or via paths that didn't set it)
  --    are invisible to /api/dashboard/recovery-rate (which filters
  --    original_rating <= 3 — NULL comparisons fail). Backfilled below from
  --    current rating, which is the closest available baseline.
  --
  -- 2. Some clustered reviews ended up at recovery_status='none' (e.g. when the
  --    pre-fix linkRecoverableReview short-circuited on RLS). Re-set to
  --    'monitoring' for any review still linked to an active issue with
  --    original_rating <= 3, so recovery detection fires next sync.
  --
  -- 3. Reviews whose user edited the rating on the store side had stale
  --    sentiment (1★ original → 'negative' → user re-rated to 5★ → still
  --    'negative' tag in the UI). Realigned sentiment to rating-derived value
  --    where it disagrees. 'mixed' is preserved (set by other paths).
  --
  -- Also adds `edited_at` column so the cron can mark reviews modified by the
  -- end user on the store side, and the UI can show an "Edited" badge.
  --
  -- Additive + idempotent. Safe to re-run.

  -- ----------------------------------------------------------------------------
  -- 0. New column: edited_at — set by the cron when it detects review text or
  --    rating differs from what we have on file.
  -- ----------------------------------------------------------------------------
  ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS edited_at timestamptz;

  COMMENT ON COLUMN public.reviews.edited_at IS
    'Set by the poll-reviews cron when the upstream store returns this review with text or rating different from what we previously stored. Used to surface an "Edited" badge in the UI and to differentiate the current state from the original 1-3★ baseline.';

  -- ----------------------------------------------------------------------------
  -- 1. Backfill original_rating for rows where it was never captured.
  --    Sets baseline = current rating, which is the best we can do for rows
  --    that pre-date the column.
  -- ----------------------------------------------------------------------------
  UPDATE public.reviews
  SET original_rating = rating
  WHERE original_rating IS NULL
    AND rating IS NOT NULL;

  -- ----------------------------------------------------------------------------
  -- 2. Reviews that ARE clustered into an active issue with a negative baseline
  --    should be in recovery_status='monitoring'. Heal any that aren't.
  -- ----------------------------------------------------------------------------
  UPDATE public.reviews r
  SET recovery_status = 'monitoring'
  FROM public.review_issues ri
  JOIN public.issues i ON i.id = ri.issue_id AND i.status = 'active'
  WHERE r.id = ri.review_id
    AND r.recovery_status = 'none'
    AND r.original_rating IS NOT NULL
    AND r.original_rating <= 3;

  -- ----------------------------------------------------------------------------
  -- 3. Realign sentiment to rating-derived value where they disagree.
  --    Preserves 'mixed' (set by paths other than the rating-based default).
  -- ----------------------------------------------------------------------------
  UPDATE public.reviews
  SET sentiment = CASE
    WHEN rating >= 4 THEN 'positive'
    WHEN rating <= 2 THEN 'negative'
    ELSE 'neutral'
  END
  WHERE rating IS NOT NULL
    AND sentiment IS NOT NULL
    AND sentiment IN ('positive', 'negative', 'neutral')
    AND (
      (rating >= 4 AND sentiment <> 'positive') OR
      (rating <= 2 AND sentiment <> 'negative') OR
      (rating = 3 AND sentiment <> 'neutral')
    );

  -- ----------------------------------------------------------------------------
  -- 4. If a backfilled review (step 2) is ALREADY at rating >= 4 right now,
  --    promote it straight to 'recovered' — we missed the transition because
  --    recovery_status wasn't 'monitoring' when the cron ran.
  -- ----------------------------------------------------------------------------
  UPDATE public.reviews
  SET
    recovery_status = 'recovered',
    recovery_detected_at = COALESCE(recovery_detected_at, now())
  WHERE recovery_status = 'monitoring'
    AND rating >= 4
    AND original_rating IS NOT NULL
    AND original_rating <= 3;
