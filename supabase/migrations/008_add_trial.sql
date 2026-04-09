-- Run in Supabase SQL Editor: Settings → SQL Editor → New query

-- 1. Add trial_ends_at column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- 2. Set trial for all existing free users (7 days from now)
UPDATE public.profiles
SET trial_ends_at = now() + interval '7 days'
WHERE plan = 'free' AND trial_ends_at IS NULL;

-- 3. Update the profile creation trigger to include trial_ends_at for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan, trial_ends_at)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'free',
    now() + interval '7 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
