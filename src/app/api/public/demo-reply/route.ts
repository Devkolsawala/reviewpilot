import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReply } from "@/lib/ai/reply-generator";
import type { AppContext } from "@/types/database";
import type { Review } from "@/types/review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-IP rate limit. NO global circuit breaker — every fresh visitor must
// always be able to try the demo as long as they're under their personal cap.
const RATE_LIMIT_PER_HOUR = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const GENERATION_TIMEOUT_MS = 12_000;

const ALLOWED_TONES = new Set(["friendly", "professional", "apologetic"]);

interface DemoBody {
  review?: unknown;
  tone?: unknown;
  rating?: unknown;
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "0.0.0.0";
}

function hashIp(ip: string): string {
  // Salt is required so raw IPs aren't recoverable from the demo_usage table
  // even if the DB is leaked. Salt is read once per request from env.
  const salt = process.env.DEMO_IP_SALT || "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function buildDemoContext(tone: string): AppContext {
  // Intentionally empty / generic — tests how the production prompt behaves
  // for a brand-new user who hasn't filled out their App Context Profile yet.
  // Type matches the real AppContext exactly (no production type loosening).
  return {
    id: "demo",
    connection_id: "demo",
    description: "",
    key_features: [],
    common_questions: [],
    known_issues: [],
    tone: tone as AppContext["tone"],
    auto_reply_enabled: false,
    auto_reply_mode: "manual",
    auto_reply_draft_low_ratings: true,
    auto_reply_min_rating: 1,
    auto_reply_max_rating: 5,
    schedule_enabled: false,
    schedule_time: "08:00",
    schedule_timezone: "UTC",
    schedule_days: [true, true, true, true, true, true, true],
    schedule_review_age_hours: 24,
    schedule_safety_toggle: true,
    updated_at: new Date().toISOString(),
  };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("generation_timeout")),
      ms
    );
    p.then((v) => {
      clearTimeout(timer);
      resolve(v);
    }).catch((e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

export async function POST(request: Request) {
  let body: DemoBody;
  try {
    body = (await request.json()) as DemoBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Could not parse request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const review = typeof body.review === "string" ? body.review.trim() : "";
  const tone = typeof body.tone === "string" ? body.tone : "";
  const ratingRaw = body.rating;
  const rating =
    typeof ratingRaw === "number" && Number.isFinite(ratingRaw)
      ? Math.max(1, Math.min(5, Math.round(ratingRaw)))
      : undefined;

  if (review.length < 10 || review.length > 500) {
    return NextResponse.json(
      {
        error: "invalid_review",
        message: "Review must be between 10 and 500 characters.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!ALLOWED_TONES.has(tone)) {
    return NextResponse.json(
      {
        error: "invalid_tone",
        message: "Tone must be friendly, professional, or apologetic.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createAdminClient();
  const ip = getClientIp(request);
  const ip_hash = hashIp(ip);
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();

  const { count: recentCount, error: rateErr } = await supabase
    .from("demo_usage")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip_hash)
    .gt("created_at", windowStart);

  if (rateErr) {
    console.error("[demo-reply] rate-check failed:", rateErr);
    // Fail open — don't block legit visitors because of a transient DB issue.
  }

  if ((recentCount ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message:
          "You've hit the demo limit (5 replies per hour). Start your 7-day free trial to keep going.",
        retryAfterSeconds: 60 * 60,
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(60 * 60),
        },
      }
    );
  }

  const reviewData: Review = {
    id: "demo",
    source: "play_store",
    external_review_id: "demo",
    author_name: "Demo reviewer",
    rating: rating ?? 3,
    review_text: review,
    review_language: "en",
    reply_status: "pending",
    sentiment: "neutral",
    keywords: [],
    is_read: false,
    review_created_at: new Date().toISOString(),
  };

  const startedAt = Date.now();
  let reply: string;
  try {
    reply = await withTimeout(
      generateReply({
        appContext: buildDemoContext(tone),
        review: reviewData,
        source: "play_store",
        tone,
      }),
      GENERATION_TIMEOUT_MS
    );
  } catch (err) {
    const isTimeout = (err as Error)?.message === "generation_timeout";
    console.error("[demo-reply] generation failed:", err);
    return NextResponse.json(
      {
        error: isTimeout ? "timeout" : "generation_failed",
        message:
          "Something went wrong on our end. Please try again in a moment — or start your 7-day free trial to use the full product.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const elapsedMs = Date.now() - startedAt;

  // Log AFTER successful generation so failed runs don't burn quota.
  const { error: insertErr } = await supabase
    .from("demo_usage")
    .insert({ ip_hash });
  if (insertErr) {
    console.error("[demo-reply] usage insert failed:", insertErr);
  }

  return NextResponse.json(
    { reply, elapsedMs },
    { headers: { "Cache-Control": "no-store" } }
  );
}
