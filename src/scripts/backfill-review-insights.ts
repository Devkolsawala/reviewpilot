/**
 * One-time backfill — classify reviews that haven't been tagged with
 * ai_theme / ai_emotion / ai_urgency / ai_sentiment / ai_aspects yet.
 *
 * After this completes, NEW reviews are auto-classified by the post-sync
 * kickoff in /api/reviews/fetch (guarded by AUTO_CLASSIFY_ON_SYNC). The
 * Theme Map / Critical Issues / Aspect Sentiment UI must therefore handle
 * reviews with ai_theme IS NULL or ai_aspects IS NULL gracefully.
 *
 * Usage:
 *   npx tsx --env-file=.env.local src/scripts/backfill-review-insights.ts
 *     — classify all unclassified reviews (full insights)
 *   npx tsx --env-file=.env.local src/scripts/backfill-review-insights.ts --aspects-only
 *     — fill aspects for Phase-1-classified reviews (overwrites theme/emotion/
 *       urgency/sentiment with the same values; aspect backfill is one-time)
 *   npx tsx --env-file=.env.local src/scripts/backfill-review-insights.ts --dry-run
 *     — count only, no API calls
 *   npx tsx --env-file=.env.local src/scripts/backfill-review-insights.ts --aspects-only --dry-run
 *     — count of Phase-1-classified reviews still missing aspects
 *
 * Requires CRON_SECRET and NEXT_PUBLIC_APP_URL (or NEXT_PUBLIC_SITE_URL or
 * VERCEL_URL) in .env.local. Falls back to http://localhost:3000.
 *
 * Exit codes: 0 = success, 1 = repeated network failure or misconfiguration.
 */

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000";

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 25;
const PAUSE_MS = 2000;
const MAX_NETWORK_FAILURES = 5;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ASPECTS_ONLY = args.includes("--aspects-only");

if (!CRON_SECRET) {
  console.error(
    "[backfill] CRON_SECRET is required in .env.local. Aborting."
  );
  process.exit(1);
}

async function dryRunCount(): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "[backfill] --dry-run needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);
  let query = supabase
    .from("reviews")
    .select("id", { count: "exact", head: true });
  if (ASPECTS_ONLY) {
    // Phase-1-classified reviews that haven't had aspects filled yet.
    query = query
      .not("ai_insights_classified_at", "is", null)
      .is("ai_aspects_classified_at", null);
  } else {
    query = query.is("ai_insights_classified_at", null);
  }
  const { count, error } = await query;
  if (error) {
    console.error("[backfill] dry-run query failed:", error.message);
    process.exit(1);
  }
  return count ?? 0;
}

interface BatchResult {
  ok: boolean;
  processed: number;
  failed: number;
  mockMode?: boolean;
  message?: string;
  error?: string;
}

async function processBatch(): Promise<BatchResult> {
  const res = await fetch(`${APP_URL}/api/internal/classify-insights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRON_SECRET}`,
    },
    body: JSON.stringify({
      batchSize: BATCH_SIZE,
      aspectsOnly: ASPECTS_ONLY,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      processed: 0,
      failed: 0,
      error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
    };
  }
  const json = (await res.json()) as BatchResult;
  return { ...json, ok: true };
}

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[backfill] App URL: ${APP_URL}`);
  console.log(`[backfill] Mode: ${ASPECTS_ONLY ? "aspects-only" : "full insights"}`);

  if (DRY_RUN) {
    const count = await dryRunCount();
    console.log(
      `[backfill] DRY RUN — ${count} reviews pending ${
        ASPECTS_ONLY ? "aspect classification" : "classification"
      }.`
    );
    console.log(
      `[backfill] At batch size ${BATCH_SIZE} and ${PAUSE_MS}ms pause, expect ~${
        Math.ceil(count / BATCH_SIZE) * (PAUSE_MS / 1000)
      }s of waiting time (plus xAI latency).`
    );
    process.exit(0);
  }

  let totalProcessed = 0;
  let totalFailed = 0;
  let batchNum = 0;
  let networkFailures = 0;
  let emptyCycles = 0;

  while (true) {
    batchNum++;
    const result = await processBatch();

    if (!result.ok) {
      networkFailures++;
      console.error(
        `[batch ${batchNum}] network/HTTP error: ${result.error}. ` +
          `(${networkFailures}/${MAX_NETWORK_FAILURES})`
      );
      if (networkFailures >= MAX_NETWORK_FAILURES) {
        console.error("[backfill] Too many network failures, aborting.");
        process.exit(1);
      }
      await sleep(PAUSE_MS * 2);
      continue;
    }

    networkFailures = 0;

    if (result.mockMode) {
      console.log(
        "[backfill] Server is in mock mode (NEXT_PUBLIC_USE_MOCK=true). " +
          "Disable mock mode and rerun to backfill real data."
      );
      process.exit(0);
    }

    const { processed, failed } = result;
    totalProcessed += processed;
    totalFailed += failed;

    if (processed + failed === 0) {
      emptyCycles++;
      console.log(
        `[batch ${batchNum}] no pending reviews returned (empty cycle ${emptyCycles}/1).`
      );
      console.log(
        `[backfill] Done. Total processed: ${totalProcessed}, total failed: ${totalFailed}.`
      );
      process.exit(0);
    }

    console.log(
      `[batch ${batchNum}] processed ${processed}, failed ${failed}, ` +
        `total so far ${totalProcessed} (${totalFailed} failed).`
    );

    await sleep(PAUSE_MS);
  }
}

main().catch((err) => {
  console.error("[backfill] Unhandled error:", err);
  process.exit(1);
});
