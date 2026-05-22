// POST /api/tools/analyze-app/email-report
//
// Email-gate / lead capture for the public Play Store Review Analyzer.
//
// One endpoint, two modes:
//   1. Quota-gate unlock (cache MISS): user got rate-limited trying to start
//      a fresh analysis. We capture the email, unlock +5 fresh analyses, and
//      send a "5 more unlocked, please retry" confirmation email. No PDF —
//      there's no analysis yet to PDF.
//   2. Lead-magnet PDF (cache HIT): user already has a completed analysis and
//      wants the PDF. We send the PDF attachment, capture the lead, and also
//      flip the unlock flag (idempotent — granting +5 to someone who already
//      had 5 unlocked has no effect because the limit is computed as
//      ANON_LIMIT + EMAIL_BONUS when the flag is true).
//
// Both modes always: validate email, persist lead row, unlock IP. Only the
// PDF generation+attachment is conditional on cache presence.
//
// Service-side only; never throws — all errors are mapped to structured JSON.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { readCachedAnalysis } from "@/lib/analyzer/pipeline";
import { generatePdfReport } from "@/lib/analyzer/pdf-report";
import {
  getClientIp,
  hashIp,
  unlockEmailTier,
} from "@/lib/analyzer/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailReportBody {
  email?: unknown;
  packageId?: unknown;
}

function bad(message: string, code: string, status = 400) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: Request) {
  let body: EmailReportBody;
  try {
    body = (await req.json()) as EmailReportBody;
  } catch {
    return bad("Invalid JSON body.", "bad_json");
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const packageId =
    typeof body.packageId === "string" ? body.packageId.trim() : "";

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return bad("Please enter a valid email address.", "bad_email");
  }
  if (!packageId) {
    return bad("Missing packageId.", "bad_package");
  }

  // Try to load cached analysis. May be null if this is the quota-gate flow.
  const cached = await readCachedAnalysis(packageId).catch(() => null);

  let pdf: Buffer | null = null;
  if (cached) {
    try {
      pdf = await generatePdfReport(cached);
    } catch (err) {
      // PDF failure shouldn't block the unlock — log and continue without it.
      console.error(
        "[email-report] PDF generation failed (continuing without attachment)",
        (err as Error).message
      );
      pdf = null;
    }
  }

  const appName = cached?.app.appName || packageId;
  const subject = pdf
    ? `Your ReviewPilot analysis: ${appName}`
    : `5 more analyses unlocked on your ReviewPilot account`;

  const html = pdf
    ? `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#1F1F2A;line-height:1.55;max-width:560px;">
      <p>Hi,</p>
      <p>Your free Play Store Review Analyzer report for <strong>${escapeHtml(
        appName
      )}</strong> is attached as a PDF.</p>
      <p>Inside you'll find the developer's response rate, sentiment breakdown,
      top complaint and praise themes, and a sample AI reply to the worst
      unanswered review.</p>
      <p>We also unlocked <strong>5 more free analyses</strong> on your IP for
      the rest of today.</p>
      <p>Want this audit on your own app every week? <a href="https://reviewpilot.co.in/pricing">Start a free trial</a>.</p>
      <p style="color:#71717A;font-size:13px;margin-top:24px;">— ReviewPilot</p>
    </div>
  `
    : `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#1F1F2A;line-height:1.55;max-width:560px;">
      <p>Hi,</p>
      <p>Thanks for trying the ReviewPilot Play Store Review Analyzer. We just
      unlocked <strong>5 more free analyses</strong> on your IP for the rest
      of today &mdash; you can go back to the tool and run them now.</p>
      <p>Your PDF report will be available straight from the result page once
      the analysis completes.</p>
      <p>Want this audit on your own app every week? <a href="https://reviewpilot.co.in/pricing">Start a free trial</a>.</p>
      <p style="color:#71717A;font-size:13px;margin-top:24px;">— ReviewPilot</p>
    </div>
  `;

  const text = pdf
    ? `Your ReviewPilot analysis for ${appName} is attached.\n\nWe also unlocked 5 more free analyses on your IP for the rest of today.\n\nStart a free trial: https://reviewpilot.co.in/pricing\n\n— ReviewPilot`
    : `Thanks for trying ReviewPilot. We unlocked 5 more free analyses on your IP for the rest of today — head back to the tool to run them.\n\nStart a free trial: https://reviewpilot.co.in/pricing\n\n— ReviewPilot`;

  const safeFilename =
    packageId.replace(/[^a-z0-9._-]/gi, "-") + "-reviewpilot-analysis.pdf";

  const sendResult = await sendEmail({
    to: email,
    subject,
    html,
    text,
    ...(pdf
      ? { attachments: [{ filename: safeFilename, content: pdf }] }
      : {}),
  });

  if (!sendResult.success) {
    console.error("[email-report] Resend failed", sendResult.error);
    return bad(
      "We couldn't send the email. Please double-check the address and try again.",
      "send_failed",
      502
    );
  }

  const ipHash = hashIp(getClientIp(req));

  // Persist the lead. Composite PK (email, package_id) makes this idempotent
  // for repeated requests by the same person for the same app.
  const supabase = createAdminClient();
  const { error: insertError } = await supabase
    .from("analyzer_leads")
    .upsert(
      {
        email,
        package_id: packageId,
        ip_hash: ipHash,
      },
      { onConflict: "email,package_id" }
    );
  if (insertError) {
    // Non-fatal — the user already got the PDF. Log for monitoring.
    console.error(
      "[email-report] analyzer_leads upsert failed (non-fatal)",
      insertError.message
    );
  }

  // Unlock +5 analyses for the rest of the day. Idempotent: flipping the
  // flag a second time has no effect, since the limit is computed as
  // ANON_LIMIT + EMAIL_BONUS when email_unlocked is true regardless of how
  // many times the unlock was triggered.
  try {
    await unlockEmailTier(ipHash);
  } catch (err) {
    console.error(
      "[email-report] unlockEmailTier failed (non-fatal)",
      (err as Error).message
    );
  }

  return NextResponse.json(
    { ok: true, emailId: sendResult.id, unlockedAdditional: 5 },
    { status: 200 }
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
