/**
 * sendLifecycleEmail() — the ONLY way the lifecycle engine sends mail.
 *
 * Wraps the existing Resend client (src/lib/resend.ts) and bakes in the
 * non-negotiable email-safety rules so no caller can forget them:
 *
 *   1. Suppression is checked FIRST. Blocks: anything on email_suppression
 *      (unsubscribe|bounce|complaint|paid|manual) AND the digest system's
 *      user-keyed email_unsubscribes list='all' opt-out.
 *   2. Send-once idempotency. A 'pending' claim row is inserted up front; the
 *      partial unique index uq_lifecycle_sends_once makes a duplicate insert
 *      fail, so a cron re-run never re-sends. Failed attempts can retry.
 *   3. from = noreply@reviewpilot.co.in, reply-to = hello@reviewpilot.co.in.
 *   4. A friendly one-click "Stop these emails" link + a "contact hello@" line
 *      are appended to every message, plus RFC 8058 List-Unsubscribe headers.
 *
 * NO sequences fire from here — this is foundation only. Callers (Phase 2's
 * scheduler) own deciding WHO and WHICH step; this owns sending safely.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { makeUnsubscribeToken, normalizeEmail } from "./unsubscribe-token";

type AdminClient = ReturnType<typeof createAdminClient>;

export const LIFECYCLE_FROM =
  process.env.LIFECYCLE_FROM_EMAIL || "ReviewPilot <noreply@reviewpilot.co.in>";
export const LIFECYCLE_REPLY_TO = "hello@reviewpilot.co.in";
export const LIFECYCLE_CONTACT_EMAIL = "hello@reviewpilot.co.in";

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://reviewpilot.co.in"
  );
}

export type SuppressionCheck =
  | { suppressed: false }
  | { suppressed: true; reason: string };

/**
 * True if this email must not receive lifecycle mail. Checks the global
 * email_suppression list and the digest list='all' opt-out. Exported so the
 * Phase 2 scheduler can pre-filter cheaply before building a message.
 */
export async function checkSuppression(
  admin: AdminClient,
  email: string
): Promise<SuppressionCheck> {
  const normalized = normalizeEmail(email);

  const { data: sup } = await admin
    .from("email_suppression")
    .select("reason")
    .eq("email", normalized)
    .maybeSingle();
  if (sup) return { suppressed: true, reason: sup.reason as string };

  // Honor the digest system's global opt-out for logged-in users.
  const { data: unsubAll } = await admin
    .from("email_unsubscribes")
    .select("id")
    .eq("email", normalized)
    .eq("list", "all")
    .limit(1)
    .maybeSingle();
  if (unsubAll) return { suppressed: true, reason: "unsubscribe" };

  return { suppressed: false };
}

function buildUnsubscribeUrl(email: string): string {
  const token = makeUnsubscribeToken(email);
  return `${appUrl()}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** Append the contact line + one-click stop link to the HTML body. */
function appendHtmlFooter(html: string, unsubUrl: string): string {
  return `${html}
<div style="margin-top:28px;padding-top:16px;border-top:1px solid #E7E3DC;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;color:#71717A;font-size:13px;line-height:1.6;">
  <p style="margin:0 0 6px;">Questions or anything we can help with? Just reply, or email <a href="mailto:${LIFECYCLE_CONTACT_EMAIL}" style="color:#4338CA;">${LIFECYCLE_CONTACT_EMAIL}</a>.</p>
  <p style="margin:0;"><a href="${unsubUrl}" style="color:#71717A;text-decoration:underline;">Stop these emails</a></p>
</div>`;
}

/** Append the contact line + one-click stop link to the plain-text body. */
function appendTextFooter(text: string | undefined, unsubUrl: string): string {
  const base = text ? `${text}\n\n` : "";
  return `${base}---\nQuestions? Reply to this email or contact ${LIFECYCLE_CONTACT_EMAIL}.\nStop these emails: ${unsubUrl}`;
}

export type LifecycleSendResult =
  | { ok: true; status: "sent"; messageId?: string }
  | {
      ok: false;
      status: "suppressed" | "already_sent" | "failed";
      reason?: string;
      error?: string;
    };

export interface SendLifecycleEmailParams {
  to: string;
  /** Enrollment this send belongs to (for send-once logging). */
  enrollmentId: string;
  sequenceKey: string;
  step: number;
  subject: string;
  html: string;
  text?: string;
}

export async function sendLifecycleEmail(
  params: SendLifecycleEmailParams
): Promise<LifecycleSendResult> {
  const admin = createAdminClient();
  const email = normalizeEmail(params.to);

  // 1. Suppression FIRST — never send to a blocked address.
  const suppression = await checkSuppression(admin, email);
  if (suppression.suppressed) {
    return { ok: false, status: "suppressed", reason: suppression.reason };
  }

  // 2. Claim the send (send-once). The partial unique index rejects a second
  //    pending/sent row for this (enrollment, step); a prior 'failed' row does
  //    not block a retry.
  const { error: claimErr } = await admin.from("lifecycle_sends").insert({
    enrollment_id: params.enrollmentId,
    sequence_key: params.sequenceKey,
    step: params.step,
    status: "pending",
  });
  if (claimErr) {
    if (claimErr.code === "23505") {
      return { ok: false, status: "already_sent" };
    }
    // Fail CLOSED: if we can't record the claim we can't guarantee send-once.
    return { ok: false, status: "failed", error: claimErr.message };
  }

  // 3. Build the message with safety footer + headers.
  const unsubUrl = buildUnsubscribeUrl(email);
  const html = appendHtmlFooter(params.html, unsubUrl);
  const text = appendTextFooter(params.text, unsubUrl);

  // 4. Send via the existing Resend wrapper.
  const res = await sendEmail({
    to: email,
    subject: params.subject,
    html,
    text,
    from: LIFECYCLE_FROM,
    replyTo: LIFECYCLE_REPLY_TO,
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>, <mailto:${LIFECYCLE_CONTACT_EMAIL}?subject=stop>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  // 5. Finalize the claim row.
  if (res.success) {
    await admin
      .from("lifecycle_sends")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        resend_message_id: res.id ?? null,
      })
      .eq("enrollment_id", params.enrollmentId)
      .eq("step", params.step);
    return { ok: true, status: "sent", messageId: res.id };
  }

  // Mark failed so the partial unique index allows a future retry.
  await admin
    .from("lifecycle_sends")
    .update({ status: "failed" })
    .eq("enrollment_id", params.enrollmentId)
    .eq("step", params.step)
    .eq("status", "pending");
  return { ok: false, status: "failed", error: res.error };
}
