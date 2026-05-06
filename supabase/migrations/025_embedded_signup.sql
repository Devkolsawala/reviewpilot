-- ============================================================================
-- 025_embedded_signup.sql
-- Track how each WhatsApp connection was established (manual System User token
-- vs. WhatsApp Embedded Signup OAuth flow). Strictly additive.
-- ============================================================================

-- How the connection was created.
alter table public.connections
  add column if not exists connection_method text default 'manual'
    check (connection_method in ('manual', 'embedded_signup'));

-- ESS-specific identifiers captured during the OAuth flow.
alter table public.connections
  add column if not exists ess_user_id text,
  add column if not exists ess_business_id text;

-- Index for filtering manual vs ESS connections in admin queries.
create index if not exists connections_method_idx
  on public.connections (connection_method);

comment on column public.connections.connection_method is
  'How the connection was established: manual = user pasted System User token, embedded_signup = OAuth via Meta Embedded Signup';
