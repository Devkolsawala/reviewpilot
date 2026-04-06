-- Ensure the profiles table has a row for every auth user.
-- This trigger is idempotent (ON CONFLICT DO NOTHING) so it is safe to re-run.
-- Run this in the Supabase SQL editor if connections fail to save (foreign key violation).

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate trigger so changes take effect
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create a profile row for any existing users that don't have one
-- (Safe to run multiple times — ON CONFLICT DO NOTHING handles duplicates)
insert into public.profiles (id, full_name)
select id, raw_user_meta_data->>'full_name'
from auth.users
on conflict (id) do nothing;
