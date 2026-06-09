-- 040_add_generation_state_to_reviews.sql
--
-- RUN THIS MIGRATION MANUALLY in Supabase SQL Editor before deploying code
-- that reads these columns. Safe to run multiple times (uses IF NOT EXISTS).
--
-- Persists the AI reply *generation* lifecycle on the reviews row so the inbox
-- loader survives a page refresh. Before this, a generated reply lived only in
-- client React state and was lost on refresh unless the user clicked
-- "Save as Draft". The persisted draft text itself continues to live in the
-- EXISTING reviews.reply_text column (reply_status='drafted'); these columns
-- only track the in-flight/terminal status of the background generation job.
--
--   generation_status     'idle' | 'generating' | 'completed' | 'failed'.
--                         Drives the spinner / rehydration in the inbox.
--   generation_id         New UUID per Generate/Regenerate click. Terminal
--                         writes are guarded on this so an older job can never
--                         overwrite a newer Regenerate (race guard).
--   generation_started_at When the current job started. The status endpoint
--                         treats a 'generating' row older than ~120s as stale
--                         (failed) so the client never spins forever.
--   generation_tone       Remembers the tone (Friendly/Professional/
--                         Apologetic/Casual) used for the current generation.
--
-- RLS: NOT weakened. These are plain columns on reviews and are covered by the
-- existing reviews row-level policies (scoped via connection_id → user).
--
-- Additive only — no destructive changes.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS generation_status text,
  ADD COLUMN IF NOT EXISTS generation_id uuid,
  ADD COLUMN IF NOT EXISTS generation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_tone text;

COMMENT ON COLUMN public.reviews.generation_status IS
  'AI reply generation lifecycle: idle | generating | completed | failed. Drives the inbox loader and refresh rehydration. NULL is treated as idle. The generated draft text itself is stored in reply_text (reply_status=drafted).';

COMMENT ON COLUMN public.reviews.generation_id IS
  'UUID stamped on each Generate/Regenerate click. Terminal writes from the background worker are guarded on this value so an older job cannot overwrite the result of a newer Regenerate.';

COMMENT ON COLUMN public.reviews.generation_started_at IS
  'Timestamp the current generation job started. The generation-status endpoint reports a generating row older than ~120s as failed (stale) so the client never spins forever.';

COMMENT ON COLUMN public.reviews.generation_tone IS
  'Tone selected for the current generation (friendly | professional | apologetic | casual). Persisted so the chosen tone survives a refresh.';
