/**
 * Sends a digest email for a single user. Owns:
 *   - reading digest_preferences and gating on enable flags
 *   - period_start computation in user TZ
 *   - idempotency check against digest_logs (unique index handles race)
 *   - unsubscribe check against email_unsubscribes (list='digest' or 'all')
 *   - skip-if-no-activity logic
 *   - rendering + sending via the Resend wrapper (incl. List-Unsubscribe header)
 *   - audit log row insert (sent / skipped_* / failed / disabled / no_recipient)
 *
 * Test sends (isTest=true):
 *   - bypass enable flags, unsubscribe checks, skip-if-no-activity, and
 *     idempotency
 *   - ALWAYS write a digest_logs row with is_test=true so the user can see
 *     the result in the recent-history panel
 *   - use period_start = now() (a unique value) and rely on the partial
 *     unique index (where is_test=false) so they cannot collide with each
 *     other or with real sends
 *
 * already_sent path is the only status that does NOT write a log row, since
 * the existing log already represents that send.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { getDigestCcLimit } from "@/lib/plans";
import { buildDigest, type DigestPeriod } from "./aggregate";
import { renderDailyDigest } from "@/lib/email/templates/dailyDigest";
import {
  startOfTodayInTzAsUtc,
  mostRecentWeeklySlotAsUtc,
} from "./tz";
import crypto from "crypto";

type SendResult = {
  ok: boolean;
  status: string;
  messageId?: string;
  error?: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

async function getOrCreateUnsubscribeToken(
  supabase: AdminClient,
  userId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("digest_preferences")
    .select("unsubscribe_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.unsubscribe_token) return existing.unsubscribe_token;

  const token = crypto.randomBytes(24).toString("hex");
  await supabase
    .from("digest_preferences")
    .upsert(
      { user_id: userId, unsubscribe_token: token },
      { onConflict: "user_id" }
    );
  return token;
}

async function writeLog(
  supabase: AdminClient,
  row: {
    user_id: string;
    digest_type: DigestPeriod;
    period_start: string;
    period_end: string;
    status: string;
    is_test: boolean;
    recipient_email?: string | null;
    cc_emails?: string[];
    error_message?: string | null;
    payload?: Record<string, unknown> | null;
    resend_message_id?: string | null;
  }
) {
  const { error } = await supabase.from("digest_logs").insert(row);
  if (error) {
    console.error("[digest_logs insert]", error.message, "row:", row);
  }
}

export async function sendDigestForUser(opts: {
  userId: string;
  period: DigestPeriod;
  now: Date;
  isTest?: boolean;
}): Promise<SendResult> {
  const { userId, period, now, isTest = false } = opts;
  const supabase = createAdminClient();

  // 1. Load preferences
  const { data: prefs } = await supabase
    .from("digest_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // Compute period_start. Test sends use `now()` so they're unique per send
  // and don't collide with real sends or with each other.
  const timezone = prefs?.timezone || "Asia/Kolkata";
  const realPeriodStart =
    period === "daily"
      ? startOfTodayInTzAsUtc(now, timezone)
      : mostRecentWeeklySlotAsUtc(
          now,
          timezone,
          prefs?.weekly_send_dow ?? 1,
          prefs?.weekly_send_hour ?? 9
        );
  const periodStart = isTest ? now : realPeriodStart;
  const periodEnd = now;

  const baseLog = {
    user_id: userId,
    digest_type: period,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    is_test: isTest,
  };

  // 2. Disabled check (real sends only — test sends always proceed)
  if (!isTest) {
    if (!prefs) {
      await writeLog(supabase, { ...baseLog, status: "disabled" });
      return { ok: false, status: "disabled" };
    }
    const enabled =
      period === "daily" ? prefs.daily_enabled : prefs.weekly_enabled;
    if (!enabled) {
      await writeLog(supabase, { ...baseLog, status: "disabled" });
      return { ok: false, status: "disabled" };
    }
  }

  // 3. Idempotency check (real sends only)
  if (!isTest) {
    const { data: priorLog } = await supabase
      .from("digest_logs")
      .select("id, status")
      .eq("user_id", userId)
      .eq("digest_type", period)
      .eq("period_start", realPeriodStart.toISOString())
      .eq("is_test", false)
      .maybeSingle();
    if (priorLog) {
      // Don't double-log — the existing row already represents this send.
      return { ok: true, status: "already_sent" };
    }
  }

  // 4. Profile lookup
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, full_name, company_name")
    .eq("id", userId)
    .single();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const profileEmail = authUser?.user?.email || null;

  const recipientEmail = prefs?.recipient_email || profileEmail;
  if (!recipientEmail) {
    await writeLog(supabase, {
      ...baseLog,
      status: "no_recipient",
      error_message: "No recipient email available",
    });
    return { ok: false, status: "no_recipient" };
  }

  // 5. Unsubscribe check (real sends only)
  if (!isTest) {
    const { data: unsubRow } = await supabase
      .from("email_unsubscribes")
      .select("id, list")
      .eq("user_id", userId)
      .in("list", ["digest", "all"])
      .limit(1)
      .maybeSingle();
    if (unsubRow) {
      await writeLog(supabase, {
        ...baseLog,
        status: "skipped_unsubscribed",
        recipient_email: recipientEmail,
      });
      return { ok: false, status: "skipped_unsubscribed" };
    }
  }

  // 6. Build payload
  const payload = await buildDigest(userId, period, now);

  // 7. Skip-if-no-activity (real sends only)
  if (
    !isTest &&
    !payload.hasActivity &&
    (prefs?.skip_if_no_activity ?? true)
  ) {
    await writeLog(supabase, {
      ...baseLog,
      status: "skipped_no_activity",
      recipient_email: recipientEmail,
    });
    return { ok: true, status: "skipped_no_activity" };
  }

  // 8. CC recipients (plan-gated)
  const planId = profile?.plan || "free";
  const ccLimit = getDigestCcLimit(planId);
  const ccEmails = ((prefs?.cc_emails as string[]) || []).slice(0, ccLimit);

  // 9. Render
  const unsubToken = await getOrCreateUnsubscribeToken(supabase, userId);
  const userName = profile?.full_name || profile?.company_name || "there";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reviewpilot.app";

  const { subject, html, text } = renderDailyDigest(payload, {
    userName,
    appUrl,
    unsubscribeToken: unsubToken,
    includeLowestRated: prefs?.include_lowest_rated ?? true,
    includeTopKeywords: prefs?.include_top_keywords ?? true,
    includeQuotaUsage: prefs?.include_quota_usage ?? true,
  });

  // 10. Send. RFC 8058 one-click headers — Gmail/Apple Mail render a native
  // "Unsubscribe" affordance from these. The HTTP target accepts POST via
  // a middleware rewrite (POST /u/[token] → /api/digest/oneclick).
  const listUnsubHeaders: Record<string, string> = {
    "List-Unsubscribe": `<${appUrl}/u/${unsubToken}?list=digest>, <mailto:unsubscribe@reviewpilot.co.in?subject=unsubscribe-digest>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };

  const sendRes = await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
    cc: ccEmails.length > 0 ? ccEmails : undefined,
    headers: listUnsubHeaders,
  });

  // 11. Audit log — always written, including for test sends
  if (sendRes.success) {
    await writeLog(supabase, {
      ...baseLog,
      status: "sent",
      recipient_email: recipientEmail,
      cc_emails: ccEmails,
      payload: payload as unknown as Record<string, unknown>,
      resend_message_id: sendRes.id,
    });
    return { ok: true, status: "sent", messageId: sendRes.id };
  } else {
    await writeLog(supabase, {
      ...baseLog,
      status: "failed",
      recipient_email: recipientEmail,
      cc_emails: ccEmails,
      error_message: sendRes.error || "send failed",
    });
    return { ok: false, status: "failed", error: sendRes.error };
  }
}
