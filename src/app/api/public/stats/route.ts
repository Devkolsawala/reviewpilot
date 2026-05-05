import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Refresh once per hour — the homepage doesn't need second-by-second accuracy
// and we don't want to hammer Supabase on every page view.
export const revalidate = 3600;

interface PublicStats {
  totalRepliesGenerated: number;
  totalReviewsManaged: number;
  totalUsers: number;
}

const FALLBACK: PublicStats = {
  totalRepliesGenerated: 0,
  totalReviewsManaged: 0,
  totalUsers: 0,
};

export async function GET() {
  try {
    const supabase = createAdminClient();

    const [repliesAgg, reviewsCount, usersCount] = await Promise.all([
      // Sum manual + auto AI replies across every user's usage period.
      supabase.from("usage").select("ai_replies_used, auto_replies_used"),
      supabase.from("reviews").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    let totalRepliesGenerated = 0;
    if (!repliesAgg.error && repliesAgg.data) {
      for (const row of repliesAgg.data) {
        totalRepliesGenerated +=
          (row.ai_replies_used ?? 0) + (row.auto_replies_used ?? 0);
      }
    }

    const stats: PublicStats = {
      totalRepliesGenerated,
      totalReviewsManaged: reviewsCount.count ?? 0,
      totalUsers: usersCount.count ?? 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[public/stats] failed:", error);
    return NextResponse.json(FALLBACK);
  }
}
