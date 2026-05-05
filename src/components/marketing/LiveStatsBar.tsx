import { unstable_cache } from "next/cache";
import { Sparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCount } from "@/lib/format";

interface PublicStats {
  totalRepliesGenerated: number;
  totalReviewsManaged: number;
}

const FALLBACK: PublicStats = {
  totalRepliesGenerated: 0,
  totalReviewsManaged: 0,
};

// Below this threshold we display a rounded "1,000+" placeholder so the
// homepage carries social proof from day one. Once the real combined count
// reaches the threshold the bar automatically switches to the live number.
const SOCIAL_PROOF_FLOOR = 1000;

const getPublicStats = unstable_cache(
  async (): Promise<PublicStats> => {
    try {
      const supabase = createAdminClient();
      const [repliesAgg, reviewsCount] = await Promise.all([
        supabase.from("usage").select("ai_replies_used, auto_replies_used"),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
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
      };
    } catch (err) {
      console.error("[LiveStatsBar] stats query failed:", err);
      return FALLBACK;
    }
  },
  ["public-stats-v3"],
  { revalidate: 3600, tags: ["public-stats"] }
);

export async function LiveStatsBar() {
  const stats = await getPublicStats();
  const combined = stats.totalRepliesGenerated + stats.totalReviewsManaged;

  const display =
    combined >= SOCIAL_PROOF_FLOOR
      ? `${formatCount(combined)}+`
      : `${formatCount(SOCIAL_PROOF_FLOOR)}+`;

  return (
    <div
      role="status"
      aria-label="ReviewPilot usage statistics"
      className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
    >
      <span className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 backdrop-blur-sm shadow-sm transition-colors hover:border-accent/40">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {display}
        </span>
        <span className="text-xs text-muted-foreground">
          reviews replied &amp; managed
        </span>
      </span>
    </div>
  );
}
