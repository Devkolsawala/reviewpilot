-- Add subscription_cancel_at to profiles
-- Stores the date when a pending cancellation will take effect (end of billing period).
-- Set when user cancels. Cleared when subscription actually ends (webhook) or user re-subscribes.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_cancel_at timestamptz;
