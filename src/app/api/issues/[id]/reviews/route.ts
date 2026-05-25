import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/issues/[id]/reviews
 * Returns reviews linked to this issue via review_issues. Used by the full
 * issues page to drill down into the actual complaint texts.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: issue, error: issueErr } = await supabase
    .from("issues")
    .select("id, user_id")
    .eq("id", params.id)
    .single();

  if (issueErr || !issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }
  if (issue.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: links, error: linkErr } = await supabase
    .from("review_issues")
    .select(
      `review_id,
       reviews(id, source, external_review_id, author_name, rating, review_text, original_rating, recovery_status, recovery_detected_at, review_created_at, created_at)`
    )
    .eq("issue_id", params.id);

  if (linkErr) {
    return NextResponse.json({ error: linkErr.message }, { status: 500 });
  }

  const reviews = (links ?? [])
    .map((l: { reviews: unknown }) => l.reviews)
    .filter((r) => r != null);

  return NextResponse.json({ reviews });
}
