-- Transactional helper for the external_review_id backfill (one-off use).
-- Wraps the canonical-row UPDATE and corrupt-row DELETE in a single
-- transaction so a crash between them cannot orphan user-touched fields
-- (drafts, edit counts, is_read, etc.) onto the row we're about to delete.
--
-- The function is intentionally narrow:
--   - service-role-only (RLS still applies to the underlying table; the
--     backfill script connects with the service-role key).
--   - JSONB payload restricted to the specific columns the merge planner
--     produces. Anything else is silently ignored.
--
-- Drop after backfill is complete:
--   DROP FUNCTION public.backfill_merge_and_delete_review(uuid, uuid, jsonb);

create or replace function public.backfill_merge_and_delete_review(
  p_canonical_id uuid,
  p_corrupt_id   uuid,
  p_update       jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_canonical_id is null or p_corrupt_id is null then
    raise exception 'backfill_merge_and_delete_review: both ids required';
  end if;
  if p_canonical_id = p_corrupt_id then
    raise exception 'backfill_merge_and_delete_review: canonical and corrupt ids must differ';
  end if;

  update public.reviews r
  set
    reply_text               = coalesce(p_update->>'reply_text',                  r.reply_text),
    reply_status             = coalesce(p_update->>'reply_status',                r.reply_status),
    reply_published_at       = coalesce((p_update->>'reply_published_at')::timestamptz,       r.reply_published_at),
    reply_first_published_at = coalesce((p_update->>'reply_first_published_at')::timestamptz, r.reply_first_published_at),
    reply_last_edited_at     = coalesce((p_update->>'reply_last_edited_at')::timestamptz,     r.reply_last_edited_at),
    reply_edit_count         = coalesce((p_update->>'reply_edit_count')::int,                 r.reply_edit_count),
    is_read                  = coalesce((p_update->>'is_read')::boolean,                      r.is_read),
    is_auto_replied          = coalesce((p_update->>'is_auto_replied')::boolean,              r.is_auto_replied),
    skip_auto_reply          = coalesce((p_update->>'skip_auto_reply')::boolean,              r.skip_auto_reply),
    last_seen_in_api_at      = coalesce((p_update->>'last_seen_in_api_at')::timestamptz,      r.last_seen_in_api_at)
  where r.id = p_canonical_id;

  delete from public.reviews where id = p_corrupt_id;
end;
$$;

revoke all on function public.backfill_merge_and_delete_review(uuid, uuid, jsonb) from public;
grant execute on function public.backfill_merge_and_delete_review(uuid, uuid, jsonb) to service_role;
