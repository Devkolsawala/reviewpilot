-- Track reply edit history per review so we can enforce a soft per-review edit
-- cap (Google has no per-review cap, only a project-wide 2000 POST/day quota —
-- this keeps us comfortably under and prevents accidental abuse).
--
-- Run in Supabase SQL editor.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reply_edit_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_first_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reply_last_edited_at TIMESTAMPTZ;
