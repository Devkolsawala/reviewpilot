/**
 * GET /api/reviews/[id]/generation-status
 *
 * Lightweight, RLS-scoped poll endpoint the inbox uses to rehydrate the AI
 * reply loader after a refresh and to drive the in-flight spinner. READ-ONLY —
 * it never triggers a new generation.
 *
 * Returns { generation_status, reply_text, generation_id, reply_status }.
 *
 * Stale-job protection: a row still marked 'generating' but whose
 * generation_started_at is older than STALE_MS is reported as 'failed' so the
 * client never spins forever (e.g. the worker crashed or was never reached).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// A generation older than this is considered dead. Comfortably above the
// worker's 60s maxDuration plus retry/backoff headroom.
const STALE_MS = 120_000;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewId = params.id;
  // RLS scopes this select to reviews the user owns — no extra ownership check
  // needed. A row the user can't see simply returns no data.
  const { data: review, error } = await supabase
    .from("reviews")
    .select("generation_status, reply_text, generation_id, generation_started_at, reply_status")
    .eq("id", reviewId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  let generationStatus = review.generation_status as
    | "idle"
    | "generating"
    | "completed"
    | "failed"
    | null;

  if (generationStatus === "generating") {
    const startedMs = review.generation_started_at
      ? new Date(review.generation_started_at).getTime()
      : 0;
    if (!startedMs || Date.now() - startedMs > STALE_MS) {
      generationStatus = "failed";
    }
  }

  console.log(`[gen] status reviewId=${reviewId} -> ${generationStatus ?? "idle"}`);

  return NextResponse.json({
    generation_status: generationStatus,
    reply_text: review.reply_text ?? null,
    generation_id: review.generation_id ?? null,
    reply_status: review.reply_status ?? null,
  });
}
