import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/tools/rateLimit";
import { toolCompletion, truncateAtBoundary } from "@/lib/tools/xai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REPLY_CHARS = 350;

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  hinglish: "Hinglish (Hindi-English code-mix in Roman script, as used by Indian smartphone users)",
};

interface Body {
  text?: unknown;
  targetLang?: unknown;
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

  if (text.length < 5 || text.length > 2000) {
    return NextResponse.json(
      { error: "invalid_text", message: "Reply must be 5–2000 characters." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!LANG_NAMES[targetLang]) {
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

  const langName = LANG_NAMES[targetLang]!;
  const system = `Translate this Play Store review reply to ${langName}. Preserve tone, acknowledgement, and any call to action. Stay under 350 characters total. Return ONLY the translated reply — no preamble, no quotes, no markdown.`;

  try {
    let out = await toolCompletion({
      system,
      user: text,
      maxTokens: 220,
      context: `translate-${targetLang}`,
    });

    if (out.length > MAX_REPLY_CHARS) {
      out = await toolCompletion({
        system:
          system +
          `\n\nCRITICAL: Previous attempt was ${out.length} chars. Rewrite the translation under 340 characters.`,
        user: text,
        maxTokens: 200,
        context: `translate-${targetLang}-retry`,
      });
      if (out.length > MAX_REPLY_CHARS) {
        out = truncateAtBoundary(out, MAX_REPLY_CHARS);
      }
    }

    return NextResponse.json(
      { result: out, charCount: out.length, lang: targetLang },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[translate-reply] failed:", err);
    return NextResponse.json(
      { error: "ai_unavailable", message: "AI temporarily unavailable, try again in a moment." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
