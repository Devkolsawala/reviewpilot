-- RUN THIS IN SUPABASE SQL EDITOR: Dashboard → SQL → New query → paste → Run
-- (Or apply via supabase CLI if you use migrations locally.)

-- Review reply automation mode + safety flag for low-star reviews in auto-publish
ALTER TABLE public.app_contexts
  ADD COLUMN IF NOT EXISTS auto_reply_mode text DEFAULT 'manual'
    CHECK (auto_reply_mode IN ('manual', 'draft_for_review', 'auto_publish')),
  ADD COLUMN IF NOT EXISTS auto_reply_draft_low_ratings boolean DEFAULT true;

-- Note: Scheduling already uses schedule_time, schedule_days (boolean[]), schedule_timezone from migration 002.
