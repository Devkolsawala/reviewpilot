-- Run in Supabase SQL Editor: Settings → SQL Editor → New query

ALTER TABLE public.app_contexts
ADD COLUMN IF NOT EXISTS sync_interval text DEFAULT '24h'
CHECK (sync_interval IN ('1h', '6h', '12h', '24h', '48h'));
