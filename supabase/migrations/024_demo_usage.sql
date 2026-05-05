-- Migration 024: demo_usage table for the public homepage AI demo.
--
-- Stores ip_hash (sha256 of IP + DEMO_IP_SALT) per generation so the public
-- /api/public/demo-reply route can enforce a per-IP rate limit (5/hour).
-- Only ever written by the public route using the service role key — RLS is
-- enabled with NO policies so authenticated/anon clients cannot read or write.

create table if not exists public.demo_usage (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_demo_usage_ip_created
  on public.demo_usage (ip_hash, created_at desc);

alter table public.demo_usage enable row level security;
-- Intentionally no policies = no client-side access.
