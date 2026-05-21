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
  aspects: {},
};

interface PendingReview {
  id: string;
  review_text: string | null;
  rating: number | null;
  source: string | null;
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

interface PgErrLike {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}
function pgErrFields(e: unknown): PgErrLike {
  const x = (e ?? {}) as PgErrLike;
  return { message: x.message, code: x.code, details: x.details, hint: x.hint };
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

  try {
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
          error: "Please wait a moment before trying again.",
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
      const e = pgErrFields(connErr);
      console.error("[classify-pending]", { step: "fetch_connections", ...e });
      return NextResponse.json(
        {
          ok: false,
          step: "fetch_connections",
          message: e.message,
          code: e.code,
          details: e.details,
        },
        { status: 500 }
      );
    }
    const connectionIds = (conns || []).map((c: { id: string }) => c.id);
    if (connectionIds.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, remaining: 0 });
    }

    const { data: pending, error: fetchErr } = await admin
      .from("reviews")
      .select("id, review_text, rating, source, connection_id, app_contexts(description)")
      .in("connection_id", connectionIds)
      .is("ai_insights_classified_at", null)
      .order("created_at", { ascending: false })
      .limit(BATCH_SIZE);
    if (fetchErr) {
      const e = pgErrFields(fetchErr);
      console.error("[classify-pending]", { step: "fetch_pending", ...e });
      return NextResponse.json(
        {
          ok: false,
          step: "fetch_pending",
          message: e.message,
          code: e.code,
          details: e.details,
        },
        { status: 500 }
      );
    }

    const rows = (pending || []) as unknown as PendingReview[];
    if (rows.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, remaining: 0 });
    }

    const results = await Promise.allSettled(
      rows.map(async (row) => {
        const text = (row.review_text || "").trim();
        const rating = row.rating ?? 3;
        const source = row.source || "unknown";

        let insights: ReviewInsights | null;
        try {
          insights =
            text.length === 0
              ? SAFE_DEFAULTS
              : await classifyReviewInsights({
                  text,
                  rating,
                  source,
                  appContext: pickAppContextDescription(row),
                });
        } catch (classifierThrown) {
          // classifyReviewInsights has its own try/catch and should return
          // null on error rather than throw, but belt-and-braces: capture
          // anything that escapes so it surfaces in logs instead of being
          // swallowed as a fulfilled promise.
          const e = pgErrFields(classifierThrown);
          console.error("[classify-pending]", {
            step: "classifier_threw",
            reviewId: row.id,
            ...e,
          });
          throw classifierThrown;
        }

        if (insights === null) {
          // Classifier returned null (xAI down / unparseable response). Don't
          // mark the row classified — leave it pending so a retry can pick it
          // up. Surface the null so we can see how often it happens.
          console.error("[classify-pending]", {
            step: "classifier_returned_null",
            reviewId: row.id,
          });
          return {
            ok: false as const,
            skipped: true as const,
            reviewId: row.id,
          };
        }

        const nowIso = new Date().toISOString();
        const { error: updateErr } = await admin
          .from("reviews")
          .update({
            ai_theme: insights.theme,
            ai_emotion: insights.emotion,
            ai_urgency: insights.urgency,
            ai_sentiment: insights.sentiment,
            ai_aspects: insights.aspects,
            ai_insights_classified_at: nowIso,
            ai_aspects_classified_at: nowIso,
          })
          .eq("id", row.id);

        // Throw so Promise.allSettled captures the Supabase error object in
        // .reason instead of us silently dropping it.
        if (updateErr) throw updateErr;
        return { ok: true as const, reviewId: row.id };
      })
    );

    let processed = 0;
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const e = pgErrFields(r.reason);
        console.error("[classify-pending] update rejected", {
          reviewId: rows[i].id,
          reason: e.message,
          code: e.code,
          details: e.details,
          hint: e.hint,
        });
      } else if (r.value.ok) {
        processed++;
      }
    });

    // Tell the caller how many are still pending so the UI label can update.
    // Wrapped in try/catch — this query is OUTSIDE Promise.allSettled and any
    // failure here would otherwise escape as an unhandled 500.
    let remaining: number | null = null;
    try {
      const { count, error: countErr } = await admin
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .in("connection_id", connectionIds)
        .is("ai_insights_classified_at", null);
      if (countErr) {
        const e = pgErrFields(countErr);
        console.error("[classify-pending]", { step: "remaining_count", ...e });
      } else {
        remaining = count ?? 0;
      }
    } catch (countThrown) {
      const e = pgErrFields(countThrown);
      console.error("[classify-pending]", { step: "remaining_count", ...e });
    }

    return NextResponse.json({
      ok: true,
      processed,
      remaining,
    });
  } catch (err: unknown) {
    const e = err as { message?: string; stack?: string };
    const stack = e?.stack?.split("\n").slice(0, 5);
    console.error("[classify-pending]", {
      step: "unhandled",
      message: e?.message,
      stack,
    });
    return NextResponse.json(
      {
        ok: false,
        step: "unhandled",
        message: e?.message ?? "Unknown error",
        stack,
      },
      { status: 500 }
    );
  }
}
