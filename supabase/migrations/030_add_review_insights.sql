-- 030_add_review_insights.sql
-- Adds AI insights columns to the reviews table for the Theme Map and
-- Critical Issues features on /dashboard/analytics. Additive only — does
-- not modify any existing columns or constraints.
--
-- These columns are independent of the existing `sentiment` column (which is
-- the deterministic keyword-based label produced by src/lib/ai/sentiment.ts).
-- ai_sentiment is the AI-assigned label produced by classifyReviewInsights
-- and may diverge from `sentiment` for mixed or code-mixed (Hinglish) text.

alter table public.reviews
  add column if not exists ai_theme text,
  add column if not exists ai_emotion text,
  add column if not exists ai_urgency text,
  add column if not exists ai_sentiment text,
  add column if not exists ai_insights_classified_at timestamptz;

-- Theme Map aggregation query filters by connection_id (user scope) + ai_theme.
create index if not exists reviews_ai_theme_idx
  on public.reviews (connection_id, ai_theme)
  where ai_theme is not null;

-- Critical Issues card pulls last 7d critical reviews per connection.
create index if not exists reviews_ai_urgency_critical_idx
  on public.reviews (connection_id, created_at desc)
  where ai_urgency = 'critical';

-- Backfill / cron classifier finds unclassified reviews.
create index if not exists reviews_insights_pending_idx
  on public.reviews (created_at desc)
  where ai_insights_classified_at is null;

comment on column public.reviews.ai_theme is '2-4 word lowercase theme like "camera crashes" or "great support". Null until classified.';
comment on column public.reviews.ai_emotion is 'frustrated | angry | disappointed | satisfied | delighted | confused | hopeful | neutral';
comment on column public.reviews.ai_urgency is 'low | medium | high | critical';
comment on column public.reviews.ai_sentiment is 'positive | neutral | negative — AI-assigned, may differ from the deterministic `sentiment` column';
comment on column public.reviews.ai_insights_classified_at is 'Set by /api/internal/classify-insights when AI fields are populated (or set with safe defaults on classification failure to prevent infinite retry).';
