/**
 * Cron endpoint — fired every 2 hours by the Cloudflare Worker.
 * Called with: GET, Authorization: Bearer ${CRON_SECRET}.
 *
 * Dispatch policy is "send no earlier than" + idempotency, NOT exact-hour
 * matching. The Worker fires every 2h, so an exact-hour gate would miss
 * most users. For each candidate user we check:
 *   1. Is local hour ≥ daily_send_hour?
 *   2. Is there already a digest_logs row for (user, 'daily', period_start)?
 * If 1 yes & 2 no → send. The unique index on digest_logs(user, type, start)
 * makes the check race-safe — concurrent runs collide on insert and only
 * one wins. Worst-case delay = 2h (one tick); missed runs self-recover.
 *
 * Mock mode: when NEXT_PUBLIC_USE_MOCK=true, this endpoint is a no-op so
 * test users don't get real digests. The test-send button still works
 * because /api/digest/test calls sendDigestForUser directly with isTest=true.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDigestForUser } from "@/lib/digest/send";
import {
  getTzParts,
  startOfTodayInTzAsUtc,
  mostRecentWeeklySlotAsUtc,
} from "@/lib/digest/tz";

type PrefsRow = {
  user_id: string;
  daily_enabled: boolean;
  weekly_enabled: boolean;
  daily_send_hour: number;
  weekly_send_dow: number;
  weekly_send_hour: number;
  timezone: string;
};

async function processOne(
  prefs: PrefsRow,
  now: Date,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ user: string; daily?: string; weekly?: string }> {
  const out: { user: string; daily?: string; weekly?: string } = {
    user: prefs.user_id,
  };
  const tz = prefs.timezone || "Asia/Kolkata";
  const local = getTzParts(now, tz);

  // ── Daily ─────────────────────────────────────────────────────────────────
  if (prefs.daily_enabled) {
    if (local.hour < prefs.daily_send_hour) {
      out.daily = "before_send_hour";
    } else {
      const periodStart = startOfTodayInTzAsUtc(now, tz);
      const { data: priorLog } = await supabase
        .from("digest_logs")
        .select("id")
        .eq("user_id", prefs.user_id)
        .eq("digest_type", "daily")
        .eq("period_start", periodStart.toISOString())
        .maybeSingle();
      if (priorLog) {
        out.daily = "already_sent";
      } else {
        const r = await sendDigestForUser({
          userId: prefs.user_id,
          period: "daily",
          now,
        });
        out.daily = r.status;
      }
    }
  }

  // ── Weekly ────────────────────────────────────────────────────────────────
  if (prefs.weekly_enabled) {
    // Has the configured weekday-and-hour been reached at all this week?
    const slot = mostRecentWeeklySlotAsUtc(
      now,
      tz,
      prefs.weekly_send_dow,
      prefs.weekly_send_hour
    );
    if (slot.getTime() > now.getTime()) {
      out.weekly = "before_send_slot";
    } else {
      const { data: priorLog } = await supabase
        .from("digest_logs")
        .select("id")
        .eq("user_id", prefs.user_id)
        .eq("digest_type", "weekly")
        .eq("period_start", slot.toISOString())
        .maybeSingle();
      if (priorLog) {
        out.weekly = "already_sent";
      } else {
        const r = await sendDigestForUser({
          userId: prefs.user_id,
          period: "weekly",
          now,
        });
        out.weekly = r.status;
      }
    }
  }

  return out;
}

export async function GET(request: NextRequest) {
  const start = Date.now();

  // Mock mode short-circuit
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return NextResponse.json({
      ok: true,
      mockMode: true,
      message: "Cron disabled in mock mode",
    });
  }

  // Auth (mirror /api/cron/poll-reviews)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("[digest_cron] WARNING: CRON_SECRET not set — allowing request");
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: "CRON_SECRET mismatch between Cloudflare Worker and Vercel",
      },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  // Pull every user with at least one digest enabled
  const { data: prefsList, error } = await supabase
    .from("digest_preferences")
    .select(
      "user_id, daily_enabled, weekly_enabled, daily_send_hour, weekly_send_dow, weekly_send_hour, timezone"
    )
    .or("daily_enabled.eq.true,weekly_enabled.eq.true");

  if (error) {
    return NextResponse.json(
      { error: "Failed to query digest_preferences", detail: error.message },
      { status: 500 }
    );
  }

  const candidates = (prefsList as PrefsRow[]) || [];
  const now = new Date();
  const summary = { processed: 0, sent: 0, skipped: 0, failed: 0 };
  const details: Array<{ user: string; daily?: string; weekly?: string }> = [];

  // Process in batches of 20
  const BATCH = 20;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const slice = candidates.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      slice.map((p) => processOne(p, now, supabase))
    );
    for (const r of results) {
      summary.processed++;
      if (r.status === "fulfilled") {
        details.push(r.value);
        for (const status of [r.value.daily, r.value.weekly]) {
          if (!status) continue;
          if (status === "sent") summary.sent++;
          else if (status === "failed") summary.failed++;
          else summary.skipped++;
          console.log(
            `[digest_cron] user=${r.value.user} status=${status}`
          );
        }
      } else {
        summary.failed++;
        console.error("[digest_cron] batch error:", r.reason);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - start,
    candidates: candidates.length,
    ...summary,
    details,
  });
}
