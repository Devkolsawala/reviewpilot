-- Run this in the Supabase SQL Editor.
--
-- Adds reviewer_country to public.reviews, derived at ingest time from the
-- Play Store reviewerLanguage locale (e.g., en_US -> US). NULL means the
-- locale had no region component (e.g., bare "en" or "hi") or the source
-- doesn't carry locale info. Additive only — no destructive changes.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewer_country char(2);

-- Common filter path: scoped to a connection, narrowing by country.
CREATE INDEX IF NOT EXISTS idx_reviews_connection_country
  ON public.reviews(connection_id, reviewer_country)
  WHERE reviewer_country IS NOT NULL;

-- Partial index for the "Unknown" bucket on Play Store rows.
CREATE INDEX IF NOT EXISTS idx_reviews_connection_country_null
  ON public.reviews(connection_id)
  WHERE reviewer_country IS NULL AND source = 'play_store';

COMMENT ON COLUMN public.reviews.reviewer_country IS
  'ISO 3166-1 alpha-2 country code derived from reviewer_language locale region. NULL when locale has no region (e.g., bare "en" or "hi"). Proxy for reviewer geography — reflects device locale settings, not physical location.';
