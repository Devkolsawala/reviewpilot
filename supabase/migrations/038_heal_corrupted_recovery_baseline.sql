-- 038_heal_corrupted_recovery_baseline.sql
--
-- Fixes the case where `original_rating` got corrupted to the post-edit
-- rating instead of the true pre-edit baseline.
--
-- Root cause (now patched in /api/reviews/fetch + cron poll-reviews):
--   1. /api/reviews/fetch never set original_rating on first insert — only
--      the cron path did. So a review first synced via Sync Now had
--      original_rating = NULL.
--   2. The reviewer edited their rating upward (e.g. 1★ → 5★) on the store.
--   3. The next sync overwrote `rating` with the post-edit value, but
--      original_rating remained NULL.
--   4. Migration 037 step 1 backfilled `SET original_rating = rating WHERE
--      original_rating IS NULL` — capturing the post-edit value as the
--      "baseline." The recovery climb signal was lost.
--   5. Recovery detection (`baseline <= 3 AND newRating >= 4`) now never
--      fires, so the review stays at recovery_status='monitoring' forever
--      even though the customer has visibly upgraded.
--
-- The reliable signal that a review was ORIGINALLY a complaint is
-- is_recoverable=true (AI's verdict during reply generation only flags 1-3★
-- reviews) OR linkage to an issue via review_issues (only ever inserted for
-- recoverable rows). For those rows we know original_rating MUST be in 1-3
-- — anything else is corruption from the above path.
--
-- Idempotent + additive. Safe to re-run.

-- ----------------------------------------------------------------------------
-- 1. Restore original_rating to a known-negative baseline for AI-flagged
--    complaints whose baseline is currently NULL or > 3 (i.e. corrupted).
--    We pick 1 (worst case) because the AI's recoverable classification only
--    runs on 1-3★ reviews — anything in that range works for recovery
--    detection. Using 1 is unambiguous and matches the conservative
--    interpretation: this customer was severely unhappy.
-- ----------------------------------------------------------------------------
UPDATE public.reviews
SET original_rating = 1
WHERE is_recoverable = true
  AND (original_rating IS NULL OR original_rating > 3);

-- Heal rows linked to any issue (active OR fixed) but not directly flagged
-- is_recoverable=true. Linkage in review_issues IS evidence the AI flagged
-- them at some point — the flag column itself might have been overwritten or
-- not set in older code paths.
UPDATE public.reviews
SET original_rating = 1
WHERE id IN (SELECT DISTINCT review_id FROM public.review_issues)
  AND (original_rating IS NULL OR original_rating > 3);

-- ----------------------------------------------------------------------------
-- 2. With baselines repaired, re-fire the recovery promotion. Any review at
--    recovery_status='monitoring' whose current rating is now 4+ should be
--    recovered. Mirrors the cron passive-recovery logic but as a one-shot
--    catch-up.
-- ----------------------------------------------------------------------------
UPDATE public.reviews
SET
  recovery_status = 'recovered',
  recovery_detected_at = COALESCE(recovery_detected_at, now())
WHERE recovery_status = 'monitoring'
  AND rating >= 4
  AND original_rating IS NOT NULL
  AND original_rating <= 3;
