/**
 * POST /api/internal/classify-insights
 *
 * Internal classifier endpoint. Picks up reviews where
 * ai_insights_classified_at IS NULL, calls classifyReviewInsights for each,
 * and writes the four AI fields back to the row.
 *
 * Auth: Bearer ${CRON_SECRET} — matches /api/cron/* convention.
 *
 * Mock mode (NEXT_PUBLIC_USE_MOCK=true): no-op, returns mockMode:true.
 *
 * Not wired into vercel.json crons in this phase. Invoked manually via
 * scripts/backfill-review-insights.ts. Future: Cloudflare Worker may POST
 * to this after sync completes.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifyReviewInsights,
  type ReviewInsights,
} from "@/lib/ai/classifyReviewInsights";

interface PendingReview {
  id: string;
  review_text: string | null;
  rating: number | null;
  connection_id: string | null;
  app_contexts?: { description: string | null } | { description: string | null }[] | null;
}

const SAFE_DEFAULTS: ReviewInsights = {
  theme: "general feedback",
  emotion: "neutral",
  urgency: "low",
  sentiment: "neutral",
};

function pickAppContextDescription(row: PendingReview): string | undefined {
  const ctx = row.app_contexts;
  if (!ctx) return undefined;
  const obj = Array.isArray(ctx) ? ctx[0] : ctx;
  return obj?.description?.trim() || undefined;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  // Mock-mode short-circuit (matches /api/cron/send-daily-digest)
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return NextResponse.json({
      ok: true,
      mockMode: true,
      message: "Classification disabled in mock mode",
    });
  }

  // Bearer auth — same pattern as poll-reviews / send-daily-digest
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn(
      "[classify-insights] CRON_SECRET not set — refusing to run unauthenticated"
    );
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { batchSize?: number; userId?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // Empty body is fine — use defaults
  }
  const batchSize = Math.min(Math.max(body.batchSize ?? 25, 1), 100);

  const supabase = createAdminClient();

  // If userId provided, restrict to that user's connections.
  let connectionIdFilter: string[] | null = null;
  if (body.userId) {
    const { data: conns, error: connErr } = await supabase
      .from("connections")
      .select("id")
      .eq("user_id", body.userId);
    if (connErr) {
      return NextResponse.json(
        { error: "Failed to load connections", detail: connErr.message },
        { status: 500 }
      );
    }
    connectionIdFilter = (conns || []).map((c: { id: string }) => c.id);
    if (connectionIdFilter.length === 0) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        failed: 0,
        durationMs: Date.now() - startedAt,
        message: "User has no connections",
      });
    }
  }

  let query = supabase
    .from("reviews")
    .select("id, review_text, rating, connection_id, app_contexts(description)")
    .is("ai_insights_classified_at", null)
    .order("created_at", { ascending: false })
    .limit(batchSize);

  if (connectionIdFilter) {
    query = query.in("connection_id", connectionIdFilter);
  }

  const { data: pending, error: fetchErr } = await query;
  if (fetchErr) {
    return NextResponse.json(
      { error: "Failed to load pending reviews", detail: fetchErr.message },
      { status: 500 }
    );
  }

  const rows = (pending || []) as unknown as PendingReview[];
  if (rows.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      failed: 0,
      durationMs: Date.now() - startedAt,
    });
  }

  let processed = 0;
  let failed = 0;

  // Concurrency inside classifyReviewInsights is already bounded (semaphore
  // of 20). We just fan out and await all.
  const results = await Promise.allSettled(
    rows.map(async (row) => {
      const text = (row.review_text || "").trim();
      const rating = row.rating ?? 3;
      // If the review has no text at all, skip the AI call entirely.
      const insights: ReviewInsights | null =
        text.length === 0
          ? SAFE_DEFAULTS
          : await classifyReviewInsights({
              text,
              rating,
              appContext: pickAppContextDescription(row),
            });

      // Whether insights succeeded or returned null, mark the row classified
      // (with safe defaults on null) so we don't infinite-retry problem rows.
      const toWrite = insights ?? SAFE_DEFAULTS;
      const { error: updateErr } = await supabase
        .from("reviews")
        .update({
          ai_theme: toWrite.theme,
          ai_emotion: toWrite.emotion,
          ai_urgency: toWrite.urgency,
          ai_sentiment: toWrite.sentiment,
          ai_insights_classified_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updateErr) throw updateErr;
      return { ok: insights !== null };
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.ok) processed++;
    else failed++;
  }

  return NextResponse.json({
    ok: true,
    processed,
    failed,
    batchSize: rows.length,
    durationMs: Date.now() - startedAt,
  });
}
