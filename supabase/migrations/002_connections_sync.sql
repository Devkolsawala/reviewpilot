-- Add last_synced_at column to connections (run in Supabase SQL editor)
alter table public.connections
  add column if not exists last_synced_at timestamptz,
  add column if not exists review_count int default 0;

-- Fix handle_new_user trigger to be idempotent (ON CONFLICT DO NOTHING)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger (drop first in case it already exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
