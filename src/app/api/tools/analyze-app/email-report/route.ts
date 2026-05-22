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
// Five validation layers (in order of cheapness):
//   L1 — format regex (validateEmail)
//   L2 — disposable-domain blocklist (validateEmail)
//   L3 — common-typo detector (suggestEmailCorrection)
//   L4 — DNS MX-record lookup (hasValidMxRecord)
//   L5 — per-IP submission cap: max 3 distinct emails/day from one IP
//
// Plus idempotency: if a row already exists in analyzer_leads for this
// (email, ip_hash, today) tuple, we still send the email but skip the
// unlock flip — so repeat submissions don't grant 10 extras instead of 5.
//
// Service-side only; never throws — all errors are mapped to structured JSON.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { readCachedAnalysis } from "@/lib/analyzer/pipeline";
import { generatePdfReport } from "@/lib/analyzer/pdf-report";
import { debugHashIp, unlockEmailTier } from "@/lib/analyzer/rate-limit";
import {
  validateEmail,
  suggestEmailCorrection,
  hasValidMxRecord,
} from "@/lib/analyzer/email-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DISTINCT_EMAILS_PER_IP_PER_DAY = 3;

interface EmailReportBody {
  email?: unknown;
  packageId?: unknown;
}

function jsonError(message: string, code: string, status = 400) {
  return NextResponse.json({ error: message, code }, { status });
}

function jsonTypoError(message: string, suggestion: string) {
  return NextResponse.json(
    { error: message, code: "EMAIL_TYPO_SUSPECTED", suggestion },
    { status: 400 }
  );
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function POST(req: Request) {
  let body: EmailReportBody;
  try {
    body = (await req.json()) as EmailReportBody;
  } catch {
    return jsonError("Invalid JSON body.", "BAD_JSON");
  }

  // L1 + L2 — format + disposable.
  const validated = validateEmail(body.email);
  if (!validated.ok) {
    if (validated.reason === "disposable") {
      return jsonError(
        "Please use a permanent email address. Temporary email services aren't supported.",
        "DISPOSABLE_EMAIL"
      );
    }
    return jsonError(
      "Please enter a valid email address.",
      "INVALID_EMAIL_FORMAT"
    );
  }
  const email = validated.email;

  // L3 — common-typo detector. Returns a soft-block with a suggested
  // correction; the client should render this as "Did you mean ...?".
  const typoSuggestion = suggestEmailCorrection(email);
  if (typoSuggestion) {
    return jsonTypoError(`Did you mean ${typoSuggestion}?`, typoSuggestion);
  }

  const packageId =
    typeof body.packageId === "string" ? body.packageId.trim() : "";
  if (!packageId) {
    return jsonError("Missing packageId.", "MISSING_PACKAGE");
  }

  // L4 — DNS MX lookup. Adds ~100-500ms but eliminates the entire class of
  // "valid-format / no-mail-server" fakes. Fails closed on lookup error.
  const mxOk = await hasValidMxRecord(email);
  if (!mxOk) {
    return jsonError(
      "We couldn't verify that email domain. Please try a different address.",
      "EMAIL_DOMAIN_INVALID"
    );
  }

  const ipHash = debugHashIp(req);
  const supabase = createAdminClient();
  const todayStart = startOfTodayIso();

  // L3 — per-IP submission cap. Count DISTINCT emails this IP has submitted
  // today. We allow re-submission of an email already on today's list
  // (idempotency for the same person retrying), but new emails beyond the
  // cap are refused.
  const { data: priorRows, error: priorError } = await supabase
    .from("analyzer_leads")
    .select("email")
    .eq("ip_hash", ipHash)
    .gte("created_at", todayStart);

  if (priorError) {
    console.error(
      "[email-report] prior-leads read failed (continuing fail-open)",
      priorError.message
    );
  }

  const distinctEmailsToday = new Set(
    (priorRows ?? []).map((r) => (r.email as string).toLowerCase())
  );
  const alreadySubmittedToday = distinctEmailsToday.has(email);

  if (
    !alreadySubmittedToday &&
    distinctEmailsToday.size >= MAX_DISTINCT_EMAILS_PER_IP_PER_DAY
  ) {
    return jsonError(
      "You've reached today's limit for email reports. Start a free trial for unlimited reports.",
      "EMAIL_SUBMISSION_LIMIT",
      429
    );
  }

  // Try to load cached analysis. May be null in the quota-gate flow.
  const cached = await readCachedAnalysis(packageId).catch(() => null);

  let pdf: Buffer | null = null;
  if (cached) {
    try {
      pdf = await generatePdfReport(cached);
    } catch (err) {
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
    : `Your 5 extra analyses are ready`;

  const html = pdf
    ? `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#1F1F2A;line-height:1.55;max-width:560px;">
      <p>Hi there,</p>
      <p>Your Play Store Review Analyzer report for <strong>${escapeHtml(
        appName
      )}</strong> is attached as a PDF.</p>
      <p>Inside you'll find:</p>
      <ul style="padding-left:20px;margin:8px 0;">
        <li>Developer response rate</li>
        <li>Sentiment breakdown (positive / neutral / negative)</li>
        <li>Top complaint and praise themes</li>
        <li>A sample AI reply to the worst unanswered review</li>
      </ul>
      <p>As a thank-you, your next <strong>5 analyses today are on us</strong>.</p>
      <p>Want this audit on your own app every week, on autopilot? <a href="https://reviewpilot.co.in/signup">Start a free trial</a>.</p>
      <p style="color:#71717A;font-size:13px;margin-top:24px;">&mdash; The ReviewPilot team</p>
    </div>
  `
    : `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#1F1F2A;line-height:1.55;max-width:560px;">
      <p>Hi there,</p>
      <p>Thanks for trying the ReviewPilot Play Store Review Analyzer. You've
      got <strong>5 more free analyses</strong> on us today &mdash; head back
      to the tool and run them whenever you're ready.</p>
      <p>Once any analysis finishes, the PDF report shows up right on the
      result page, and we'll send it to you here too if you click
      &ldquo;Email me this report&rdquo;.</p>
      <p>Want this audit on your own app every week, on autopilot? <a href="https://reviewpilot.co.in/signup">Start a free trial</a>.</p>
      <p style="color:#71717A;font-size:13px;margin-top:24px;">&mdash; The ReviewPilot team</p>
    </div>
  `;

  const text = pdf
    ? `Hi there,\n\nYour Play Store Review Analyzer report for ${appName} is attached as a PDF.\n\nInside you'll find:\n  • Developer response rate\n  • Sentiment breakdown (positive / neutral / negative)\n  • Top complaint and praise themes\n  • A sample AI reply to the worst unanswered review\n\nAs a thank-you, your next 5 analyses today are on us.\n\nWant this audit on your own app every week, on autopilot?\nStart a free trial: https://reviewpilot.co.in/signup\n\n— The ReviewPilot team`
    : `Hi there,\n\nThanks for trying the ReviewPilot Play Store Review Analyzer. You've got 5 more free analyses on us today — head back to the tool and run them whenever you're ready.\n\nOnce any analysis finishes, the PDF report shows up right on the result page, and we'll send it to you here too if you click "Email me this report".\n\nWant this audit on your own app every week, on autopilot?\nStart a free trial: https://reviewpilot.co.in/signup\n\n— The ReviewPilot team`;

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
    return jsonError(
      "We couldn't send the email. Please double-check the address and try again.",
      "SEND_FAILED",
      502
    );
  }

  // Persist the lead. Composite PK (email, package_id) makes this idempotent
  // for the same (email, app) pair.
  const { error: insertError } = await supabase
    .from("analyzer_leads")
    .upsert(
      { email, package_id: packageId, ip_hash: ipHash },
      { onConflict: "email,package_id" }
    );
  if (insertError) {
    console.error(
      "[email-report] analyzer_leads upsert failed (non-fatal)",
      insertError.message
    );
  }

  // Idempotent unlock: only flip the flag if this is genuinely the first
  // submission from this IP today. Re-submitting the same email later in
  // the day must not grant another +5.
  if (!alreadySubmittedToday) {
    try {
      await unlockEmailTier(ipHash);
    } catch (err) {
      console.error(
        "[email-report] unlockEmailTier failed (non-fatal)",
        (err as Error).message
      );
    }
  }

  return NextResponse.json(
    {
      ok: true,
      emailId: sendResult.id,
      unlockedAdditional: alreadySubmittedToday ? 0 : 5,
    },
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
