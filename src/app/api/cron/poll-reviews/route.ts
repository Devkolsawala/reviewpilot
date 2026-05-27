import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processAutoReplyForReview } from "@/lib/reviews/auto-reply";
import { checkUsageLimitAdmin, incrementUsageAdmin } from "@/lib/usage";
import { GBP_ENABLED } from "@/lib/feature-flags";
import { extractCountryFromLocale } from "@/lib/utils/locale-to-country";
import { classifyReviewOnly } from "@/lib/ai/reply-generator";
import { linkRecoverableReview } from "@/lib/reviews/issues";
import type { AppContext } from "@/types/database";

// Issue-classifier pass budget — strict caps so the classification work
// never extends the cron beyond comfortable bounds. The earlier sync/push
// phases run to completion FIRST (and last_synced_at is updated before this
// pass runs), so even hitting either cap leaves the core flow unaffected.
const CLASSIFIER_MAX_PER_CONNECTION = 8;
const CLASSIFIER_MAX_WALL_MS = 25_000;

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
    classified: number;
    issuesLinked: number;
    errors: string[];
  }> = [];

  // Shared wall-clock budget for the classifier pass across ALL connections.
  // Anchored to "after sync/push completes" so the value here is just an
  // upper-bound safety net for the classification phase only.
  const classifierBudget = { startedAt: 0, exhausted: false };

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
        classified: 0,
        issuesLinked: 0,
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
            // Pre-check existence to gate auto-reply on truly new rows AND to
            // detect end-user edits (text or rating changed upstream). Edits
            // are persisted in-place so the UI reflects the new content,
            // sentiment is realigned to the new rating, and edited_at gets
            // stamped so the inbox can show an "Edited" badge. We still skip
            // the auto-reply path for edited rows — they already have a reply.
            const { data: existing } = await supabase
              .from("reviews")
              .select("id, rating, review_text, sentiment")
              .eq("connection_id", connection.id)
              .eq("external_review_id", review.external_review_id)
              .maybeSingle();

            if (existing) {
              const textChanged =
                (existing.review_text || "") !== (review.review_text || "");
              const ratingChanged =
                typeof review.rating === "number" &&
                existing.rating !== review.rating;

              if (textChanged || ratingChanged) {
                // Recompute sentiment from the new rating. Keep 'mixed' if it
                // was set out-of-band; otherwise use the rating-derived value.
                // Fall back to existing sentiment if rating is somehow null
                // on the fetched review (shouldn't happen for Play Store).
                const r = review.rating;
                const newSentiment =
                  existing.sentiment === "mixed"
                    ? "mixed"
                    : typeof r === "number"
                      ? r >= 4
                        ? "positive"
                        : r <= 2
                          ? "negative"
                          : "neutral"
                      : existing.sentiment;

                const editPayload: Record<string, unknown> = {
                  edited_at: new Date().toISOString(),
                };
                if (textChanged) editPayload.review_text = review.review_text;
                if (ratingChanged) {
                  editPayload.rating = review.rating;
                  editPayload.sentiment = newSentiment;
                }

                const { error: editErr } = await supabase
                  .from("reviews")
                  .update(editPayload)
                  .eq("id", existing.id);

                if (editErr) {
                  connResult.errors.push(`Edit update: ${editErr.message}`);
                } else {
                  log(
                    `[CRON] Edit detected on review ${existing.id} (text=${textChanged}, rating=${ratingChanged})`
                  );
                }
              }
              continue;
            }

            const { data: inserted, error: insertErr } = await supabase
              .from("reviews")
              .upsert(
                {
                  connection_id: connection.id,
                  source: review.source,
                  external_review_id: review.external_review_id,
                  author_name: review.author_name,
                  rating: review.rating,
                  // First-insert baseline for passive recovery detection.
                  // This row only reaches the upsert when no existing record
                  // matched the (connection_id, external_review_id) pre-check
                  // above, so it's always a true first insert.
                  original_rating: review.rating,
                  review_text: review.review_text,
                  review_language: review.review_language,
                  reviewer_country: extractCountryFromLocale(review.review_language),
                  device_info: review.device_info,
                  sentiment: review.sentiment,
                  keywords: review.keywords,
                  review_created_at: review.review_created_at,
                  // App version (migration 039). Mirrors the same fields in
                  // /api/reviews/fetch so the 2-hour cron path also populates
                  // them. Both may be NULL when Google's API didn't send
                  // version metadata for a review (web reviews, certain
                  // device configs) — per their docs, this is normal.
                  app_version_name: review.app_version_name ?? null,
                  app_version_code: review.app_version_code ?? null,
                },
                { onConflict: "connection_id,external_review_id" }
              )
              .select(
                "id, source, external_review_id, author_name, rating, review_text, review_language, sentiment, keywords, review_created_at"
              )
              .single();

            if (insertErr || !inserted) {
              if (insertErr)
                connResult.errors.push(`Upsert error: ${insertErr.message}`);
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

          // RECOVERY DETECTION — passive. For every fetched review that is
          // ALREADY in our DB with recovery_status='monitoring', see if its
          // rating climbed to 4+. Absence from the API response is NOT a
          // signal (Play API only returns ~1 week window).
          try {
            const fetchedIds = fetchedReviews.map((r) => r.external_review_id);
            if (fetchedIds.length > 0) {
              const { data: monitoredRows, error: monErr } = await supabase
                .from("reviews")
                .select("id, external_review_id, original_rating")
                .eq("connection_id", connection.id)
                .eq("recovery_status", "monitoring")
                .in("external_review_id", fetchedIds);

              if (monErr) {
                connResult.errors.push(`Recovery query: ${monErr.message}`);
              } else if (monitoredRows && monitoredRows.length > 0) {
                const fetchedByExt = new Map(
                  fetchedReviews.map((r) => [r.external_review_id, r])
                );
                let recoveredCount = 0;
                for (const row of monitoredRows) {
                  const live = fetchedByExt.get(row.external_review_id);
                  if (!live) continue;
                  const newRating = live.rating;
                  const baseline = row.original_rating;
                  if (
                    typeof newRating === "number" &&
                    newRating >= 4 &&
                    typeof baseline === "number" &&
                    baseline <= 3
                  ) {
                    // Realign sentiment alongside the recovery flip — the
                    // edit-detection branch above ALSO does this for general
                    // edits, but a monitored review whose first observation
                    // here is the climb-to-4+ skips that branch (no text
                    // change) so we mirror the update locally.
                    const { error: upErr } = await supabase
                      .from("reviews")
                      .update({
                        rating: newRating,
                        sentiment: "positive",
                        recovery_status: "recovered",
                        recovery_detected_at: new Date().toISOString(),
                      })
                      .eq("id", row.id);
                    if (!upErr) recoveredCount++;
                  }
                }
                if (recoveredCount > 0) {
                  log(`[CRON] Recovery detected: ${recoveredCount} review(s) climbed to 4+ stars`);
                }
              }
            }
          } catch (recErr: unknown) {
            const re = recErr as { message?: string };
            log(`[CRON] Recovery detection error: ${re.message}`);
          }
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

        // ISSUE CLASSIFIER PASS — runs AFTER all sync/push/auto-reply work and
        // AFTER last_synced_at is updated. Strictly isolated: any failure here
        // is logged but cannot retroactively affect the connection's sync
        // result. This is what makes Active Issues populate for users in
        // manual mode who never trigger reply generation.
        try {
          if (!classifierBudget.startedAt) classifierBudget.startedAt = Date.now();

          if (!classifierBudget.exhausted) {
            const { data: unclassified, error: ucErr } = await supabase
              .from("reviews")
              .select("id, rating, review_text, author_name")
              .eq("connection_id", connection.id)
              .lte("rating", 3)
              .gte("rating", 1)
              .is("classification_at", null)
              .order("review_created_at", { ascending: false })
              .limit(CLASSIFIER_MAX_PER_CONNECTION);

            if (ucErr) {
              log(`[CRON] Classifier query error: ${ucErr.message}`);
              connResult.errors.push(`Classifier query: ${ucErr.message}`);
            } else if (unclassified && unclassified.length > 0) {
              log(`[CRON] Classifying ${unclassified.length} unclassified negative review(s)`);

              for (const row of unclassified) {
                if (Date.now() - classifierBudget.startedAt > CLASSIFIER_MAX_WALL_MS) {
                  classifierBudget.exhausted = true;
                  log(`[CRON] Classifier wall-budget exhausted — deferring remainder to next run`);
                  break;
                }

                // Per-review usage check — classification consumes the same
                // AI-replies budget as reply gen (it's a model call). Skip
                // silently when the user is at cap so we don't surface a
                // scary error; we'll retry next cron.
                const usageCheck = await checkUsageLimitAdmin(connection.user_id, "ai_replies");
                if (!usageCheck.allowed) {
                  log(`[CRON] Classifier skipped — user at AI replies cap (${usageCheck.current}/${usageCheck.limit})`);
                  break;
                }

                const result = await classifyReviewOnly({
                  reviewId: row.id,
                  rating: row.rating,
                  review_text: row.review_text,
                  author_name: row.author_name,
                });

                if (!result.ok) {
                  // Soft failure — leave classification_at null so we retry next pass.
                  continue;
                }

                // Persist verdict + stamp classification_at so we don't reclassify next run.
                const { error: updErr } = await supabase
                  .from("reviews")
                  .update({
                    is_recoverable: result.recoverable,
                    issue_label: result.issue_label,
                    classification_at: new Date().toISOString(),
                  })
                  .eq("id", row.id);

                if (updErr) {
                  connResult.errors.push(`Classifier update: ${updErr.message}`);
                  continue;
                }

                connResult.classified++;
                await incrementUsageAdmin(connection.user_id, "ai_replies_used", 1);

                if (result.recoverable && result.issue_label) {
                  const linked = await linkRecoverableReview(supabase, {
                    userId: connection.user_id,
                    connectionId: connection.id,
                    reviewId: row.id,
                    rating: row.rating,
                    issueLabel: result.issue_label,
                  });
                  if (linked) connResult.issuesLinked++;
                }

                // Tiny pause between calls — same courtesy gap as the reply loop.
                await new Promise((resolve) => setTimeout(resolve, 800));
              }

              if (connResult.classified > 0) {
                log(`[CRON] Classified ${connResult.classified} review(s), linked ${connResult.issuesLinked} issue(s)`);
              }
            }
          } else {
            log(`[CRON] Classifier skipped for ${connection.id} — wall-budget already exhausted this run`);
          }
        } catch (clsErr: unknown) {
          const ce = clsErr as { message?: string };
          // Hard isolation — never let classifier errors bubble out and
          // affect connResult.skipped or sync results.
          log(`[CRON] Classifier pass error (isolated, sync result unchanged): ${ce.message}`);
          connResult.errors.push(`Classifier: ${ce.message}`);
        }

        // ── Auto-classify AI insights (fire-and-forget) ────────────────────
        // Mirrors the /api/reviews/fetch behavior so the automated cron also
        // populates ai_theme/ai_aspects/ai_sentiment for new reviews. Gated by
        // AUTO_CLASSIFY_ON_SYNC=true so it can be disabled in environments
        // that don't want xAI cost in the cron path. STRICTLY isolated —
        // failure here must not affect this connection's sync result.
        try {
          const autoClassifyEnabled =
            process.env.AUTO_CLASSIFY_ON_SYNC === "true";
          if (autoClassifyEnabled && connResult.newReviews > 0) {
            const appUrl =
              process.env.NEXT_PUBLIC_APP_URL ||
              "https://www.reviewpilot.co.in";
            const cronSecret = process.env.CRON_SECRET;
            if (cronSecret) {
              void fetch(`${appUrl}/api/internal/classify-insights`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${cronSecret}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  batchSize: 15,
                  userId: connection.user_id,
                  chainCount: 0,
                }),
              }).catch((err) => {
                console.log(
                  `[CRON] Auto-classify fire-and-forget failed (non-blocking): ${err?.message ?? err}`
                );
              });
              log(
                `[CRON] Auto-classify triggered for user ${connection.user_id} (${connResult.newReviews} new review(s))`
              );
            } else {
              log(`[CRON] Auto-classify skipped — CRON_SECRET not set`);
            }
          }
        } catch (acErr: unknown) {
          const ae = acErr as { message?: string };
          log(
            `[CRON] Auto-classify trigger skipped (isolated): ${ae.message}`
          );
        }
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
