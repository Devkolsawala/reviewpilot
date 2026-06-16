/**
 * POST /api/webhooks/resend
 *
 * Receives Resend delivery events and adds bounced / complained recipients to
 * email_suppression so the lifecycle engine never mails them again. The engine
 * checks email_suppression before every send and self-heals any active
 * enrollment to 'suppressed' on its next run, so adding the address here is
 * sufficient to stop future sends.
 *
 * Handled events:
 *   - email.bounced     → reason 'bounce'     (PERMANENT bounces only; transient
 *                          soft bounces like a full mailbox are NOT suppressed)
 *   - email.complained  → reason 'complaint'  (recipient marked it as spam)
 * Any other event type is acknowledged (200) and ignored.
 *
 * Signature: Resend signs webhooks with Svix. We verify the svix-id /
 * svix-timestamp / svix-signature headers against RESEND_WEBHOOK_SECRET
 * (whsec_...) using HMAC-SHA256, with a timestamp tolerance to block replays.
 * No external dependency — verified with the built-in crypto module.
 */

import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/email/lifecycle/unsubscribe-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

interface ResendEvent {
  type?: string;
  data?: {
    to?: string[] | string;
    email?: string;
    bounce?: { type?: string; subType?: string; message?: string };
  };
}

function verifySvixSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

  // Replay guard: reject timestamps outside the tolerance window.
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > TIMESTAMP_TOLERANCE_SECONDS) return false;

  // The signing secret is "whsec_<base64>"; the key is the base64-decoded tail.
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);

  // svix-signature is a space-separated list of "v1,<base64sig>" entries.
  for (const part of svixSignature.split(" ")) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    const sigBuf = Buffer.from(sig);
    if (
      sigBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return true;
    }
  }
  return false;
}

function recipientsFrom(event: ResendEvent): string[] {
  const to = event.data?.to;
  const list = Array.isArray(to) ? to : to ? [to] : [];
  if (list.length === 0 && event.data?.email) list.push(event.data.email);
  return Array.from(
    new Set(list.filter(Boolean).map((e) => normalizeEmail(e)))
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const svixId = request.headers.get("svix-id") || "";
  const svixTimestamp = request.headers.get("svix-timestamp") || "";
  const svixSignature = request.headers.get("svix-signature") || "";

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  if (
    !verifySvixSignature(rawBody, svixId, svixTimestamp, svixSignature, secret)
  ) {
    console.error("[resend-webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(rawBody) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let reason: "bounce" | "complaint" | null = null;
  if (event.type === "email.complained") {
    reason = "complaint";
  } else if (event.type === "email.bounced") {
    // Only suppress permanent (hard) bounces. Transient/soft bounces (e.g.
    // mailbox full) may recover, so we don't permanently block them.
    const bounceType = event.data?.bounce?.type;
    if (bounceType && bounceType.toLowerCase() === "transient") {
      console.log("[resend-webhook] transient bounce — not suppressing");
      return NextResponse.json({ ok: true, ignored: "transient_bounce" });
    }
    reason = "bounce";
  }

  if (!reason) {
    // Unhandled event type — acknowledge so Resend doesn't retry.
    return NextResponse.json({ ok: true, ignored: event.type ?? "unknown" });
  }

  const emails = recipientsFrom(event);
  if (emails.length === 0) {
    console.warn(`[resend-webhook] ${event.type} had no recipient address`);
    return NextResponse.json({ ok: true, suppressed: 0 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("email_suppression")
    .upsert(
      emails.map((email) => ({ email, reason })),
      { onConflict: "email", ignoreDuplicates: true }
    );
  if (error) {
    console.error("[resend-webhook] suppression upsert failed", error.message);
    // Return 500 so Resend retries — we don't want to lose a suppression.
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  console.log(
    `[resend-webhook] ${event.type} → suppressed ${emails.length} (${reason})`
  );
  return NextResponse.json({ ok: true, suppressed: emails.length, reason });
}
