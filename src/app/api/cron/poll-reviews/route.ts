import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processAutoReplyForReview } from "@/lib/reviews/auto-reply";
import { checkUsageLimitAdmin, incrementUsageAdmin } from "@/lib/usage";
import { GBP_ENABLED } from "@/lib/feature-flags";
import type { AppContext } from "@/types/database";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, key);
}

// Fixed 2-hour sync interval for all plans (no per-plan gating)
const SYNC_INTERVAL_HOURS = 2;

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
  const logs: string[] = [];

  function log(msg: string) {
    console.log(msg);
    logs.push(msg);
  }

  log(`[CRON] === POLL REVIEWS TRIGGERED ===`);
  log(`[CRON] Method: ${request.method}`);
  log(`[CRON] Time: ${new Date().toISOString()}`);
  log(`[CRON] Auth header present: ${!!request.headers.get("authorization")}`);
  log(`[CRON] CRON_SECRET env present: ${!!process.env.CRON_SECRET}`);

  if (!isManualSync) {
    // Automated cron (GET from Cloudflare Worker): verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      log(`[CRON] WARNING: CRON_SECRET not set in environment — allowing request`);
    } else if (authHeader !== `Bearer ${cronSecret}`) {
      log(`[CRON] AUTH FAILED — secret mismatch`);
      log(`[CRON] Expected: Bearer ${cronSecret.substring(0, 4)}...`);
      log(`[CRON] Got: ${authHeader?.substring(0, 15) || "null"}`);
      return NextResponse.json(
        {
          error: "Unauthorized",
          hint: "CRON_SECRET mismatch between Cloudflare Worker and Vercel",
        },
        { status: 401 }
      );
    } else {
      log(`[CRON] Auth passed`);
    }
  } else {
    log(`[CRON] Manual sync — skipping auth check`);
  }

  const supabase = getAdminClient();

  // Supabase health check
  try {
    const { error: healthError } = await supabase
      .from("connections")
      .select("id", { count: "exact", head: true });

    if (healthError) {
      log(`[CRON] Supabase health check FAILED: ${healthError.message}`);
      return NextResponse.json(
        {
          error: "Database connection failed",
          detail: healthError.message,
          hint: "Check SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables",
          logs,
        },
        { status: 500 }
      );
    }
    log(`[CRON] Supabase health check: OK`);
  } catch (healthErr: unknown) {
    const e = healthErr as { message?: string };
    log(`[CRON] Supabase health check exception: ${e.message}`);
  }

  // Safety net: downgrade users whose subscription_cancel_at has passed and webhook was missed
  try {
    const { data: expiredSubs } = await supabase
      .from("profiles")
      .select("id, plan")
      .not("subscription_cancel_at", "is", null)
      .lt("subscription_cancel_at", new Date().toISOString())
      .neq("plan", "free");

    if (expiredSubs && expiredSubs.length > 0) {
      for (const profile of expiredSubs) {
        await supabase
          .from("profiles")
          .update({
            plan: "free",
            razorpay_subscription_id: null,
            subscription_cancel_at: null,
          })
          .eq("id", profile.id);
        log(`[CRON] Auto-downgraded expired user ${profile.id} from ${profile.plan} to free`);
      }
    }
  } catch (safetyErr) {
    console.error("[CRON] Safety downgrade check failed:", safetyErr);
  }

  const results: Array<{
    connectionId: string;
    name: string;
    type: string;
    skipped?: boolean;
    skipReason?: string;
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

    if (connError) {
      log(`[CRON] Connection query error: ${connError.message}`);
      return NextResponse.json(
        {
          error: "Failed to query connections",
          detail: connError.message,
          logs,
        },
        { status: 500 }
      );
    }

    log(`[CRON] Active connections found: ${connections?.length || 0}`);

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active connections",
        results: [],
        logs,
        environment: buildEnvDiagnostics(),
      });
    }

    for (const connection of connections) {
      log(`[CRON] --- Processing: ${connection.name} (${connection.type}) ---`);
      log(`[CRON] Connection ID: ${connection.id}`);
      log(`[CRON] Package/External ID: ${connection.external_id || "(none)"}`);
      log(`[CRON] Has credentials: ${!!connection.credentials}`);
      log(`[CRON] Last synced: ${connection.last_synced_at || "(never)"}`);

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

      // For automated cron: check 2-hour interval (no per-plan gating)
      if (!isManualSync) {
        const lastSync = connection.last_synced_at
          ? new Date(connection.last_synced_at).getTime()
          : 0;
        const hoursSinceSync = (Date.now() - lastSync) / 3600000;

        log(`[CRON] Hours since last sync: ${Math.round(hoursSinceSync * 10) / 10}h`);
        log(`[CRON] Required interval: ${SYNC_INTERVAL_HOURS}h`);

        if (hoursSinceSync < SYNC_INTERVAL_HOURS) {
          log(`[CRON] Skipping — synced ${Math.round(hoursSinceSync * 10) / 10}h ago (need ${SYNC_INTERVAL_HOURS}h gap)`);
          results.push({ ...connResult, skipped: true, skipReason: `Last synced ${Math.round(hoursSinceSync * 10) / 10}h ago` });
          continue;
        }

        log(`[CRON] Proceeding with sync`);
      } else {
        log(`[CRON] Manual sync — bypassing interval check`);
      }

      const runScheduled = appContext
        ? isScheduleWindowActive(appContext)
        : false;

      try {
        if (connection.type === "play_store" && connection.external_id) {
          log(`[CRON] Fetching Play Store reviews for: ${connection.external_id}`);

          let fetchPlayStoreReviews: typeof import("@/lib/google/playstore").fetchPlayStoreReviews;
          try {
            const playstore = await import("@/lib/google/playstore");
            fetchPlayStoreReviews = playstore.fetchPlayStoreReviews;
          } catch (importErr: unknown) {
            const ie = importErr as { message?: string };
            const errMsg = `Play Store lib unavailable: ${ie.message}`;
            log(`[CRON] ERROR: ${errMsg}`);
            connResult.errors.push(errMsg);
            results.push(connResult);
            continue;
          }

          let fetchedReviews;
          try {
            fetchedReviews = await fetchPlayStoreReviews(
              connection.external_id,
              connection.credentials as Record<string, unknown> | null
            );
          } catch (fetchErr: unknown) {
            const fe = fetchErr as { message?: string };
            const errMsg = `Play Store fetch failed: ${fe.message}`;
            log(`[CRON] ERROR: ${errMsg}`);
            connResult.errors.push(errMsg);
            results.push(connResult);
            // Still update last_synced_at so we don't hammer on failure
            await supabase
              .from("connections")
              .update({ last_synced_at: new Date().toISOString() })
              .eq("id", connection.id);
            continue;
          }

          connResult.reviewsFetched = fetchedReviews.length;
          log(`[CRON] Reviews fetched from API: ${fetchedReviews.length}`);

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
                const limitMsg = `User limit reached: ${usageCheck.current}/${usageCheck.limit} AI replies used this ${usageCheck.periodLabel}`;
                log(`[CRON] ${limitMsg}`);
                connResult.errors.push(limitMsg);
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
              if (outcome === "drafted") {
                connResult.drafted++;
                await incrementUsageAdmin(connection.user_id, "auto_replies_used", 1);
              }
              if (outcome === "published") {
                connResult.autoReplied++;
                await incrementUsageAdmin(connection.user_id, "auto_replies_used", 1);
              }
              await new Promise((resolve) => setTimeout(resolve, 2500));
            } catch (replyError: unknown) {
              const e = replyError as { message?: string };
              connResult.errors.push(`Reply error: ${e.message}`);
            }
          }

          log(`[CRON] New reviews inserted: ${connResult.newReviews}`);
        } else if (connection.type === "google_business") {
          if (!GBP_ENABLED) {
            log(`[CRON] GBP connection — skipping (GBP_ENABLED=false, awaiting Google API access)`);
          } else {
            log(`[CRON] GBP connection — handler not yet implemented`);
          }
        } else {
          log(`[CRON] Unknown connection type: ${connection.type} — skipping`);
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
            log(`[CRON] Pending auto-reply rows to process: ${(pendingRows || []).length}`);
            for (const row of pendingRows || []) {
              if (row.reply_text && String(row.reply_text).trim() !== "")
                continue;

              try {
                const usageCheck = await checkUsageLimitAdmin(connection.user_id, "ai_replies");
                if (!usageCheck.allowed) {
                  const limitMsg = `User limit reached at ${usageCheck.current}/${usageCheck.limit} — stopping pending batch`;
                  log(`[CRON] ${limitMsg}`);
                  connResult.errors.push(limitMsg);
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
                if (outcome === "drafted") {
                  connResult.drafted++;
                  await incrementUsageAdmin(connection.user_id, "auto_replies_used", 1);
                }
                if (outcome === "published") {
                  connResult.autoReplied++;
                  await incrementUsageAdmin(connection.user_id, "auto_replies_used", 1);
                }
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

        log(`[CRON] Updated last_synced_at for connection ${connection.id}`);
      } catch (connProcessError: unknown) {
        const e = connProcessError as { message?: string };
        const errMsg = e.message || "Unknown error";
        log(`[CRON] Connection processing error: ${errMsg}`);
        connResult.errors.push(errMsg);
      }

      results.push(connResult);
    }

    log(`[CRON] === DONE: ${results.length} connection(s) processed ===`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: buildEnvDiagnostics(),
      connectionsFound: connections.length,
      connectionsProcessed: results.filter((r) => !r.skipped).length,
      connectionsSkipped: results.filter((r) => r.skipped).length,
      results,
      logs,
    });
  } catch (error: unknown) {
    const e = error as { message?: string };
    log(`[CRON] Top-level error: ${e.message}`);
    console.error("Cron error:", e);
    return NextResponse.json(
      { error: e.message || "Unknown error", logs },
      { status: 500 }
    );
  }
}

function buildEnvDiagnostics() {
  return {
    supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    service_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    cron_secret_set: !!process.env.CRON_SECRET,
    groq_key_set: !!process.env.GROQ_API_KEY,
    play_service_email_set: !!process.env.NEXT_PUBLIC_PLAY_SERVICE_ACCOUNT_EMAIL,
    play_service_key_set: !!process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY,
  };
}

// GET: called by Cloudflare Worker cron (authenticated via CRON_SECRET)
export async function GET(request: NextRequest) {
  return handleCron(request);
}

// POST: called by "Sync Now" button or manual trigger (authenticated via user session middleware)
export async function POST(request: NextRequest) {
  return handleCron(request);
}
