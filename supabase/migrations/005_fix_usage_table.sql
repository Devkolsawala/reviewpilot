-- Migration 005: Replace month-based usage with period_key-based tracking
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Drop old usage table (was keyed on 'month')
DROP TABLE IF EXISTS public.usage;

-- Recreate with period-based tracking
CREATE TABLE public.usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period_key text NOT NULL,       -- e.g. '2026-W14' (weekly) or 'test-12345' (test mode)
  ai_replies_used int DEFAULT 0,
  sms_sent int DEFAULT 0,
  reviews_fetched int DEFAULT 0,
  auto_replies_used int DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, period_key)
);

ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"   ON public.usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON public.usage FOR UPDATE USING (auth.uid() = user_id);
-- Service role bypasses RLS for cron jobs — no extra policy needed
