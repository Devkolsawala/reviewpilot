/**
 * GET /api/cron/lifecycle
 *
 * Daily entry point for the lifecycle/nurture email engine, triggered by the
 * SEPARATE reviewpilot-lifecycle-cron Cloudflare Worker. Authenticated with the
 * shared CRON_SECRET (same scheme as the existing crons).
 *
 * Isolated by design: this does NOT touch the digest / poll-reviews cron or
 * their handlers. It only enrolls eligible people and processes due lifecycle
 * steps via runLifecycle().
 *
 * Ships with DRY_RUN ON (LIFECYCLE_DRY_RUN !== "false"): it logs the full plan
 * and returns it as JSON without sending anything. Flipping to live is a manual
 * env change.
 */

import { NextResponse, type NextRequest } from "next/server";
import { runLifecycle } from "@/lib/email/lifecycle/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Lifecycle work can iterate many enrollments; give it room.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runLifecycle(new Date());
    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (err) {
    console.error("[lifecycle] run failed", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
