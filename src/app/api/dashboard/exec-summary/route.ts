import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Must stay dynamic: with the feature flag off at build time the early return
// would otherwise let Next statically cache { enabled: false } forever.
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/exec-summary
 *
 * Returns the LATEST persisted weekly executive summary for the user's
 * workspace (team members read the owner's row via RLS). This endpoint only
 * reads the executive_summaries table — it NEVER triggers AI generation;
 * summaries are produced exclusively by the weekly digest pipeline.
 *
 * When DIGEST_EXECUTIVE_SUMMARY_ENABLED is off the response is
 * { enabled: false } and the dashboard card hides entirely.
 */
export async function GET() {
  const enabled = process.env.DIGEST_EXECUTIVE_SUMMARY_ENABLED === "true";
  if (!enabled) {
    return NextResponse.json({ enabled: false, summary: null });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS limits rows to the workspace owner's summaries; no explicit user
  // filter needed (and a team member's auth.uid() wouldn't match user_id).
  const { data, error } = await supabase
    .from("executive_summaries")
    .select("summary, top_action, period_start, period_end, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[exec-summary] query error:", error.message);
    return NextResponse.json({ enabled: true, summary: null });
  }

  // For the no-summary placeholder: tell the card whether the weekly digest
  // is on, so it can link to Settings → Notifications when it isn't.
  let weeklyDigestEnabled = true;
  if (!data) {
    const { data: prefs } = await supabase
      .from("digest_preferences")
      .select("weekly_enabled")
      .maybeSingle();
    weeklyDigestEnabled = prefs?.weekly_enabled === true;
  }

  return NextResponse.json({
    weeklyDigestEnabled,
    enabled: true,
    summary: data
      ? {
          summary: data.summary,
          topAction: data.top_action,
          periodStart: data.period_start,
          periodEnd: data.period_end,
          createdAt: data.created_at,
        }
      : null,
  });
}
