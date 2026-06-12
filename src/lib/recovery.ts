/**
 * Recovery Rate calculation — single source of truth.
 *
 * Used by GET /api/dashboard/recovery-rate (session client, RLS-scoped) and
 * the weekly digest's Recovery section (admin client). Both surfaces must
 * report identical math:
 *
 *   total_negative = reviews with original_rating <= 3 AND
 *                    recovery_status != 'none' within the window (created_at)
 *   recovered      = total_negative AND recovery_status = 'recovered'
 *   rate           = round(recovered / total_negative * 100), null when no
 *                    monitored negatives exist
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type RecoveryCounts = { total: number; recovered: number };

export async function countNegativeAndRecovered(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  connectionIds: string[],
  fromIso: string,
  toIso?: string
): Promise<RecoveryCounts> {
  if (connectionIds.length === 0) return { total: 0, recovered: 0 };
  let baseQuery = supabase
    .from("reviews")
    .select("recovery_status", { count: "exact" })
    .in("connection_id", connectionIds)
    .lte("original_rating", 3)
    .neq("recovery_status", "none")
    .gte("created_at", fromIso);
  if (toIso) baseQuery = baseQuery.lt("created_at", toIso);
  const { data, error } = await baseQuery;
  if (error) {
    console.error("[recovery] query error:", error.message);
    return { total: 0, recovered: 0 };
  }
  const total = data?.length ?? 0;
  const recovered = (data ?? []).filter(
    (r) => r.recovery_status === "recovered"
  ).length;
  return { total, recovered };
}

export function recoveryRatePct(counts: RecoveryCounts): number | null {
  return counts.total > 0
    ? Math.round((counts.recovered / counts.total) * 100)
    : null;
}
