-- 035_classification_marker.sql
--
-- Adds `classification_at` to reviews so the Active Issues engine can
-- distinguish "not yet classified" from "classified as not recoverable".
--
-- Why: migration 034 defaults `is_recoverable` to false. After classification,
-- a non-recoverable review still ends up at is_recoverable=false / issue_label=null
-- — indistinguishable from a fresh, un-classified review. The cron classifier
-- needs a definitive marker so it doesn't re-spend AI tokens on the same row
-- every run.
--
-- Additive only — no existing column or constraint is modified.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS classification_at timestamptz;

-- Partial index: only the rows the classifier ever scans.
-- Negative reviews still needing classification.
CREATE INDEX IF NOT EXISTS idx_reviews_unclassified_negative
  ON public.reviews(connection_id, review_created_at DESC)
  WHERE classification_at IS NULL AND rating <= 3;

COMMENT ON COLUMN public.reviews.classification_at IS
  'Timestamp when the recovery/issue classifier last ran on this row. NULL = never classified — picked up by the poll-reviews cron classifier pass. Independent of reply state so manual-mode users still get issue detection.';
