/**
 * POST /api/internal/generate-reply-worker
 *
 * Internal worker that runs the persisted AI reply generation OUT of the
 * originating user's request lifecycle. Triggered fire-and-forget from
 * /api/ai/generate-reply (mode:"async") so the Grok call finishes even when
 * the client disconnects on refresh — the same pattern auto-classification
 * uses (void fetch → CRON_SECRET-protected internal endpoint).
 *
 * Auth: Bearer ${CRON_SECRET} — matches /api/internal/classify-insights and
 * the /api/cron/* convention.
 *
 * All persistence (including the generation_id race guard) lives in
 * runAsyncGeneration so the local-dev inline fallback shares identical logic.
 */

import { NextResponse, type NextRequest } from "next/server";
import { runAsyncGeneration } from "@/lib/ai/run-async-generation";

// A single Grok reply call with retries needs more than the 10s default.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn(
      "[generate-reply-worker] CRON_SECRET not set — refusing to run unauthenticated"
    );
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    reviewId?: string;
    generationId?: string;
    tone?: string;
    userId?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reviewId, generationId, tone, userId } = body;
  if (!reviewId || !generationId || !userId) {
    return NextResponse.json(
      { error: "Missing reviewId, generationId, or userId" },
      { status: 400 }
    );
  }

  await runAsyncGeneration({
    reviewId,
    generationId,
    tone: tone || "friendly",
    userId,
  });

  return NextResponse.json({ ok: true });
}
