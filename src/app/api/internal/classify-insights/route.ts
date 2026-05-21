/**
 * POST /api/internal/classify-insights
 *
 * Internal classifier endpoint. Picks up reviews where
 * ai_insights_classified_at IS NULL, calls classifyReviewInsights for each,
 * and writes the AI fields (theme/emotion/urgency/sentiment/aspects) back to
 * the row.
 *
 * Auth: Bearer ${CRON_SECRET} — matches /api/cron/* convention.
 *
 * Mock mode (NEXT_PUBLIC_USE_MOCK=true): no-op, returns mockMode:true.
 *
 * Phase 2 — Auto-classification kickoff:
 *   - The Cloudflare-Worker-triggered sync at /api/reviews/fetch fires a
 *     fire-and-forget POST here at the end of each sync. We protect against
 *     pile-up with an in-memory per-user debounce (only the first call in a
 *     30s window is honored; chain calls bypass).
 *   - When there are more pending reviews than fit in a single batch, this
 *     endpoint self-chains by kicking off another POST with chainCount+1,
 *     capped at CHAIN_CAP iterations so no runaway loops can occur.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifyReviewInsights,
  type ReviewInsights,
} from "@/lib/ai/classifyReviewInsights";

// Hobby plan: opt into the 60s function budget. Default is 10s which is too
// tight for a batch of 15 xAI calls with the 12s per-call timeout.
export const maxDuration = 60;

interface PendingReview {
  id: string;
  review_text: string | null;
  rating: number | null;
  source: string | null;
  connection_id: string | null;
}

const SAFE_DEFAULTS: ReviewInsights = {
  theme: "general feedback",
  emotion: "neutral",
  urgency: "low",
  sentiment: "neutral",
  aspects: {},
};

const DEFAULT_BATCH_SIZE = 15;
const DEBOUNCE_MS = 30_000;
// Hard cap on self-chained calls. 30 × 15 = 450 reviews per chain — plenty
// for any realistic sync, with no runaway risk on cost or compute.
const CHAIN_CAP = 30;

// In-memory per-user debounce. Acceptable single-instance footprint; worst
// case in a multi-instance deployment is N concurrent batches (the underlying
// SQL query is idempotent on `ai_insights_classified_at IS NULL`).
const recentRuns = new Map<string, number>();


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

  let body: {
    batchSize?: number;
    userId?: string;
    chainCount?: number;
    aspectsOnly?: boolean;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // Empty body is fine — use defaults
  }
  const batchSize = Math.min(Math.max(body.batchSize ?? DEFAULT_BATCH_SIZE, 1), 100);
  const userId = body.userId;
  const chainCount = Math.max(0, body.chainCount ?? 0);
  // aspectsOnly mode (used by the one-time backfill script): target reviews
  // that already have Phase-1 insights but no aspects yet. Reuses the same
  // classifier so theme/emotion/urgency/sentiment are re-written with
  // identical values — acceptable for a one-time backfill.
  const aspectsOnly = body.aspectsOnly === true;

  // Per-user debounce — applies ONLY to the first call in a chain so the
  // self-draining chain isn't blocked by its own debounce.
  if (userId && chainCount === 0) {
    const lastRun = recentRuns.get(userId);
    if (lastRun && Date.now() - lastRun < DEBOUNCE_MS) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "recent_run",
        processed: 0,
      });
    }
    recentRuns.set(userId, Date.now());
    if (recentRuns.size > 1000) {
      const cutoff = Date.now() - DEBOUNCE_MS * 2;
      recentRuns.forEach((v, k) => {
        if (v < cutoff) recentRuns.delete(k);
      });
    }
  }

  const supabase = createAdminClient();

  // If userId provided, restrict to that user's connections.
  let connectionIdFilter: string[] | null = null;
  if (userId) {
    const { data: conns, error: connErr } = await supabase
      .from("connections")
      .select("id")
      .eq("user_id", userId);
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
    .select("id, review_text, rating, source, connection_id")
    .order("created_at", { ascending: false })
    .limit(batchSize);

  if (aspectsOnly) {
    query = query
      .not("ai_insights_classified_at", "is", null)
      .is("ai_aspects_classified_at", null);
  } else {
    query = query.is("ai_insights_classified_at", null);
  }

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
    console.log(
      `[classify_insights] user=${userId ?? "all"} chain=${chainCount} processed=0 remaining=0 (no pending)`
    );
    return NextResponse.json({
      ok: true,
      processed: 0,
      failed: 0,
      durationMs: Date.now() - startedAt,
    });
  }

  // Fetch app_contexts in a separate query and build a connection_id -> description
  // map. We can't embed app_contexts(description) in the reviews SELECT because
  // there is no direct FK between reviews and app_contexts — they share
  // connection_id as a sibling FK to connections, and PostgREST refuses to embed
  // without a direct relationship (error PGRST200).
  const rowConnectionIds = Array.from(
    new Set(
      rows
        .map((r) => r.connection_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );
  const contextByConnection = new Map<string, string>();
  if (rowConnectionIds.length > 0) {
    const { data: ctxRows, error: ctxErr } = await supabase
      .from("app_contexts")
      .select("connection_id, description")
      .in("connection_id", rowConnectionIds);
    if (ctxErr) {
      // Non-fatal: classifier just runs without a business-context hint.
      console.error("[classify_insights] fetch_contexts failed", ctxErr.message);
    } else {
      for (const c of ctxRows || []) {
        const desc = (c.description || "").trim();
        if (c.connection_id && desc) {
          contextByConnection.set(c.connection_id, desc);
        }
      }
    }
  }

  let processed = 0;
  let failed = 0;

  // Concurrency inside classifyReviewInsights is already bounded (semaphore
  // of 20). We just fan out and await all.
  const results = await Promise.allSettled(
    rows.map(async (row) => {
      const text = (row.review_text || "").trim();
      const rating = row.rating ?? 3;
      const source = row.source || "unknown";
      const appContext = row.connection_id
        ? contextByConnection.get(row.connection_id)
        : undefined;
      // If the review has no text at all, skip the AI call entirely.
      const insights: ReviewInsights | null =
        text.length === 0
          ? SAFE_DEFAULTS
          : await classifyReviewInsights({
              text,
              rating,
              source,
              appContext,
            });

      // Whether insights succeeded or returned null, mark the row classified
      // (with safe defaults on null) so we don't infinite-retry problem rows.
      const toWrite = insights ?? SAFE_DEFAULTS;
      const nowIso = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from("reviews")
        .update({
          ai_theme: toWrite.theme,
          ai_emotion: toWrite.emotion,
          ai_urgency: toWrite.urgency,
          ai_sentiment: toWrite.sentiment,
          ai_aspects: toWrite.aspects,
          ai_insights_classified_at: nowIso,
          ai_aspects_classified_at: nowIso,
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

  // ── Self-drain chain ────────────────────────────────────────────────────────
  // If more reviews remain unclassified for this user and we haven't hit the
  // chain cap, kick off another invocation. Fire-and-forget — this response
  // returns immediately. Vercel's runtime keeps the function alive long
  // enough for the TCP handshake to complete before shutdown.
  let stillPending: number | null = null;
  if (userId && chainCount < CHAIN_CAP) {
    let countQuery = supabase
      .from("reviews")
      .select("id", { count: "exact", head: true });
    if (aspectsOnly) {
      countQuery = countQuery
        .not("ai_insights_classified_at", "is", null)
        .is("ai_aspects_classified_at", null);
    } else {
      countQuery = countQuery.is("ai_insights_classified_at", null);
    }
    if (connectionIdFilter) {
      countQuery = countQuery.in("connection_id", connectionIdFilter);
    }
    const { count } = await countQuery;
    stillPending = count ?? 0;

    if (stillPending > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl && cronSecret) {
        void fetch(`${appUrl}/api/internal/classify-insights`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cronSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            batchSize: DEFAULT_BATCH_SIZE,
            userId,
            chainCount: chainCount + 1,
            aspectsOnly,
          }),
        }).catch((err) =>
          console.error("[classify_chain] failed", err)
        );
      }
    }
  }

  console.log(
    `[classify_insights] user=${userId ?? "all"} chain=${chainCount} processed=${processed} failed=${failed} remaining=${stillPending ?? "?"}`
  );

  return NextResponse.json({
    ok: true,
    processed,
    failed,
    batchSize: rows.length,
    chainCount,
    remaining: stillPending,
    durationMs: Date.now() - startedAt,
  });
}
