/**
 * Sends a digest email for a single user. Owns:
 *   - reading digest_preferences and gating on enable flags
 *   - period_start computation in user TZ
 *   - idempotency check against digest_logs (unique index handles race)
 *   - unsubscribe check against email_unsubscribes (list='digest' or 'all')
 *   - skip-if-no-activity logic
 *   - rendering + sending via the Resend wrapper
 *   - audit log row insert (sent / skipped_* / failed)
 *
 * Test sends bypass enable flags, unsubscribe checks, and idempotency, but
 * do not write a digest_logs row (so they don't block real sends for the
 * same period).
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

async function getOrCreateUnsubscribeToken(
  supabase: ReturnType<typeof createAdminClient>,
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

  if (!prefs && !isTest) return { ok: false, status: "disabled" };
  const enabled =
    period === "daily" ? prefs?.daily_enabled : prefs?.weekly_enabled;
  if (!enabled && !isTest) return { ok: false, status: "disabled" };

  const timezone = prefs?.timezone || "Asia/Kolkata";

  // 2. Compute period_start
  const periodStart =
    period === "daily"
      ? startOfTodayInTzAsUtc(now, timezone)
      : mostRecentWeeklySlotAsUtc(
          now,
          timezone,
          prefs?.weekly_send_dow ?? 1,
          prefs?.weekly_send_hour ?? 9
        );
  const periodEnd = now;

  // 3. Idempotency check (skip for test sends)
  if (!isTest) {
    const { data: priorLog } = await supabase
      .from("digest_logs")
      .select("id, status")
      .eq("user_id", userId)
      .eq("digest_type", period)
      .eq("period_start", periodStart.toISOString())
      .maybeSingle();
    if (priorLog) {
      return { ok: true, status: "already_sent" };
    }
  }

  // 4. Profile lookup (recipient email, plan, name)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, full_name, company_name")
    .eq("id", userId)
    .single();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const profileEmail = authUser?.user?.email || null;

  const recipientEmail = prefs?.recipient_email || profileEmail;
  if (!recipientEmail) {
    if (!isTest) {
      await supabase.from("digest_logs").insert({
        user_id: userId,
        digest_type: period,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        status: "failed",
        error_message: "No recipient email available",
      });
    }
    return { ok: false, status: "no_recipient" };
  }

  // 5. Unsubscribe check (skip for test sends, but only if unsubscribed from THIS list)
  if (!isTest) {
    const { data: unsubRow } = await supabase
      .from("email_unsubscribes")
      .select("id, list")
      .eq("user_id", userId)
      .in("list", ["digest", "all"])
      .limit(1)
      .maybeSingle();
    if (unsubRow) {
      await supabase.from("digest_logs").insert({
        user_id: userId,
        digest_type: period,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        status: "skipped_unsubscribed",
        recipient_email: recipientEmail,
      });
      return { ok: false, status: "skipped_unsubscribed" };
    }
  }

  // 6. Build payload
  const payload = await buildDigest(userId, period, now);

  // 7. Skip-if-no-activity (skip for test sends)
  if (
    !isTest &&
    !payload.hasActivity &&
    (prefs?.skip_if_no_activity ?? true)
  ) {
    await supabase.from("digest_logs").insert({
      user_id: userId,
      digest_type: period,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
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

  // 10. Send
  const sendRes = await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
    cc: ccEmails.length > 0 ? ccEmails : undefined,
  });

  // 11. Audit log
  if (sendRes.success) {
    if (!isTest) {
      await supabase.from("digest_logs").insert({
        user_id: userId,
        digest_type: period,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        status: "sent",
        recipient_email: recipientEmail,
        cc_emails: ccEmails,
        payload: payload as unknown as Record<string, unknown>,
        resend_message_id: sendRes.id,
      });
    }
    return { ok: true, status: "sent", messageId: sendRes.id };
  } else {
    if (!isTest) {
      await supabase.from("digest_logs").insert({
        user_id: userId,
        digest_type: period,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        status: "failed",
        recipient_email: recipientEmail,
        cc_emails: ccEmails,
        error_message: sendRes.error || "send failed",
      });
    }
    return { ok: false, status: "failed", error: sendRes.error };
  }
}
