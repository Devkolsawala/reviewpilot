-- ============================================================
-- Migration 029: add 'operator' team role
-- ============================================================
-- Additive change only:
--   1. Extends the team_members.role CHECK constraint to allow a
--      new 'operator' value alongside the existing 'admin' and
--      'read_only' values.
--
-- What does NOT change:
--   - No existing rows are altered.
--   - No RLS policies are modified. Workspace scoping continues to
--     be enforced via public.get_effective_owner_id(auth.uid()).
--     Per-role write restrictions remain UI-layer only — exactly
--     the same approach already used for 'read_only' today.
--   - 'owner' is still not stored in team_members; the workspace
--     owner is identified implicitly by profiles.owner_id IS NULL.
-- ============================================================

alter table public.team_members
  drop constraint if exists team_members_role_check;

alter table public.team_members
  add constraint team_members_role_check
  check (role in ('admin', 'operator', 'read_only'));
