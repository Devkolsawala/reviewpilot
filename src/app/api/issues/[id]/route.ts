import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { regenerateRepliesForFixedIssue } from "@/lib/reviews/regenerate-fixed";

/**
 * PATCH /api/issues/[id]
 * Body: { status: 'active' | 'fixed' | 'dismissed' }
 *
 * Marking an issue 'fixed' stamps fixed_at AND drafts fresh AI replies for
 * any linked reviews where the reviewer has since edited their text or had
 * their rating climb to 4+ stars. The original apologetic replies are stale
 * once the issue is fixed and the reviewer has updated their feedback —
 * regenerating closes the loop. Drafts ONLY (never auto-publishes).
 *
 * Reopening to 'active' clears fixed_at. Regeneration does not run for
 * 'dismissed' or 'active'.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const status = String(body?.status || "").toLowerCase();
  if (!["active", "fixed", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  // RLS already restricts to user-owned issues, but check explicitly for a
  // clearer 404 vs 403 distinction.
  const { data: existing, error: lookupErr } = await supabase
    .from("issues")
    .select("id, user_id, status, fixed_at")
    .eq("id", params.id)
    .single();

  if (lookupErr || !existing) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status,
    updated_at: now,
  };
  if (status === "fixed") {
    update.fixed_at = now;
  } else if (status === "active") {
    update.fixed_at = null;
  }

  const { data: updated, error: updErr } = await supabase
    .from("issues")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Best-effort: when transitioning to 'fixed', regenerate AI replies for
  // linked reviews whose state has changed since we last replied. Publishes
  // by default (overwrites the live reply on the store), falling back to
  // draft when the store rejects the publish. Never throws — the issue is
  // already marked fixed; regeneration is a bonus.
  let regenSummary = {
    regenerated: 0,
    published: 0,
    drafted: 0,
    candidatesFound: 0,
  };
  if (status === "fixed" && existing.status !== "fixed") {
    try {
      const result = await regenerateRepliesForFixedIssue(supabase, {
        userId: user.id,
        issueId: params.id,
      });
      regenSummary = {
        regenerated: result.regenerated,
        published: result.published,
        drafted: result.drafted,
        candidatesFound: result.candidatesFound,
      };
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error(
        "[issues/PATCH] regeneration failed (non-fatal):",
        err.message
      );
    }
  }

  return NextResponse.json({
    issue: updated,
    // `regenerated` = published + drafted (rows whose reply_text we wrote).
    // Detailed breakdown for the UI toast.
    ...regenSummary,
  });
}
