-- ============================================================
-- Phase 1: Team / Invite System
-- ============================================================
-- Adds:
--   1. owner_id column to profiles
--   2. team_members table
--   3. get_effective_owner_id() helper function
--   4. Updated RLS policies on all tables to allow team member access
--   5. RLS policies on team_members
-- ============================================================

-- ── 1. Add owner_id to profiles ─────────────────────────────
alter table public.profiles
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

-- ── 2. Create team_members table ────────────────────────────
create table if not exists public.team_members (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  member_id    uuid references public.profiles(id) on delete set null,
  email        text not null,
  role         text not null check (role in ('admin', 'read_only')),
  invite_token uuid not null default gen_random_uuid() unique,
  status       text not null default 'pending' check (status in ('pending', 'active')),
  invited_at   timestamptz not null default now(),
  accepted_at  timestamptz
);

alter table public.team_members enable row level security;

-- ── 3. Helper function: resolve the effective owner ─────────
create or replace function public.get_effective_owner_id(user_uuid uuid)
returns uuid
language sql
stable
security definer
as $$
  select coalesce(owner_id, id) from public.profiles where id = user_uuid;
$$;

-- ── 4. RLS: connections ──────────────────────────────────────
drop policy if exists "Users can select own connections" on public.connections;
drop policy if exists "Users can insert own connections" on public.connections;
drop policy if exists "Users can update own connections" on public.connections;
drop policy if exists "Users can delete own connections" on public.connections;

create policy "Team can select connections" on public.connections
  for select using (user_id = public.get_effective_owner_id(auth.uid()));

create policy "Team can insert connections" on public.connections
  for insert with check (user_id = public.get_effective_owner_id(auth.uid()));

create policy "Team can update connections" on public.connections
  for update using (user_id = public.get_effective_owner_id(auth.uid()));

create policy "Team can delete connections" on public.connections
  for delete using (user_id = public.get_effective_owner_id(auth.uid()));

-- ── 5. RLS: app_contexts ─────────────────────────────────────
drop policy if exists "Users can select own app contexts" on public.app_contexts;
drop policy if exists "Users can insert own app contexts" on public.app_contexts;
drop policy if exists "Users can update own app contexts" on public.app_contexts;
drop policy if exists "Users can delete own app contexts" on public.app_contexts;

create policy "Team can select app contexts" on public.app_contexts
  for select using (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

create policy "Team can insert app contexts" on public.app_contexts
  for insert with check (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

create policy "Team can update app contexts" on public.app_contexts
  for update using (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

create policy "Team can delete app contexts" on public.app_contexts
  for delete using (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

-- ── 6. RLS: reviews ──────────────────────────────────────────
drop policy if exists "Users can select own reviews" on public.reviews;
drop policy if exists "Users can insert own reviews" on public.reviews;
drop policy if exists "Users can update own reviews" on public.reviews;
drop policy if exists "Users can delete own reviews" on public.reviews;

create policy "Team can select reviews" on public.reviews
  for select using (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

create policy "Team can insert reviews" on public.reviews
  for insert with check (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

create policy "Team can update reviews" on public.reviews
  for update using (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

create policy "Team can delete reviews" on public.reviews
  for delete using (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

-- ── 7. RLS: campaigns ────────────────────────────────────────
drop policy if exists "Users can select own campaigns" on public.campaigns;
drop policy if exists "Users can insert own campaigns" on public.campaigns;
drop policy if exists "Users can update own campaigns" on public.campaigns;
drop policy if exists "Users can delete own campaigns" on public.campaigns;

create policy "Team can select campaigns" on public.campaigns
  for select using (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

create policy "Team can insert campaigns" on public.campaigns
  for insert with check (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

create policy "Team can update campaigns" on public.campaigns
  for update using (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

create policy "Team can delete campaigns" on public.campaigns
  for delete using (
    connection_id in (
      select id from public.connections
      where user_id = public.get_effective_owner_id(auth.uid())
    )
  );

-- ── 8. RLS: campaign_recipients ──────────────────────────────
drop policy if exists "Users can select campaign recipients" on public.campaign_recipients;
drop policy if exists "Users can insert campaign recipients" on public.campaign_recipients;
drop policy if exists "Users can update campaign recipients" on public.campaign_recipients;
drop policy if exists "Users can delete campaign recipients" on public.campaign_recipients;

create policy "Team can select campaign recipients" on public.campaign_recipients
  for select using (
    campaign_id in (
      select id from public.campaigns
      where connection_id in (
        select id from public.connections
        where user_id = public.get_effective_owner_id(auth.uid())
      )
    )
  );

create policy "Team can insert campaign recipients" on public.campaign_recipients
  for insert with check (
    campaign_id in (
      select id from public.campaigns
      where connection_id in (
        select id from public.connections
        where user_id = public.get_effective_owner_id(auth.uid())
      )
    )
  );

create policy "Team can update campaign recipients" on public.campaign_recipients
  for update using (
    campaign_id in (
      select id from public.campaigns
      where connection_id in (
        select id from public.connections
        where user_id = public.get_effective_owner_id(auth.uid())
      )
    )
  );

create policy "Team can delete campaign recipients" on public.campaign_recipients
  for delete using (
    campaign_id in (
      select id from public.campaigns
      where connection_id in (
        select id from public.connections
        where user_id = public.get_effective_owner_id(auth.uid())
      )
    )
  );

-- ── 9. RLS: usage ────────────────────────────────────────────
drop policy if exists "Users can select own usage" on public.usage;
drop policy if exists "Users can insert own usage" on public.usage;
drop policy if exists "Users can update own usage" on public.usage;

create policy "Team can select usage" on public.usage
  for select using (user_id = public.get_effective_owner_id(auth.uid()));

create policy "Team can insert usage" on public.usage
  for insert with check (user_id = public.get_effective_owner_id(auth.uid()));

create policy "Team can update usage" on public.usage
  for update using (user_id = public.get_effective_owner_id(auth.uid()));

-- ── 10. RLS: team_members ────────────────────────────────────
-- Owner: full CRUD on their own team rows
create policy "Owner can select team members" on public.team_members
  for select using (owner_id = auth.uid());

create policy "Owner can insert team members" on public.team_members
  for insert with check (owner_id = auth.uid());

create policy "Owner can update team members" on public.team_members
  for update using (owner_id = auth.uid());

create policy "Owner can delete team members" on public.team_members
  for delete using (owner_id = auth.uid());

-- Member: can read their own row (to accept invite)
create policy "Member can select own row" on public.team_members
  for select using (member_id = auth.uid());

create policy "Member can update own row" on public.team_members
  for update using (member_id = auth.uid());
