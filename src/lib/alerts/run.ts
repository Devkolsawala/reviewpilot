/**
 * Instant-alert orchestration + notification-feed inserts.
 *
 * runAlertPass() is the post-classification hook: it receives ONLY the review
 * ids that were classified in the current classify-insights run (never a
 * broad "all negative reviews" query) and is pure post-processing of the
 * ai_sentiment / ai_urgency values that run just wrote. It performs ZERO
 * AI/LLM calls.
 *
 * Idempotency: reviews.alerted_at is stamped via a conditional UPDATE
 * (`WHERE alerted_at IS NULL` + RETURNING). If another process won the race
 * (cron retry, concurrent chain batch), zero rows come back and we skip.
 * Once stamped, a review can never alert again — surviving retries, edits,
 * and re-syncs.
 *
 * Every entry point here is best-effort and swallows its own errors: an
 * alert/notification failure must NEVER break review syncing, classification,
 * or auto-reply.
 */

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { checkUsageLimitAdmin } from "@/lib/usage";
import { renderAlertEmail } from "@/lib/email/templates/alertEmail";
import {
  DEFAULT_ALERT_PREFS,
  shouldAlert,
  starString,
  truncateExcerpt,
  type AlertPrefs,
  type AlertableReview,
} from "./evaluate";

type AdminClient = ReturnType<typeof createAdminClient>;

export type NotificationType =
  | "negative_review"
  | "recovery"
  | "issue_created"
  | "sync_failure"
  | "quota_warning"
  | "digest_sent";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://www.reviewpilot.co.in";
}

/**
 * Inserts a notifications row using a fresh service-role client (so callers
 * holding a user-scoped client still work). Never throws; returns the new
 * row id or null.
 */
export async function insertNotificationSafe(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  reviewId?: string | null;
  emailSent?: boolean;
}): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("notifications")
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        review_id: input.reviewId ?? null,
        email_sent: input.emailSent ?? false,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[alerts] notification insert failed:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[alerts] notification insert error:", err.message);
    return null;
  }
}

/** Bell entry for the passive-recovery path in the cron. Never throws. */
export async function notifyRecovery(input: {
  userId: string;
  reviewId: string;
  newRating: number;
  connectionName: string;
}): Promise<void> {
  await insertNotificationSafe({
    userId: input.userId,
    type: "recovery",
    title: `A customer raised their rating to ${input.newRating}★`,
    body: `A previously negative review on ${input.connectionName} was updated to ${input.newRating} stars.`,
    href: `/dashboard/inbox?review=${input.reviewId}`,
    reviewId: input.reviewId,
  });
}

/** Bell entry when the classifier creates a NEW issue cluster. Never throws. */
export async function notifyIssueCreated(input: {
  userId: string;
  issueId: string;
  label: string;
}): Promise<void> {
  await insertNotificationSafe({
    userId: input.userId,
    type: "issue_created",
    title: `New issue detected: ${input.label}`,
    body: "The AI classifier found a new recurring complaint in your reviews.",
    href: "/dashboard/analytics",
  });
}

/**
 * Inserts a quota_warning notification when AI usage crosses 80% of the
 * period limit — at most once per usage period (guarded by an existence
 * check on notifications created since the current period started).
 * Never throws.
 */
export async function maybeNotifyQuotaWarning(userId: string): Promise<void> {
  try {
    const check = await checkUsageLimitAdmin(userId, "ai_replies");
    if (!Number.isFinite(check.limit) || check.limit <= 0) return; // unlimited plan
    if (check.current < 0.8 * check.limit) return;

    // Current period start = reset date minus one period length. Mirrors
    // USAGE_PERIOD: 7-day user-anchored periods, or N minutes in test mode.
    const testMinutes = parseInt(
      process.env.NEXT_PUBLIC_USAGE_PERIOD_MINUTES || "",
      10
    );
    const periodMs = Number.isFinite(testMinutes) && testMinutes > 0
      ? testMinutes * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;
    const periodStart = new Date(check.resetDate.getTime() - periodMs);

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "quota_warning")
      .gte("created_at", periodStart.toISOString())
      .limit(1)
      .maybeSingle();
    if (existing) return;

    const pct = Math.min(100, Math.round((check.current / check.limit) * 100));
    await insertNotificationSafe({
      userId,
      type: "quota_warning",
      title: `AI quota at ${pct}% — ${check.remaining} repl${check.remaining === 1 ? "y" : "ies"} left this ${check.periodLabel}`,
      body: `You've used ${check.current} of ${check.limit} AI replies this ${check.periodLabel}. Resets ${check.resetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
      href: "/dashboard/settings/billing",
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[alerts] quota warning check failed:", err.message);
  }
}

/**
 * Same token strategy as the digest sender (copied, not refactored — the
 * digest pipeline must stay untouched): the stable per-user token lives on
 * digest_preferences.unsubscribe_token.
 */
async function getOrCreateUnsubscribeToken(
  admin: AdminClient,
  userId: string
): Promise<string> {
  const { data: existing } = await admin
    .from("digest_preferences")
    .select("unsubscribe_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.unsubscribe_token) return existing.unsubscribe_token;

  const token = crypto.randomBytes(24).toString("hex");
  await admin
    .from("digest_preferences")
    .upsert(
      { user_id: userId, unsubscribe_token: token },
      { onConflict: "user_id" }
    );
  return token;
}

interface CandidateRow extends AlertableReview {
  connection_id: string | null;
  author_name: string | null;
}

export interface AlertPassResult {
  evaluated: number;
  alerted: number;
  emailed: number;
  skippedAlreadyAlerted: number;
}

/**
 * The alert pass. `reviewIds` MUST be exactly the set of review ids the
 * caller classified in the current run — this function never widens the
 * query beyond them.
 */
export async function runAlertPass(
  reviewIds: string[]
): Promise<AlertPassResult> {
  const result: AlertPassResult = {
    evaluated: reviewIds.length,
    alerted: 0,
    emailed: 0,
    skippedAlreadyAlerted: 0,
  };
  if (reviewIds.length === 0) return result;

  const admin = createAdminClient();

  const { data: reviews, error: revErr } = await admin
    .from("reviews")
    .select(
      "id, connection_id, rating, review_text, author_name, ai_sentiment, ai_urgency, alerted_at"
    )
    .in("id", reviewIds);
  if (revErr) {
    console.error("[alerts] review load failed:", revErr.message);
    return result;
  }

  // Pre-filter: AI-confirmed negative only, not yet alerted. The 1★-positive
  // false-alarm case is rejected here (and again in shouldAlert).
  const candidates = ((reviews || []) as CandidateRow[]).filter(
    (r) => r.ai_sentiment === "negative" && !r.alerted_at
  );
  if (candidates.length === 0) return result;

  const connectionIds = Array.from(
    new Set(candidates.map((c) => c.connection_id).filter(Boolean))
  ) as string[];
  const { data: conns, error: connErr } = await admin
    .from("connections")
    .select("id, user_id, name")
    .in("id", connectionIds);
  if (connErr) {
    console.error("[alerts] connection load failed:", connErr.message);
    return result;
  }
  const connById = new Map(
    (conns || []).map((c: { id: string; user_id: string; name: string }) => [
      c.id,
      c,
    ])
  );

  // Group candidates per workspace owner so the daily email cap is counted
  // correctly within a single pass.
  const byUser = new Map<string, CandidateRow[]>();
  for (const c of candidates) {
    const conn = c.connection_id ? connById.get(c.connection_id) : undefined;
    if (!conn) continue;
    const list = byUser.get(conn.user_id) ?? [];
    list.push(c);
    byUser.set(conn.user_id, list);
  }

  for (const [userId, userReviews] of Array.from(byUser.entries())) {
    try {
      await processUserAlerts(admin, userId, userReviews, connById, result);
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error(`[alerts] pass failed for user ${userId}:`, err.message);
    }
  }

  return result;
}

async function processUserAlerts(
  admin: AdminClient,
  userId: string,
  userReviews: CandidateRow[],
  connById: Map<string, { id: string; user_id: string; name: string }>,
  result: AlertPassResult
): Promise<void> {
  // Preferences (defaults when the user never opened the settings card).
  const { data: prefRow } = await admin
    .from("alert_preferences")
    .select("enabled, min_rating, keywords, daily_cap")
    .eq("user_id", userId)
    .maybeSingle();
  const prefs: AlertPrefs = {
    enabled: prefRow?.enabled ?? DEFAULT_ALERT_PREFS.enabled,
    min_rating: prefRow?.min_rating ?? DEFAULT_ALERT_PREFS.min_rating,
    keywords: (prefRow?.keywords as string[]) ?? DEFAULT_ALERT_PREFS.keywords,
    daily_cap: prefRow?.daily_cap ?? DEFAULT_ALERT_PREFS.daily_cap,
  };

  // Unsubscribe gate — same table and semantics as the digest sender, with
  // the alert-specific list value.
  let unsubscribed = false;
  {
    const { data: unsubRow } = await admin
      .from("email_unsubscribes")
      .select("id")
      .eq("user_id", userId)
      .in("list", ["alerts", "all"])
      .limit(1)
      .maybeSingle();
    unsubscribed = !!unsubRow;
  }

  const emailEligible = prefs.enabled && !unsubscribed;

  // Today's already-sent alert emails (UTC day) for the daily cap.
  let sentToday = 0;
  if (emailEligible) {
    const startOfTodayUtc = new Date();
    startOfTodayUtc.setUTCHours(0, 0, 0, 0);
    const { count } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "negative_review")
      .eq("email_sent", true)
      .gte("created_at", startOfTodayUtc.toISOString());
    sentToday = count ?? 0;
  }

  // Resolve recipient + unsubscribe token lazily (only when an email will
  // actually be attempted).
  let recipientEmail: string | null | undefined;
  let unsubToken: string | undefined;

  for (const review of userReviews) {
    const verdict = shouldAlert(review, prefs);
    if (!verdict.alert) continue;

    // ── Idempotency gate (atomic) ─────────────────────────────────────────
    // UPDATE … WHERE alerted_at IS NULL RETURNING id. Zero rows back means
    // another process (cron retry / concurrent batch) already alerted this
    // review — skip entirely.
    const { data: claimed, error: claimErr } = await admin
      .from("reviews")
      .update({ alerted_at: new Date().toISOString() })
      .eq("id", review.id)
      .is("alerted_at", null)
      .select("id");
    if (claimErr) {
      console.error("[alerts] claim failed:", claimErr.message);
      continue;
    }
    if (!claimed || claimed.length === 0) {
      result.skippedAlreadyAlerted++;
      continue;
    }

    const conn = review.connection_id
      ? connById.get(review.connection_id)
      : undefined;
    const appName = conn?.name || "your app";
    const excerpt = truncateExcerpt(review.review_text, 300);
    const ratingLabel =
      typeof review.rating === "number" ? `${review.rating}★` : "Negative";
    const href = `/dashboard/inbox?review=${review.id}`;

    // ── Bell notification (always inserted, even past the email cap) ─────
    const notificationId = await insertNotificationSafe({
      userId,
      type: "negative_review",
      title: `New ${ratingLabel} review on ${appName}`,
      body: excerpt || "(no review text)",
      href,
      reviewId: review.id,
    });
    result.alerted++;

    // ── Email (pref-gated, unsubscribe-gated, daily-capped) ──────────────
    if (!emailEligible || sentToday >= prefs.daily_cap) continue;

    try {
      if (recipientEmail === undefined) {
        const { data: authUser } = await admin.auth.admin.getUserById(userId);
        recipientEmail = authUser?.user?.email ?? null;
      }
      if (!recipientEmail) continue;
      if (!unsubToken) {
        unsubToken = await getOrCreateUnsubscribeToken(admin, userId);
      }

      const isLastAllowedToday = sentToday + 1 >= prefs.daily_cap;
      const base = appUrl();
      const { subject, html, text } = renderAlertEmail({
        appName,
        rating: review.rating,
        stars: starString(review.rating),
        authorName: review.author_name,
        excerpt,
        aiSentiment: review.ai_sentiment || "negative",
        aiUrgency: review.ai_urgency,
        matchedKeyword: verdict.matchedKeyword,
        reviewUrl: `${base}${href}`,
        settingsUrl: `${base}/dashboard/settings/notifications`,
        unsubscribeUrl: `${base}/api/alerts/unsubscribe?token=${unsubToken}`,
        capNote: isLastAllowedToday
          ? "Further alerts today will appear in your dashboard only."
          : null,
      });

      const sendRes = await sendEmail({
        to: recipientEmail,
        subject,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${base}/api/alerts/unsubscribe?token=${unsubToken}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      if (sendRes.success) {
        sentToday++;
        result.emailed++;
        if (notificationId) {
          await admin
            .from("notifications")
            .update({ email_sent: true })
            .eq("id", notificationId);
        }
      } else {
        console.error("[alerts] email send failed:", sendRes.error);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error("[alerts] email step failed:", err.message);
    }
  }
}
