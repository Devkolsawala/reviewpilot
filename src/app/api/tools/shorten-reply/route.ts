import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/tools/rateLimit";
import { toolCompletion, truncateAtBoundary } from "@/lib/tools/xai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REPLY_CHARS = 350;

interface Body {
  text?: unknown;
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

  const originalLen = text.length;
  const system = `Compress this Play Store reply to 350 characters or fewer. Keep the tone, the acknowledgement, and the action/CTA. Cut redundancies, not meaning. Return ONLY the shortened reply — no preamble, no quotes, no markdown.`;

  try {
    let out = await toolCompletion({
      system,
      user: text,
      maxTokens: 200,
      context: "shorten-reply",
    });

    if (out.length > MAX_REPLY_CHARS) {
      out = await toolCompletion({
        system:
          system +
          `\n\nCRITICAL: Previous attempt was ${out.length} chars. Rewrite under 340 characters. No exceptions.`,
        user: text,
        maxTokens: 180,
        context: "shorten-reply-retry",
      });
      if (out.length > MAX_REPLY_CHARS) {
        out = truncateAtBoundary(out, MAX_REPLY_CHARS);
      }
    }

    return NextResponse.json(
      {
        result: out,
        charCount: out.length,
        charsRemoved: Math.max(0, originalLen - out.length),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[shorten-reply] failed:", err);
    return NextResponse.json(
      { error: "ai_unavailable", message: "AI temporarily unavailable, try again in a moment." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
