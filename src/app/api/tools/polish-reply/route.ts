import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/tools/rateLimit";
import { toolCompletion, truncateAtBoundary } from "@/lib/tools/xai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TONES = new Set([
  "Friendly",
  "Professional",
  "Apologetic",
  "Confident",
]);
const MAX_REPLY_CHARS = 350;

interface Body {
  text?: unknown;
  tone?: unknown;
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
  const tone = typeof body.tone === "string" ? body.tone : "";

  if (text.length < 5 || text.length > 2000) {
    return NextResponse.json(
      { error: "invalid_text", message: "Reply must be 5–2000 characters." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!ALLOWED_TONES.has(tone)) {
    return NextResponse.json(
      { error: "invalid_tone", message: "Unknown tone." },
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

  const system = `You are a Play Store review reply editor. Improve the given developer reply so it:
1. Stays under 350 characters (hard limit — count every character including spaces and punctuation)
2. Uses a ${tone} tone
3. Acknowledges the reviewer's point first, then responds concretely
4. Avoids placeholders like [App Name] — keep the meaning intact
5. Returns ONLY the rewritten reply, no preamble, no quotes, no markdown.`;

  try {
    let out = await toolCompletion({
      system,
      user: text,
      maxTokens: 220,
      context: "polish-reply",
    });

    if (out.length > MAX_REPLY_CHARS) {
      // One tighter retry
      out = await toolCompletion({
        system:
          system +
          `\n\nCRITICAL: Your previous attempt was ${out.length} chars. Rewrite under 340 characters this time. No exceptions.`,
        user: text,
        maxTokens: 200,
        context: "polish-reply-retry",
      });
      if (out.length > MAX_REPLY_CHARS) {
        out = truncateAtBoundary(out, MAX_REPLY_CHARS);
      }
    }

    return NextResponse.json(
      { result: out, charCount: out.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[polish-reply] failed:", err);
    return NextResponse.json(
      { error: "ai_unavailable", message: "AI temporarily unavailable, try again in a moment." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
