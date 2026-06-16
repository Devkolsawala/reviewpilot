/**
 * One-click stop / unsubscribe for the lifecycle email engine.
 *
 *   GET  /api/email/unsubscribe?token=...  → applies the opt-out, returns a
 *        branded confirmation page. One click, no login, no confirm step.
 *   POST /api/email/unsubscribe?token=...  → RFC 8058 (List-Unsubscribe-Post)
 *        one-click target for Gmail/Apple Mail. Applies the opt-out, 200 empty.
 *
 * The token is a self-describing HMAC (see unsubscribe-token.ts) so we can act
 * without a DB lookup and without trusting any user-supplied email. Applying
 * the opt-out:
 *   1. adds the email to email_suppression (reason='unsubscribe'), idempotent;
 *   2. marks all of that email's lifecycle_enrollments 'unsubscribed'.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/email/lifecycle/unsubscribe-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function applyUnsubscribe(token: string): Promise<boolean> {
  const email = verifyUnsubscribeToken(token);
  if (!email) return false;

  const admin = createAdminClient();

  // 1. Add to the global suppression list (idempotent on the unique email).
  const { error: supErr } = await admin
    .from("email_suppression")
    .upsert(
      { email, reason: "unsubscribe" },
      { onConflict: "email", ignoreDuplicates: true }
    );
  if (supErr) {
    console.error("[email/unsubscribe] suppression upsert failed", supErr.message);
    // Don't fail the user's request over a logging hiccup — the enrollment
    // status update below still stops future sends for known sequences.
  }

  // 2. Stop every sequence this email is enrolled in.
  const { error: enrErr } = await admin
    .from("lifecycle_enrollments")
    .update({ status: "unsubscribed" })
    .eq("email", email)
    .neq("status", "unsubscribed");
  if (enrErr) {
    console.error("[email/unsubscribe] enrollment update failed", enrErr.message);
  }

  return true;
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const ok = await applyUnsubscribe(token);
  return new NextResponse(renderPage(ok), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  // RFC 8058: act and return 200 with an empty body, regardless of outcome —
  // don't leak whether the address was known.
  const token = new URL(request.url).searchParams.get("token") || "";
  await applyUnsubscribe(token);
  return new NextResponse(null, { status: 200 });
}

// ── Branded confirmation page ───────────────────────────────────────────────
// Design system: cream #F9F7F4, indigo #4338CA, Plus Jakarta Sans.
function renderPage(ok: boolean): string {
  const heading = ok
    ? "You're unsubscribed"
    : "This link didn't work";
  const body = ok
    ? `<p style="margin:0 0 12px;">You won't get any more of these emails from ReviewPilot. No hard feelings &mdash; thanks for giving us a look.</p>
       <p style="margin:0;color:#71717A;font-size:14px;">Changed your mind, or have a question? Email <a href="mailto:hello@reviewpilot.co.in" style="color:#4338CA;text-decoration:none;font-weight:600;">hello@reviewpilot.co.in</a> and we'll sort it out.</p>`
    : `<p style="margin:0 0 12px;">This unsubscribe link looks expired or incomplete, so we couldn't action it automatically.</p>
       <p style="margin:0;color:#71717A;font-size:14px;">Email <a href="mailto:hello@reviewpilot.co.in" style="color:#4338CA;text-decoration:none;font-weight:600;">hello@reviewpilot.co.in</a> and we'll stop the emails for you right away.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${heading} &middot; ReviewPilot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F9F7F4;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #1F1F2A;
      padding: 24px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E7E3DC;
      border-radius: 16px;
      max-width: 460px;
      width: 100%;
      padding: 40px 36px;
      box-shadow: 0 8px 30px rgba(31, 31, 42, 0.06);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #4338CA;
      letter-spacing: 0.02em;
      margin-bottom: 20px;
    }
    .dot { width: 9px; height: 9px; border-radius: 50%; background: #4338CA; display: inline-block; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; line-height: 1.3; }
    p { line-height: 1.6; font-size: 15px; }
    .home {
      display: inline-block;
      margin-top: 24px;
      font-size: 14px;
      color: #4338CA;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <main class="card">
    <span class="badge"><span class="dot"></span>ReviewPilot</span>
    <h1>${heading}</h1>
    ${body}
    <a class="home" href="https://reviewpilot.co.in">&larr; Back to ReviewPilot</a>
  </main>
</body>
</html>`;
}
