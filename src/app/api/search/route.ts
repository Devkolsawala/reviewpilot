import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildIlikePattern } from "@/lib/search/sanitize";

/**
 * GET /api/search?q=…&limit=10
 *
 * Global search (⌘K) over the user's real data. Authed, session client —
 * RLS scopes both tables exactly like the inbox and issues pages, so team
 * members see whatever those pages would show them.
 *
 * Searches in parallel:
 *   - reviews: review_text + author_name ILIKE, newest first, limit 6
 *   - issues:  label ILIKE, limit 4
 *
 * Min query length 2. ILIKE wildcards in the input are escaped (see
 * lib/search/sanitize) so "%_%" searches the literal string.
 */

const REVIEW_LIMIT = 6;
const ISSUE_LIMIT = 4;

function excerptAround(text: string, query: string, max = 80): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const idx = t.toLowerCase().indexOf(query.toLowerCase());
  if (idx <= 20) return `${t.slice(0, max - 1)}…`;
  const start = Math.max(0, idx - 20);
  const slice = t.slice(start, start + max - 2);
  return `${start > 0 ? "…" : ""}${slice}…`;
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Math.max(
    1,
    Math.min(10, parseInt(searchParams.get("limit") || "10", 10) || 10)
  );

  const pattern = buildIlikePattern(q);
  if (!pattern) {
    return NextResponse.json({ reviews: [], issues: [] });
  }

  const reviewLimit = Math.min(REVIEW_LIMIT, limit);
  const issueLimit = Math.min(ISSUE_LIMIT, limit);

  const [reviewsRes, issuesRes] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, rating, author_name, review_text, review_created_at, connections(name)"
      )
      .or(`review_text.ilike.${pattern},author_name.ilike.${pattern}`)
      .order("review_created_at", { ascending: false })
      .limit(reviewLimit),
    supabase
      .from("issues")
      .select("id, label, status, review_count")
      .ilike("label", pattern)
      .order("review_count", { ascending: false })
      .limit(issueLimit),
  ]);

  if (reviewsRes.error) {
    console.error("[search] reviews query error:", reviewsRes.error.message);
  }
  if (issuesRes.error) {
    console.error("[search] issues query error:", issuesRes.error.message);
  }

  const cleanedQuery = q.trim();
  const reviews = (reviewsRes.data ?? []).map((r) => {
    // connections(name) comes back as an object (FK row) or array depending
    // on relationship inference — normalize both.
    const conn = r.connections as { name?: string } | { name?: string }[] | null;
    const connName = Array.isArray(conn) ? conn[0]?.name : conn?.name;
    return {
      id: r.id,
      excerpt: excerptAround(r.review_text || "", cleanedQuery),
      author: r.author_name || "Anonymous",
      rating: r.rating,
      connectionName: connName || null,
      createdAt: r.review_created_at,
    };
  });

  const issues = (issuesRes.data ?? []).map((i) => ({
    id: i.id,
    title: i.label,
    status: i.status,
    reviewCount: i.review_count ?? 0,
  }));

  return NextResponse.json({ reviews, issues });
}
