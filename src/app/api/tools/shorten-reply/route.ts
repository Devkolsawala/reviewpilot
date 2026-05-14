import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/tools/rateLimit";
import { toolVariations } from "@/lib/tools/xai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REPLY_CHARS = 350;

interface Body {
  text?: unknown;
  reviewContext?: unknown;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const reviewContext =
    typeof body.reviewContext === "string" && body.reviewContext.trim().length >= 10
      ? body.reviewContext.trim().slice(0, 2000)
      : "";

  if (text.length < 5 || text.length > 2000) {
    return NextResponse.json(
      { error: "invalid_text", message: "Reply must be 5–2000 characters." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      {
        error: "rate_limited",
        message:
          "You've hit the free tool limit (15 requests per hour). Start a free trial to keep going.",
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  const contextBlock = reviewContext
    ? `The user is replying to this Play Store review:\n"""\n${reviewContext}\n"""\nYour shortened replies must directly acknowledge what the reviewer said.\n\n`
    : "";

  const baseSystem = `${contextBlock}Compress this Play Store reply to 350 characters or fewer. Keep the tone, the acknowledgement, and the action/CTA. Cut redundancies, not meaning.`;

  try {
    const results = await toolVariations({
      baseSystem,
      user: text,
      maxChars: MAX_REPLY_CHARS,
      maxTokens: 600,
      context: "shorten-reply",
    });

    if (results.length === 0) {
      return NextResponse.json(
        {
          error: "ai_empty",
          message: "AI returned no usable variations. Try again.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[shorten-reply] failed:", err);
    return NextResponse.json(
      {
        error: "ai_unavailable",
        message: "AI temporarily unavailable, try again in a moment.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
