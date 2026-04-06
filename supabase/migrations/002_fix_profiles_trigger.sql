-- ============================================================
-- FIX: Profiles trigger with robust defaults
-- ============================================================
-- HOW TO RUN:
-- 1. Go to https://app.supabase.com → your project → SQL Editor
-- 2. Click "New query"
-- 3. Paste this ENTIRE file
-- 4. Click "Run"
-- 
-- This is SAFE to run multiple times (idempotent).
-- It fixes the most common cause of "connection save fails silently"
-- — the missing profile row that breaks the foreign key constraint.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, company_name, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    '',
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profiles for any EXISTING users who don't have one yet
insert into public.profiles (id, full_name, plan)
select id, coalesce(raw_user_meta_data->>'full_name', email), 'free'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
