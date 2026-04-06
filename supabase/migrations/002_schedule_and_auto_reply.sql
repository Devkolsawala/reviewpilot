-- Add scheduled auto-reply fields to app_contexts
alter table public.app_contexts
  add column if not exists schedule_enabled boolean default false,
  add column if not exists schedule_time text default '08:00',
  add column if not exists schedule_timezone text default 'UTC',
  add column if not exists schedule_days boolean[] default '{true,true,true,true,true,true,true}',
  add column if not exists schedule_review_age_hours int default 24,
  add column if not exists schedule_safety_toggle boolean default true;

-- Add is_auto_replied and reply_published_at to reviews
alter table public.reviews
  add column if not exists is_auto_replied boolean default false;

-- Add last_synced_at to connections
alter table public.connections
  add column if not exists last_synced_at timestamptz;
