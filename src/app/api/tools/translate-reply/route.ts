import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/tools/rateLimit";
import { toolVariations } from "@/lib/tools/xai";
import { LANGUAGE_BY_CODE, LANGUAGE_PROMPT_NOTES } from "@/lib/tools/languages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REPLY_CHARS = 350;

interface Body {
  text?: unknown;
  targetLang?: unknown;
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
  const targetLang = typeof body.targetLang === "string" ? body.targetLang : "";
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
  const lang = LANGUAGE_BY_CODE[targetLang];
  if (!lang) {
    return NextResponse.json(
      { error: "invalid_lang", message: "Unsupported target language." },
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

  const note = LANGUAGE_PROMPT_NOTES[lang.code];
  const noteLine = note ? ` Notes: ${note}` : "";
  const contextBlock = reviewContext
    ? `The user is replying to this Play Store review:\n"""\n${reviewContext}\n"""\nYour translated replies must directly acknowledge what the reviewer said.\n\n`
    : "";

  const baseSystem = `${contextBlock}Translate this Play Store review reply to ${lang.name} (${lang.nativeName}).${noteLine} Preserve tone, acknowledgement, and any call to action. Stay under 350 characters total.`;

  try {
    const results = await toolVariations({
      baseSystem,
      user: text,
      maxChars: MAX_REPLY_CHARS,
      maxTokens: 700,
      context: `translate-${lang.code}`,
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
      { results, lang: lang.code, langName: lang.name },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[translate-reply] failed:", err);
    return NextResponse.json(
      {
        error: "ai_unavailable",
        message: "AI temporarily unavailable, try again in a moment.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
