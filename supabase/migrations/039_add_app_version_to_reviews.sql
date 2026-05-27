-- 039_add_app_version_to_reviews.sql
--
-- RUN THIS MIGRATION MANUALLY in Supabase SQL Editor before deploying code
-- that reads these columns. Safe to run multiple times (uses IF NOT EXISTS).
--
-- Adds app version columns to reviews (sourced from Play Store API
-- userComment.appVersionName / userComment.appVersionCode). Both may be NULL
-- per Google's official docs — these fields "may be absent" for some reviews
-- (very old reviews, web reviews, certain device configurations). NULL =
-- "Unknown" bucket in the inbox UI.
--
-- Only populated for source = 'play_store'. Other sources (whatsapp,
-- google_business) will always be NULL — there is no equivalent concept.
--
-- Sorting note: we store appVersionCode (integer) alongside appVersionName
-- (string) specifically so the inbox dropdown can sort by code DESC. A
-- lexicographic sort of appVersionName breaks for double-digit segments —
-- e.g. "1.10.0" would appear BEFORE "1.9.0" lexicographically even though
-- 1.10.0 is the newer build. appVersionCode is a monotonically increasing
-- integer Google guarantees increases with each new app build.
--
-- Additive only — no destructive changes.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS app_version_name text,
  ADD COLUMN IF NOT EXISTS app_version_code integer;

-- Composite index optimized for the common filter query: by connection +
-- version name. Partial because non-play_store rows are always NULL here.
CREATE INDEX IF NOT EXISTS idx_reviews_connection_app_version_name
  ON public.reviews(connection_id, app_version_name)
  WHERE app_version_name IS NOT NULL;

-- Partial index for the "Unknown" bucket: play_store rows with NULL version.
-- Mirrors the pattern used by idx_reviews_connection_country_null in 026.
CREATE INDEX IF NOT EXISTS idx_reviews_connection_app_version_null
  ON public.reviews(connection_id)
  WHERE app_version_name IS NULL AND source = 'play_store';

-- Index to support efficient sorting by version code (newest builds first
-- in the dropdown). Partial since NULL codes are not sorted.
CREATE INDEX IF NOT EXISTS idx_reviews_app_version_code
  ON public.reviews(connection_id, app_version_code DESC)
  WHERE app_version_code IS NOT NULL;

COMMENT ON COLUMN public.reviews.app_version_name IS
  'String app version as installed at the time the review was written (e.g., "1.2.3"). Sourced from Play Store API userComment.appVersionName. NULL when API did not return version (per Google docs, may be absent for old reviews, web reviews, or certain device configurations). Only populated for source = play_store.';

COMMENT ON COLUMN public.reviews.app_version_code IS
  'Integer app version code as installed at the time the review was written (e.g., 12345). Sourced from Play Store API userComment.appVersionCode. Used for correct numeric sorting of versions in the inbox dropdown (lexicographic sort of appVersionName breaks for double-digit segments like 1.10.0 vs 1.9.0). NULL when API did not return version.';
