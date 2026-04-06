-- ============================================================
-- FIX: Explicit per-operation RLS policies
-- ============================================================
-- HOW TO RUN:
-- 1. Go to https://app.supabase.com → your project → SQL Editor
-- 2. Click "New query"
-- 3. Paste this ENTIRE file
-- 4. Click "Run"
--
-- The existing "for all using (...)" policies sometimes fail for
-- INSERT because Supabase requires a "with check" clause for inserts.
-- This migration drops the broad policies and creates explicit ones.
-- Safe to run multiple times.
-- ============================================================

-- ── Connections ─────────────────────────────────────────────
drop policy if exists "Users can manage own connections" on public.connections;
drop policy if exists "Users can select own connections" on public.connections;
drop policy if exists "Users can insert own connections" on public.connections;
drop policy if exists "Users can update own connections" on public.connections;
drop policy if exists "Users can delete own connections" on public.connections;

create policy "Users can select own connections" on public.connections
  for select using (user_id = auth.uid());
create policy "Users can insert own connections" on public.connections
  for insert with check (user_id = auth.uid());
create policy "Users can update own connections" on public.connections
  for update using (user_id = auth.uid());
create policy "Users can delete own connections" on public.connections
  for delete using (user_id = auth.uid());

-- ── App Contexts ────────────────────────────────────────────
drop policy if exists "Users can manage own app contexts" on public.app_contexts;
drop policy if exists "Users can select own app contexts" on public.app_contexts;
drop policy if exists "Users can insert own app contexts" on public.app_contexts;
drop policy if exists "Users can update own app contexts" on public.app_contexts;
drop policy if exists "Users can delete own app contexts" on public.app_contexts;

create policy "Users can select own app contexts" on public.app_contexts
  for select using (connection_id in (select id from public.connections where user_id = auth.uid()));
create policy "Users can insert own app contexts" on public.app_contexts
  for insert with check (connection_id in (select id from public.connections where user_id = auth.uid()));
create policy "Users can update own app contexts" on public.app_contexts
  for update using (connection_id in (select id from public.connections where user_id = auth.uid()));
create policy "Users can delete own app contexts" on public.app_contexts
  for delete using (connection_id in (select id from public.connections where user_id = auth.uid()));

-- ── Reviews ─────────────────────────────────────────────────
drop policy if exists "Users can manage own reviews" on public.reviews;
drop policy if exists "Users can select own reviews" on public.reviews;
drop policy if exists "Users can insert own reviews" on public.reviews;
drop policy if exists "Users can update own reviews" on public.reviews;
drop policy if exists "Users can delete own reviews" on public.reviews;

create policy "Users can select own reviews" on public.reviews
  for select using (connection_id in (select id from public.connections where user_id = auth.uid()));
create policy "Users can insert own reviews" on public.reviews
  for insert with check (connection_id in (select id from public.connections where user_id = auth.uid()));
create policy "Users can update own reviews" on public.reviews
  for update using (connection_id in (select id from public.connections where user_id = auth.uid()));
create policy "Users can delete own reviews" on public.reviews
  for delete using (connection_id in (select id from public.connections where user_id = auth.uid()));

-- ── Campaigns ───────────────────────────────────────────────
drop policy if exists "Users can manage own campaigns" on public.campaigns;
drop policy if exists "Users can select own campaigns" on public.campaigns;
drop policy if exists "Users can insert own campaigns" on public.campaigns;
drop policy if exists "Users can update own campaigns" on public.campaigns;
drop policy if exists "Users can delete own campaigns" on public.campaigns;

create policy "Users can select own campaigns" on public.campaigns
  for select using (connection_id in (select id from public.connections where user_id = auth.uid()));
create policy "Users can insert own campaigns" on public.campaigns
  for insert with check (connection_id in (select id from public.connections where user_id = auth.uid()));
create policy "Users can update own campaigns" on public.campaigns
  for update using (connection_id in (select id from public.connections where user_id = auth.uid()));
create policy "Users can delete own campaigns" on public.campaigns
  for delete using (connection_id in (select id from public.connections where user_id = auth.uid()));

-- ── Campaign Recipients ─────────────────────────────────────
drop policy if exists "Users can manage campaign recipients" on public.campaign_recipients;
drop policy if exists "Users can select campaign recipients" on public.campaign_recipients;
drop policy if exists "Users can insert campaign recipients" on public.campaign_recipients;
drop policy if exists "Users can update campaign recipients" on public.campaign_recipients;
drop policy if exists "Users can delete campaign recipients" on public.campaign_recipients;

create policy "Users can select campaign recipients" on public.campaign_recipients
  for select using (campaign_id in (select id from public.campaigns where connection_id in (select id from public.connections where user_id = auth.uid())));
create policy "Users can insert campaign recipients" on public.campaign_recipients
  for insert with check (campaign_id in (select id from public.campaigns where connection_id in (select id from public.connections where user_id = auth.uid())));
create policy "Users can update campaign recipients" on public.campaign_recipients
  for update using (campaign_id in (select id from public.campaigns where connection_id in (select id from public.connections where user_id = auth.uid())));
create policy "Users can delete campaign recipients" on public.campaign_recipients
  for delete using (campaign_id in (select id from public.campaigns where connection_id in (select id from public.connections where user_id = auth.uid())));

-- ── Usage ───────────────────────────────────────────────────
drop policy if exists "Users can manage own usage" on public.usage;
drop policy if exists "Users can select own usage" on public.usage;
drop policy if exists "Users can insert own usage" on public.usage;
drop policy if exists "Users can update own usage" on public.usage;

create policy "Users can select own usage" on public.usage
  for select using (user_id = auth.uid());
create policy "Users can insert own usage" on public.usage
  for insert with check (user_id = auth.uid());
create policy "Users can update own usage" on public.usage
  for update using (user_id = auth.uid());
