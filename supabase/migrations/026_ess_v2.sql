-- ============================================================================
-- 026_ess_v2.sql
-- Phase 6 v2 — production-readiness for WhatsApp Embedded Signup.
-- Adds token-health tracking, custom-PIN storage, and onboarding completion
-- timestamps. All new columns are optional with safe defaults so existing
-- v1 connections continue to function.
--
-- NOTE: We deliberately do NOT add a separate business_system_user_id column.
-- The existing ess_business_id column (added in 025_embedded_signup.sql) is
-- repurposed in v2 to store the customer's business portfolio ID returned
-- by Meta during the WABA info query.
-- ============================================================================

-- Token-health tracking
alter table public.connections
  add column if not exists token_status text default 'active'
    check (token_status in ('active', 'expired', 'revoked', 'pending_exchange', 'exchange_failed')),
  add column if not exists token_last_validated_at timestamptz,
  add column if not exists token_exchange_error text;

-- Customer-supplied PIN for phone re-registration. Encrypted at rest using
-- the same encryptToken helper that protects access tokens.
alter table public.connections
  add column if not exists phone_pin_encrypted text;

-- When ESS onboarding fully completed (i.e., we have a usable long-lived token).
-- NULL means the row was created with token_status = 'pending_exchange' but
-- never reached the active state.
alter table public.connections
  add column if not exists onboarding_completed_at timestamptz;

-- Index for finding WhatsApp connections that need attention (expired,
-- revoked, exchange failed, or stuck pending).
create index if not exists connections_token_status_idx
  on public.connections (token_status)
  where type = 'whatsapp';

comment on column public.connections.token_status is
  'Health of the WhatsApp access token: active, expired, revoked, pending_exchange (ESS started but token not yet exchanged), exchange_failed';
comment on column public.connections.phone_pin_encrypted is
  '6-digit phone re-registration PIN supplied by the customer during ESS, encrypted with the same scheme as access tokens.';
comment on column public.connections.onboarding_completed_at is
  'Timestamp when the ESS flow successfully finished (long-lived token stored, token_status moved from pending_exchange to active).';
