-- 031_add_review_aspects.sql
-- Aspect-Based Sentiment Analysis: store entity-level sentiment per review.
-- Shape: { "food": "positive", "service": "negative", "ambience": "neutral", ... }
-- Only aspects mentioned in the review are included; missing aspects mean "not mentioned".
--
-- Additive only — does not modify existing columns or constraints.

alter table public.reviews
  add column if not exists ai_aspects jsonb,
  add column if not exists ai_aspects_classified_at timestamptz;

create index if not exists reviews_ai_aspects_idx
  on public.reviews using gin (ai_aspects)
  where ai_aspects is not null;

create index if not exists reviews_aspects_pending_idx
  on public.reviews (created_at desc)
  where ai_aspects_classified_at is null and ai_insights_classified_at is not null;

comment on column public.reviews.ai_aspects is 'Aspect -> sentiment map e.g. {"food":"positive","service":"negative"}';
comment on column public.reviews.ai_aspects_classified_at is 'Set by classifyReviewInsights when ai_aspects is populated.';
