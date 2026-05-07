-- Run in Supabase SQL Editor.

-- Log every webhook event we receive from Razorpay.
-- Used for: idempotency (don't double-process), audit trail, debugging, replay.
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay',
  event_id text not null,                  -- Razorpay's event id (header x-razorpay-event-id) OR fallback hash
  event_type text not null,                -- e.g. 'subscription.activated'
  razorpay_subscription_id text,           -- nullable; for fast lookup
  razorpay_payment_id text,                -- nullable; for fast lookup
  user_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null,
  status text not null default 'received', -- 'received' | 'processed' | 'ignored' | 'error'
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint webhook_events_unique_event unique (provider, event_id)
);

create index if not exists idx_webhook_events_sub_id on public.webhook_events(razorpay_subscription_id);
create index if not exists idx_webhook_events_received on public.webhook_events(received_at desc);
create index if not exists idx_webhook_events_status on public.webhook_events(status);

-- Service-role only. No user-facing policies.
alter table public.webhook_events enable row level security;

comment on table public.webhook_events is 'Idempotency log for incoming webhook events. Service role only.';
