import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/tools/rateLimit";
import { toolVariations } from "@/lib/tools/xai";
import {
  LANGUAGE_BY_CODE,
  LANGUAGE_PROMPT_NOTES,
} from "@/lib/tools/languages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TONES = new Set([
  "Friendly",
  "Professional",
  "Apologetic",
  "Confident",
]);
const ALLOWED_PLATFORMS = new Set(["play-store", "gbp", "other"]);

const CHAR_LIMIT_BY_PLATFORM: Record<string, number> = {
  "play-store": 350,
  gbp: 4096,
  other: 1000,
};

const PLATFORM_LABEL: Record<string, string> = {
  "play-store": "Google Play Store",
  gbp: "Google Business Profile",
  other: "online review platform",
};

interface Body {
  review?: unknown;
  platform?: unknown;
  tone?: unknown;
  rating?: unknown;
  language?: unknown;
  variations?: unknown;
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

  const review = typeof body.review === "string" ? body.review.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform : "";
  const tone = typeof body.tone === "string" ? body.tone : "";
  const rating =
    typeof body.rating === "number" && Number.isFinite(body.rating)
      ? Math.max(1, Math.min(5, Math.round(body.rating)))
      : undefined;
  const languageCode =
    typeof body.language === "string" && body.language.trim().length > 0
      ? body.language.trim()
      : "en";
  const variationsRequested =
    typeof body.variations === "number" && Number.isFinite(body.variations)
      ? Math.max(1, Math.min(3, Math.round(body.variations)))
      : 3;

  if (review.length < 5 || review.length > 4000) {
    return NextResponse.json(
      {
        error: "invalid_review",
        message: "Review must be between 5 and 4000 characters.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json(
      { error: "invalid_platform", message: "Unknown platform." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!ALLOWED_TONES.has(tone)) {
    return NextResponse.json(
      { error: "invalid_tone", message: "Unknown tone." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  const langMeta = LANGUAGE_BY_CODE[languageCode];
  if (!langMeta) {
    return NextResponse.json(
      { error: "invalid_language", message: "Unknown language code." },
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

  const charLimit = CHAR_LIMIT_BY_PLATFORM[platform]!;
  const platformLabel = PLATFORM_LABEL[platform]!;
  const langNote = LANGUAGE_PROMPT_NOTES[languageCode];
  const languageInstruction =
    languageCode === "en"
      ? "Write the reply in English."
      : `Write the reply in ${langMeta.name}${langNote ? ` (${langNote})` : ""}.`;

  const ratingLine = rating
    ? `Reviewer rating: ${rating} star${rating === 1 ? "" : "s"}`
    : "Reviewer rating: unknown";

  const baseSystem = `You are a customer experience expert writing developer/business replies to a ${platformLabel} review.

The review is:
"""
${review}
"""

${ratingLine}
Required tone: ${tone}
${languageInstruction}
Character limit: ${charLimit} characters (hard limit).

Each reply must:
1. Acknowledge what the reviewer specifically said — no generic "thank you for your feedback"
2. Stay under ${charLimit} characters
3. Use the required tone consistently
4. Read as human, not templated
5. For negative reviews, redirect to support without making promises you can't keep`;

  try {
    const results = await toolVariations({
      baseSystem,
      user: `Write ${variationsRequested} reply variation${variationsRequested === 1 ? "" : "s"} to the review above.`,
      maxChars: charLimit,
      maxTokens: charLimit > 1500 ? 1800 : 800,
      context: "generate-reply",
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
      {
        results: results.slice(0, variationsRequested),
        platform,
        language: languageCode,
        langName: langMeta.name,
        charLimit,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[generate-reply] failed:", err);
    return NextResponse.json(
      {
        error: "ai_unavailable",
        message: "AI temporarily unavailable, try again in a moment.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
