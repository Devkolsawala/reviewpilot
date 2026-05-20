/**
 * POST /api/insights/classify-pending
 *
 * User-facing classifier — invoked from the Theme Map card on
 * /dashboard/analytics. Processes up to 25 of the current user's own
 * unclassified reviews per call.
 *
 * Auth: Supabase session (NOT CRON_SECRET — this is user-facing).
 * Rate limit: 1 call per user per 30 seconds (in-memory).
 * Mock mode: returns mockMode:true and short-circuits (no DB/AI).
 *
 * Reuses classifyReviewInsights() so prompt + parsing logic stays single-source.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifyReviewInsights,
  type ReviewInsights,
} from "@/lib/ai/classifyReviewInsights";

const BATCH_SIZE = 25;
const RATE_LIMIT_MS = 30_000;

// In-memory per-user rate limiter. Acceptable single-instance footprint;
// worst case in a multi-instance deployment is N concurrent batches.
const lastInvoked = new Map<string, number>();

const SAFE_DEFAULTS: ReviewInsights = {
  theme: "general feedback",
  emotion: "neutral",
  urgency: "low",
  sentiment: "neutral",
};

interface PendingReview {
  id: string;
  review_text: string | null;
  rating: number | null;
  connection_id: string | null;
  app_contexts?:
    | { description: string | null }
    | { description: string | null }[]
    | null;
}

function pickAppContextDescription(row: PendingReview): string | undefined {
  const ctx = row.app_contexts;
  if (!ctx) return undefined;
  const obj = Array.isArray(ctx) ? ctx[0] : ctx;
  return obj?.description?.trim() || undefined;
}

export async function POST(_request: NextRequest) { // eslint-disable-line @typescript-eslint/no-unused-vars
  // Mock-mode short-circuit FIRST so test environments don't hit Supabase
  // for nothing.
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return NextResponse.json({
      ok: true,
      mockMode: true,
      processed: 0,
      remaining: 0,
    });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Per-user rate limit
  const now = Date.now();
  const last = lastInvoked.get(user.id) ?? 0;
  if (now - last < RATE_LIMIT_MS) {
    const retryAfterMs = RATE_LIMIT_MS - (now - last);
    return NextResponse.json(
      {
        error:
          "Please wait a moment before trying again.",
        retryAfterMs,
      },
      { status: 429 }
    );
  }
  lastInvoked.set(user.id, now);

  // Use admin client for the actual work so RLS doesn't block updates on
  // rows the user technically owns through connections.
  const admin = createAdminClient();

  // Scope to this user's connections.
  const { data: conns, error: connErr } = await admin
    .from("connections")
    .select("id")
    .eq("user_id", user.id);
  if (connErr) {
    return NextResponse.json(
      { error: "Failed to load connections", detail: connErr.message },
      { status: 500 }
    );
  }
  const connectionIds = (conns || []).map((c: { id: string }) => c.id);
  if (connectionIds.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, remaining: 0 });
  }

  const { data: pending, error: fetchErr } = await admin
    .from("reviews")
    .select("id, review_text, rating, connection_id, app_contexts(description)")
    .in("connection_id", connectionIds)
    .is("ai_insights_classified_at", null)
    .order("created_at", { ascending: false })
    .limit(BATCH_SIZE);
  if (fetchErr) {
    return NextResponse.json(
      { error: "Failed to load pending reviews", detail: fetchErr.message },
      { status: 500 }
    );
  }

  const rows = (pending || []) as unknown as PendingReview[];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, remaining: 0 });
  }

  let processed = 0;
  await Promise.allSettled(
    rows.map(async (row) => {
      const text = (row.review_text || "").trim();
      const rating = row.rating ?? 3;
      const insights: ReviewInsights | null =
        text.length === 0
          ? SAFE_DEFAULTS
          : await classifyReviewInsights({
              text,
              rating,
              appContext: pickAppContextDescription(row),
            });

      const toWrite = insights ?? SAFE_DEFAULTS;
      const { error: updateErr } = await admin
        .from("reviews")
        .update({
          ai_theme: toWrite.theme,
          ai_emotion: toWrite.emotion,
          ai_urgency: toWrite.urgency,
          ai_sentiment: toWrite.sentiment,
          ai_insights_classified_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (!updateErr && insights !== null) processed++;
    })
  );

  // Tell the caller how many are still pending so the UI label can update.
  const { count: remaining } = await admin
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .in("connection_id", connectionIds)
    .is("ai_insights_classified_at", null);

  return NextResponse.json({
    ok: true,
    processed,
    remaining: remaining ?? 0,
  });
}
