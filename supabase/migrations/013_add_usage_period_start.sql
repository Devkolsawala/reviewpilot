-- Run in Supabase SQL Editor: Settings → SQL Editor → New query
--
-- BUG FIX: Add usage_period_start column so each user's usage limits reset
-- relative to their own subscription/signup date rather than a fixed calendar week.
--
-- Example: if a user signed up on Apr 12, their period resets every 7 days
-- on Apr 19, Apr 26, May 3 — independent of other users.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS usage_period_start timestamptz;

-- Set for all existing users: use their account creation date
UPDATE public.profiles
SET usage_period_start = created_at
WHERE usage_period_start IS NULL;

-- Update the signup trigger so new users get usage_period_start = now()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan, trial_ends_at, usage_period_start)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'free',
    now() + interval '7 days',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
