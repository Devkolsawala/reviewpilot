-- ============================================================================
-- 019_whatsapp_support.sql
-- Add WhatsApp as a third review source alongside Play Store and GBP.
-- Strictly additive — no existing columns renamed or removed.
-- ============================================================================

-- Widen connections.type CHECK to include 'whatsapp'
alter table public.connections
  drop constraint if exists connections_type_check;
alter table public.connections
  add constraint connections_type_check
  check (type in ('google_business', 'play_store', 'whatsapp'));

-- Widen reviews.source CHECK to include 'whatsapp'
alter table public.reviews
  drop constraint if exists reviews_source_check;
alter table public.reviews
  add constraint reviews_source_check
  check (source in ('google_business', 'play_store', 'whatsapp'));

-- Also widen the rating CHECK so WhatsApp rows with NULL rating are valid.
-- (Postgres treats NULL in CHECK as unknown → allowed, but older migrations may
--  have been re-applied strictly. Re-assert the same semantics explicitly.)
alter table public.reviews
  drop constraint if exists reviews_rating_check;
alter table public.reviews
  add constraint reviews_rating_check
  check (rating is null or (rating between 1 and 5));

-- Store the customer's phone number (E.164) for WhatsApp messages.
-- NULL for Play Store / GBP rows.
alter table public.reviews
  add column if not exists author_id text;

-- Gate non-text WhatsApp messages (images, audio, docs, etc.) from auto-AI.
-- Default false so Play Store / GBP behavior is unchanged.
alter table public.reviews
  add column if not exists skip_auto_reply boolean default false;

-- WhatsApp-specific columns on connections (all nullable — no impact on
-- existing Play Store / GBP rows).
alter table public.connections
  add column if not exists whatsapp_phone_number_id text,
  add column if not exists whatsapp_business_account_id text,
  add column if not exists whatsapp_display_phone_number text,
  add column if not exists whatsapp_access_token_encrypted text;

-- Fast lookup when the webhook receives a message and needs to find the
-- connection by phone_number_id.
create index if not exists connections_whatsapp_phone_number_id_idx
  on public.connections (whatsapp_phone_number_id)
  where whatsapp_phone_number_id is not null;

-- Note: the existing UNIQUE (connection_id, external_review_id) from
-- migration 001 already prevents duplicate webhook deliveries per
-- connection+wamid, so we do NOT add a new unique index.
