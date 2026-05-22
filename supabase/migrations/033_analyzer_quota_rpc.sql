-- 033_analyzer_quota_rpc.sql
--
-- Atomic quota reservation for the public Play Store analyzer.
--
-- Why: the prior pattern (separate checkAnalyzerLimit read + recordFresh-
-- Analysis update) had a TOCTOU race spanning the 10-22s pipeline. Any
-- second request that landed in that window saw the same stale fresh_count
-- and passed the check, letting a user click "Analyze" 4× and get 4 fresh
-- runs against a 3-per-day cap. These two RPCs collapse check + increment
-- into a single locked transaction, so concurrent requests serialize
-- correctly. The pipeline still records the spend optimistically (reserve
-- up front); failed runs call release() to refund.
--
-- Does NOT modify the existing analyzer_rate_limits table — pure additive.
-- 032 stays untouched on production.

-- ── reserve_analyzer_quota ──────────────────────────────────────────────────
-- One transaction:
--   1. Upsert the (ip_hash, day) row so it definitely exists.
--   2. SELECT ... FOR UPDATE to lock it for the rest of the txn.
--   3. Evaluate caps (anon vs. email_unlocked tier, plus 20-unique-pkg cap).
--   4. If denied, return current state and reason — no increment.
--   5. If accepted, increment fresh_count and append package_id (if new),
--      then return the post-increment state.

create or replace function public.reserve_analyzer_quota(
  p_ip_hash    text,
  p_day        date,
  p_package_id text
) returns table(
  accepted          boolean,
  fresh_count       integer,
  email_unlocked    boolean,
  unique_pkg_count  integer,
  reason            text
)
language plpgsql
security invoker
as $$
declare
  v_row             public.analyzer_rate_limits%rowtype;
  v_limit           integer;
  v_anon_limit      constant integer := 3;
  v_email_bonus     constant integer := 5;
  v_unique_cap      constant integer := 20;
  v_already_has_pkg boolean;
  v_pkg_count       integer;
begin
  -- Ensure the row exists. ON CONFLICT DO NOTHING is safe against races —
  -- a concurrent INSERT will just be a no-op for the loser.
  insert into public.analyzer_rate_limits (ip_hash, day)
    values (p_ip_hash, p_day)
  on conflict (ip_hash, day) do nothing;

  -- Lock the row for the rest of this transaction. Concurrent calls block
  -- here until we COMMIT, serializing the check+increment.
  select * into v_row
    from public.analyzer_rate_limits
    where ip_hash = p_ip_hash and day = p_day
    for update;

  v_limit := v_anon_limit
    + case when v_row.email_unlocked then v_email_bonus else 0 end;

  v_already_has_pkg := p_package_id = any(v_row.unique_packages);
  v_pkg_count := coalesce(array_length(v_row.unique_packages, 1), 0);

  -- Hard cap on unique packages, regardless of tier.
  if not v_already_has_pkg and v_pkg_count >= v_unique_cap then
    return query select
      false,
      v_row.fresh_count,
      v_row.email_unlocked,
      v_pkg_count,
      'unique_cap'::text;
    return;
  end if;

  -- Quota cap.
  if v_row.fresh_count >= v_limit then
    return query select
      false,
      v_row.fresh_count,
      v_row.email_unlocked,
      v_pkg_count,
      case when v_row.email_unlocked then 'email_quota' else 'anon_quota' end::text;
    return;
  end if;

  -- Accepted — atomic increment + optional package append.
  update public.analyzer_rate_limits
    set fresh_count = fresh_count + 1,
        unique_packages = case
          when v_already_has_pkg then unique_packages
          else array_append(unique_packages, p_package_id)
        end
    where ip_hash = p_ip_hash and day = p_day;

  return query select
    true,
    v_row.fresh_count + 1,
    v_row.email_unlocked,
    v_pkg_count + case when v_already_has_pkg then 0 else 1 end,
    null::text;
end $$;

-- ── release_analyzer_quota ──────────────────────────────────────────────────
-- Refunds a reservation when the pipeline fails downstream of reserve().
-- Idempotent floor at zero — callers that double-release (e.g. via retry
-- logic) cannot drive the count negative.

create or replace function public.release_analyzer_quota(
  p_ip_hash text,
  p_day     date
) returns void
language plpgsql
security invoker
as $$
begin
  update public.analyzer_rate_limits
    set fresh_count = greatest(0, fresh_count - 1)
    where ip_hash = p_ip_hash and day = p_day;
end $$;

-- Service role bypasses RLS by default in Supabase, but grant EXECUTE
-- explicitly so the intent is documented and so any future RLS tightening
-- doesn't accidentally lock it out.
grant execute on function public.reserve_analyzer_quota(text, date, text)
  to service_role;
grant execute on function public.release_analyzer_quota(text, date)
  to service_role;
