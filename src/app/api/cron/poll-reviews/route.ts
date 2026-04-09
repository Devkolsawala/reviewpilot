import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchPlayStoreReviews } from "@/lib/google/playstore";
import { processAutoReplyForReview } from "@/lib/reviews/auto-reply";
import { checkUsageLimitAdmin, incrementUsageAdmin, getUserPlanAdmin } from "@/lib/usage";
import { isCronSyncAllowed } from "@/lib/plans";
import type { AppContext } from "@/types/database";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const INTERVAL_HOURS: Record<string, number> = {
  "1h": 1,
  "6h": 6,
  "12h": 12,
  "24h": 24,
  "48h": 48,
};

function isScheduleWindowActive(appContext: AppContext): boolean {
  if (!appContext.schedule_enabled) return false;

  try {
    const tz = appContext.schedule_timezone || "UTC";
    const nowInTz = new Date(
      new Date().toLocaleString("en-US", { timeZone: tz })
    );
    const dayOfWeek = nowInTz.getDay();
    const dayMap = [1, 2, 3, 4, 5, 6, 0];
    const days =
      appContext.schedule_days ?? [true, true, true, true, true, true, true];
    const todayEnabled = days[dayMap.indexOf(dayOfWeek)];
    if (!todayEnabled) return false;

    const [schedHour, schedMin] = (appContext.schedule_time || "08:00")
      .split(":")
      .map(Number);
    const nowMinutes = nowInTz.getHours() * 60 + nowInTz.getMinutes();
    const schedMinutes = schedHour * 60 + schedMin;
    return Math.abs(nowMinutes - schedMinutes) <= 30;
  } catch {
    return false;
  }
}

function isWithinAgeWindow(
  reviewCreatedAt: string,
  maxAgeHours: number
): boolean {
  const reviewDate = new Date(reviewCreatedAt).getTime();
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  return reviewDate >= cutoff;
}

async function handleCron(request: NextRequest) {
  const isManualSync = request.method === "POST";

  if (!isManualSync) {
    // Automated cron (GET from Vercel): verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // For POST (manual sync), use the admin client too — the cron route runs server-side
  // and the user's cookie session isn't available here. Auth is implicitly trusted
  // because the route requires a logged-in session to reach (protected by middleware).
  const supabase = getAdminClient();

  const results: Array<{
    connectionId: string;
    name: string;
    type: string;
    skipped?: boolean;
    reviewsFetched: number;
    newReviews: number;
    autoReplied: number;
    drafted: number;
    pendingProcessed: number;
    errors: string[];
  }> = [];

  try {
    const { data: connections, error: connError } = await supabase
      .from("connections")
      .select("*, app_contexts(*)")
      .eq("is_active", true);

    if (connError || !connections || connections.length === 0) {
      return NextResponse.json({
        message: "No active connections",
        results: [],
      });
    }

    for (const connection of connections) {
      const connResult = {
        connectionId: connection.id,
        name: connection.name,
        type: connection.type,
        reviewsFetched: 0,
        newReviews: 0,
        autoReplied: 0,
        drafted: 0,
        pendingProcessed: 0,
        errors: [] as string[],
      };

      const appContext: AppContext | null =
        connection.app_contexts?.[0] ?? null;

      // For automated cron runs, apply plan-based sync cadence
      // (Manual POST from "Sync Now" button always bypasses this check)
      if (!isManualSync) {
        const userPlan = await getUserPlanAdmin(connection.user_id);
        const tz = appContext?.schedule_timezone ?? null;

        if (!isCronSyncAllowed(userPlan, tz)) {
          // Not their sync window — skip silently
          results.push({ ...connResult, skipped: true });
          continue;
        }
      }

      // For automated cron runs, also respect the connection's sync_interval
      if (!isManualSync) {
        const syncInterval = (appContext as AppContext & { sync_interval?: string } | null)?.sync_interval ?? "24h";
        const requiredHours = INTERVAL_HOURS[syncInterval] ?? 24;
        const lastSynced = connection.last_synced_at
          ? new Date(connection.last_synced_at).getTime()
          : 0;
        const hoursSinceLastSync = (Date.now() - lastSynced) / 3600000;

        if (hoursSinceLastSync < requiredHours) {
          results.push({ ...connResult, skipped: true });
          continue;
        }
      }

      const runScheduled = appContext
        ? isScheduleWindowActive(appContext)
        : false;

      try {
        if (
          connection.type === "play_store" &&
          connection.external_id
        ) {
          const fetchedReviews = await fetchPlayStoreReviews(
            connection.external_id,
            connection.credentials as Record<string, unknown> | null
          );
          connResult.reviewsFetched = fetchedReviews.length;
          console.log(
            "[cron] Play fetch",
            connection.id,
            "count",
            fetchedReviews.length
          );

          for (const review of fetchedReviews) {
            const { data: existing } = await supabase
              .from("reviews")
              .select("id")
              .eq("connection_id", connection.id)
              .eq("external_review_id", review.external_review_id)
              .maybeSingle();

            if (existing) continue;

            const { data: inserted, error: insertErr } = await supabase
              .from("reviews")
              .insert({
                connection_id: connection.id,
                source: review.source,
                external_review_id: review.external_review_id,
                author_name: review.author_name,
                rating: review.rating,
                review_text: review.review_text,
                review_language: review.review_language,
                device_info: review.device_info,
                sentiment: review.sentiment,
                keywords: review.keywords,
                review_created_at: review.review_created_at,
              })
              .select(
                "id, source, external_review_id, author_name, rating, review_text, review_language, sentiment, keywords, review_created_at"
              )
              .single();

            if (insertErr || !inserted) {
              if (insertErr)
                connResult.errors.push(`Insert error: ${insertErr.message}`);
              continue;
            }

            connResult.newReviews++;

            if (!appContext) continue;

            const immediateAuto =
              appContext.auto_reply_enabled &&
              (appContext.auto_reply_mode ?? "draft_for_review") !== "manual";

            const scheduledAuto =
              appContext.schedule_enabled &&
              runScheduled &&
              inserted.rating >= (appContext.auto_reply_min_rating ?? 1) &&
              inserted.rating <= (appContext.auto_reply_max_rating ?? 5) &&
              isWithinAgeWindow(
                review.review_created_at,
                appContext.schedule_review_age_hours || 24
              );

            if (!immediateAuto && !scheduledAuto) continue;

            try {
              const usageCheck = await checkUsageLimitAdmin(connection.user_id, "ai_replies");
              if (!usageCheck.allowed) {
                connResult.errors.push(`User limit reached: ${usageCheck.current}/${usageCheck.limit} AI replies used this ${usageCheck.periodLabel}`);
                continue;
              }

              const outcome = await processAutoReplyForReview(
                supabase,
                {
                  id: connection.id,
                  type: connection.type,
                  credentials: connection.credentials as Record<
                    string,
                    unknown
                  > | null,
                  external_id: connection.external_id,
                },
                inserted,
                appContext,
                {
                  fromScheduledCron: !immediateAuto && scheduledAuto,
                }
              );
              if (outcome === "drafted") { connResult.drafted++; await incrementUsageAdmin(connection.user_id, "auto_replies_used", 1); }
              if (outcome === "published") { connResult.autoReplied++; await incrementUsageAdmin(connection.user_id, "auto_replies_used", 1); }
              await new Promise((resolve) => setTimeout(resolve, 2500));
            } catch (replyError: unknown) {
              const e = replyError as { message?: string };
              connResult.errors.push(`Reply error: ${e.message}`);
            }
          }
        }

        if (appContext?.auto_reply_enabled) {
          const { data: pendingRows, error: pendErr } = await supabase
            .from("reviews")
            .select(
              "id, source, external_review_id, author_name, rating, review_text, review_language, sentiment, keywords, review_created_at, reply_text"
            )
            .eq("connection_id", connection.id)
            .eq("reply_status", "pending")
            .limit(80);

          if (pendErr) {
            connResult.errors.push(`Pending query: ${pendErr.message}`);
          } else {
            for (const row of pendingRows || []) {
              if (row.reply_text && String(row.reply_text).trim() !== "")
                continue;

              try {
                const usageCheck = await checkUsageLimitAdmin(connection.user_id, "ai_replies");
                if (!usageCheck.allowed) {
                  connResult.errors.push(`User limit reached at ${usageCheck.current}/${usageCheck.limit} — stopping pending batch`);
                  break;
                }

                const outcome = await processAutoReplyForReview(
                  supabase,
                  {
                    id: connection.id,
                    type: connection.type,
                    credentials: connection.credentials as Record<
                      string,
                      unknown
                    > | null,
                    external_id: connection.external_id,
                  },
                  row,
                  appContext
                );
                if (outcome === "skipped") continue;
                connResult.pendingProcessed++;
                if (outcome === "drafted") { connResult.drafted++; await incrementUsageAdmin(connection.user_id, "auto_replies_used", 1); }
                if (outcome === "published") { connResult.autoReplied++; await incrementUsageAdmin(connection.user_id, "auto_replies_used", 1); }
                await new Promise((resolve) => setTimeout(resolve, 2500));
              } catch (e: unknown) {
                const err = e as { message?: string };
                connResult.errors.push(`Pending auto-reply: ${err.message}`);
              }
            }
          }
        }

        await supabase
          .from("connections")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", connection.id);
      } catch (connProcessError: unknown) {
        const e = connProcessError as { message?: string };
        connResult.errors.push(e.message || "Unknown error");
      }

      results.push(connResult);
    }

    console.log("[cron] poll-reviews done", JSON.stringify(results));

    return NextResponse.json({
      success: true,
      processedAt: new Date().toISOString(),
      connectionsProcessed: results.length,
      results,
    });
  } catch (error: unknown) {
    const e = error as { message?: string };
    console.error("Cron error:", e);
    return NextResponse.json(
      { error: e.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// GET: called by Vercel cron (authenticated via CRON_SECRET)
export async function GET(request: NextRequest) {
  return handleCron(request);
}

// POST: called by "Sync Now" button or manual trigger (authenticated via user session middleware)
export async function POST(request: NextRequest) {
  return handleCron(request);
}
