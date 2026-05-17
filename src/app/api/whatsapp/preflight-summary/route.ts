import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import {
  buildPreflightSummaryEmail,
  type PreflightScenario,
} from "@/lib/email/preflight-summary";

/**
 * Send the optional pre-flight wizard summary email.
 *
 * This route exists purely because the Resend API key cannot be exposed
 * client-side. It does not touch any WhatsApp connection state and is
 * unrelated to the OAuth callback / webhook handlers. The wizard fires
 * this fire-and-forget — failures are surfaced as a small toast and do
 * not block the user from completing the connection.
 */

const VALID_SCENARIOS: ReadonlySet<PreflightScenario> = new Set<PreflightScenario>(
  ["A", "B", "C", "D"]
);

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      scenario?: string;
    };
    const scenario = body.scenario as PreflightScenario | undefined;
    if (!scenario || !VALID_SCENARIOS.has(scenario)) {
      return NextResponse.json(
        { success: false, error: "Invalid scenario" },
        { status: 400 }
      );
    }

    const recipientName =
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "";

    const { subject, html, text } = buildPreflightSummaryEmail({
      recipientName,
      recipientEmail: user.email,
      scenario,
    });

    const result = await sendEmail({
      to: user.email,
      subject,
      html,
      text,
      from:
        process.env.RESEND_FROM_EMAIL ||
        "ReviewPilot <hello@reviewpilot.co.in>",
      replyTo: "dev@reviewpilot.co.in",
    });

    if (!result.success) {
      console.error(
        "[preflight-summary] send failed:",
        result.error
      );
      return NextResponse.json(
        { success: false, error: result.error || "Send failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[preflight-summary] route error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
