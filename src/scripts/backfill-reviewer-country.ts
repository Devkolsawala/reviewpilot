/**
 * One-time backfill: derive reviewer_country from review_language for all
 * existing rows where reviewer_country IS NULL AND source = 'play_store'.
 *
 * Idempotent — safe to re-run. Rows whose locale has no region remain NULL
 * (will fall under the "Unknown" bucket in the inbox filter).
 *
 * Run from repo root:
 *   pnpm backfill:country
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in
 * .env.local (loaded automatically via the package.json script).
 */
import { createClient } from "@supabase/supabase-js";
import { extractCountryFromLocale } from "../lib/utils/locale-to-country";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const PAGE = 500;
  let offset = 0;
  let totalScanned = 0;
  let totalUpdated = 0;
  let totalSkippedNoRegion = 0;

  console.log("[backfill] starting reviewer_country backfill...");

  while (true) {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, review_language")
      .eq("source", "play_store")
      .is("reviewer_country", null)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);

    if (error) {
      console.error("[backfill] select error:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    totalScanned += data.length;

    for (const row of data) {
      const country = extractCountryFromLocale(row.review_language);
      if (!country) {
        totalSkippedNoRegion++;
        continue;
      }
      const { error: upErr } = await supabase
        .from("reviews")
        .update({ reviewer_country: country })
        .eq("id", row.id);
      if (upErr) {
        console.error(`[backfill] update failed for ${row.id}: ${upErr.message}`);
        continue;
      }
      totalUpdated++;
    }

    if (data.length < PAGE) break;
    offset += PAGE;
  }

  console.log(
    `[backfill] done. scanned=${totalScanned} updated=${totalUpdated} unknown_kept_null=${totalSkippedNoRegion}`
  );
}

main().catch((e) => {
  console.error("[backfill] fatal:", e);
  process.exit(1);
});
