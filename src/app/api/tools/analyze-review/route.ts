import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/tools/rateLimit";
import { toolCompletion } from "@/lib/tools/xai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = new Set(["bug", "feature", "praise", "complaint", "mixed"]);
const VALID_SENTIMENT = new Set(["negative", "neutral", "positive"]);

interface Body {
  text?: unknown;
}

interface Analysis {
  ratingGuess: number;
  type: string;
  sentiment: string;
  summary: string;
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
  if (text.length < 10 || text.length > 2000) {
    return NextResponse.json(
      { error: "invalid_text", message: "Review must be 10–2000 characters." },
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
        message: "You've hit the free tool limit (15 requests per hour).",
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

  const system = `Classify this Play Store app review. Return ONLY valid JSON with no preamble, no markdown, no code fences:
{ "ratingGuess": 1-5 integer, "type": "bug" | "feature" | "praise" | "complaint" | "mixed", "sentiment": "negative" | "neutral" | "positive", "summary": "max 10 word summary" }`;

  try {
    const raw = await toolCompletion({
      system,
      user: text,
      maxTokens: 150,
      context: "analyze-review",
    });

    const parsed = parseAnalysis(raw);
    if (!parsed) {
      return NextResponse.json(
        { error: "parse_failed", message: "Could not analyze review." },
        { status: 422, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(parsed, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[analyze-review] failed:", err);
    return NextResponse.json(
      { error: "ai_unavailable", message: "AI temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

function parseAnalysis(raw: string): Analysis | null {
  // Strip markdown code fences if the model wrapped its output.
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Find the first {...} block in case there's stray text.
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(match[0]);
  } catch {
    return null;
  }

  const ratingGuess = Number(data.ratingGuess);
  const type = String(data.type || "").toLowerCase();
  const sentiment = String(data.sentiment || "").toLowerCase();
  const summary =
    typeof data.summary === "string" ? data.summary.trim().slice(0, 120) : "";

  if (
    !Number.isFinite(ratingGuess) ||
    ratingGuess < 1 ||
    ratingGuess > 5 ||
    !VALID_TYPES.has(type) ||
    !VALID_SENTIMENT.has(sentiment) ||
    !summary
  ) {
    return null;
  }

  return {
    ratingGuess: Math.round(ratingGuess),
    type,
    sentiment,
    summary,
  };
}
