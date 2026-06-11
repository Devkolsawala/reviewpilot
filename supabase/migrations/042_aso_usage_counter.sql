-- 042_aso_usage_counter.sql
-- Adds the per-period usage counter for the ASO Analysis feature so it can be
-- metered exactly like ai_replies_used / sms_sent on the existing `usage` table.
--
-- ADDITIVE ONLY — one new column with a safe default. Does not modify or drop
-- any existing column. The existing ai-reply / sms / reviews counters and the
-- (user_id, period_key) rolling-period model are untouched.

ALTER TABLE public.usage
  ADD COLUMN IF NOT EXISTS aso_analyses_used int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.usage.aso_analyses_used IS
  'Count of ASO analyses run in the current rolling usage period. Metered for Growth/Agency plans; mirrors ai_replies_used.';
