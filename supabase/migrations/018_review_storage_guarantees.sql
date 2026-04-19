-- Track when we last saw a review in Google's live API window.
-- Reviews are NEVER deleted when they roll off this window — we keep them forever.
alter table public.reviews
  add column if not exists last_seen_in_api_at timestamptz;

-- Mark when the first sync completed, so we can show the welcome card.
alter table public.connections
  add column if not exists initial_sync_completed_at timestamptz;

-- Index for inbox queries and analytics range filters.
create index if not exists reviews_connection_review_created_idx
  on public.reviews (connection_id, review_created_at desc);
