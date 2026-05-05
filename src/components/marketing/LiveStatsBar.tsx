import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCount } from "@/lib/format";

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

// Same shape as /api/public/stats — wrapped with unstable_cache so the
// homepage doesn't query Supabase on every visit. One hour TTL matches the
// route handler's revalidate setting.
const getPublicStats = unstable_cache(
  async (): Promise<PublicStats> => {
    try {
      const supabase = createAdminClient();
      const [repliesAgg, reviewsCount, usersCount] = await Promise.all([
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

      return {
        totalRepliesGenerated,
        totalReviewsManaged: reviewsCount.count ?? 0,
        totalUsers: usersCount.count ?? 0,
      };
    } catch (err) {
      console.error("[LiveStatsBar] stats query failed:", err);
      return FALLBACK;
    }
  },
  ["public-stats-v1"],
  { revalidate: 3600, tags: ["public-stats"] }
);

export async function LiveStatsBar() {
  const stats = await getPublicStats();

  // Floors — hide weak signals rather than showing them.
  const showReplies = stats.totalRepliesGenerated >= 1;
  const showReviews = stats.totalReviewsManaged >= 1;
  const showUsers = stats.totalUsers >= 5;

  if (!showReplies && !showReviews && !showUsers) return null;

  const items: { value: number; label: string }[] = [];
  if (showReplies)
    items.push({
      value: stats.totalRepliesGenerated,
      label: "AI replies generated",
    });
  if (showReviews)
    items.push({
      value: stats.totalReviewsManaged,
      label: "reviews managed",
    });
  if (showUsers)
    items.push({
      value: stats.totalUsers,
      label: "founders & businesses on board",
    });

  return (
    <div
      role="status"
      aria-label="ReviewPilot usage statistics"
      className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground sm:text-xs"
    >
      {items.map((item, idx) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          {idx > 0 && (
            <span aria-hidden className="text-muted-foreground/40">
              •
            </span>
          )}
          <span className="font-mono font-semibold tabular-nums text-foreground/80">
            {formatCount(item.value)}
          </span>
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
