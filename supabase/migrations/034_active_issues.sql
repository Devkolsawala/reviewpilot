-- 034_active_issues.sql
-- Active Issues + Recovery Rate engine.
--
-- Adds recovery-tracking columns to reviews (original_rating snapshot,
-- recovery_status state machine, is_recoverable flag, issue_label).
-- Adds issues + review_issues tables for clustering complaints across reviews.
--
-- Additive only — no existing column or constraint is modified.

-- Recovery tracking columns on reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_recoverable boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS issue_label text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS original_rating smallint;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS recovery_status text
  DEFAULT 'none'
  CHECK (recovery_status IN ('none', 'monitoring', 'recovered', 'unrecovered'));
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS recovery_detected_at timestamptz;

-- Issues table — one row per detected complaint cluster per connection
CREATE TABLE IF NOT EXISTS public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'fixed', 'dismissed')),
  review_count int NOT NULL DEFAULT 0,
  avg_rating numeric(2,1),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  fixed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own issues" ON public.issues;
CREATE POLICY "Users can view own issues" ON public.issues
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own issues" ON public.issues;
CREATE POLICY "Users can update own issues" ON public.issues
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own issues" ON public.issues;
CREATE POLICY "Users can insert own issues" ON public.issues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Many-to-many join: reviews <-> issues
CREATE TABLE IF NOT EXISTS public.review_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id, issue_id)
);

ALTER TABLE public.review_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own review_issues" ON public.review_issues;
CREATE POLICY "Users can view own review_issues" ON public.review_issues
  FOR SELECT USING (
    issue_id IN (SELECT id FROM public.issues WHERE user_id = auth.uid())
  );

-- Indexes for the dashboard card + full issues page queries
CREATE INDEX IF NOT EXISTS idx_issues_user_connection ON public.issues(user_id, connection_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_review_issues_review ON public.review_issues(review_id);
CREATE INDEX IF NOT EXISTS idx_review_issues_issue ON public.review_issues(issue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_recovery_status ON public.reviews(recovery_status)
  WHERE recovery_status IS NOT NULL AND recovery_status <> 'none';
CREATE INDEX IF NOT EXISTS idx_reviews_original_rating ON public.reviews(original_rating)
  WHERE original_rating IS NOT NULL;

COMMENT ON COLUMN public.reviews.is_recoverable IS 'AI verdict: does this review describe a specific, actionable problem the developer could fix? Only set for rating <= 3.';
COMMENT ON COLUMN public.reviews.issue_label IS 'Short 3-6 word Title Case label for the core complaint (e.g. "Photo Upload Crash"). Used to cluster reviews into issues. Null for non-recoverable reviews.';
COMMENT ON COLUMN public.reviews.original_rating IS 'The star rating at first insertion. Never changes after that — baseline for passive recovery detection.';
COMMENT ON COLUMN public.reviews.recovery_status IS 'none = not monitored; monitoring = waiting to see if rating improves; recovered = rating rose to 4+; unrecovered = explicit terminal state (unused by passive detection today).';
COMMENT ON COLUMN public.reviews.recovery_detected_at IS 'Set the moment a monitored review is observed at rating >= 4 with original_rating <= 3.';

COMMENT ON TABLE public.issues IS 'Clusters of similar complaints. Each row is one issue for one connection; review_issues links the specific reviews.';
COMMENT ON TABLE public.review_issues IS 'Join table — many-to-many between reviews and issues. A review can belong to multiple issues if it spans complaints.';
