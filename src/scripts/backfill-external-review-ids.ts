/**
 * One-time backfill: repair `reviews.external_review_id` rows that were
 * written as a UUID instead of the Play Store `gp:`-prefixed reviewId.
 *
 * Behavior:
 *   1. Selects rows whose external_review_id does NOT match /^gp:/ AND
 *      source = 'play_store'.
 *   2. Groups by connection_id, refetches live Play Store reviews per
 *      connection.
 *   3. Matches each corrupt row by composite key:
 *        author_name + review_text + rating + |created_at delta| ≤ 10min
 *      The same key the live reply auto-heal uses, so prod and backfill
 *      agree on what counts as a match.
 *   4. For each match, decides:
 *        a. No existing canonical row with that gp: id → straight UPDATE
 *           the corrupt row's external_review_id to gp:....
 *        b. Canonical row exists → MERGE user-touched fields from corrupt
 *           into canonical (rules in src/scripts/backfill-merge.ts), then
 *           DELETE the corrupt row.
 *      Each (a)/(b) reconciliation is wrapped in a Postgres transaction
 *      via a Supabase RPC so a crash mid-merge cannot orphan data.
 *   5. Logs unmatched rows. They are NEVER deleted by this script.
 *
 * Modes:
 *   Default: DRY-RUN. Prints the merge plan; writes nothing.
 *   --apply: Actually performs the writes.
 *
 * Run from repo root:
 *   npm run backfill:external-review-ids                # dry-run
 *   npm run backfill:external-review-ids -- --apply     # write
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in
 * .env.local (loaded automatically via the package.json script).
 */
import { createClient } from "@supabase/supabase-js";
import { fetchPlayStoreReviews } from "../lib/google/playstore";
import { planMerge, type ReviewRow } from "./backfill-merge";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  );
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const TEN_MIN_MS = 10 * 60 * 1000;
const GP_PREFIX = /^gp:/;

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface CorruptRow extends ReviewRow {
  connection_id: string;
  author_name: string | null;
  review_text: string | null;
  rating: number | null;
  review_created_at: string | null;
  source: string;
}

interface ConnectionRow {
  id: string;
  external_id: string | null;
  credentials: Record<string, unknown> | null;
  type: string;
}

async function main() {
  console.log(
    `[backfill] mode=${APPLY ? "APPLY (writes enabled)" : "DRY-RUN (no writes)"}`
  );

  // 1. Select corrupt rows
  const { data: corruptRows, error: selectErr } = await supabase
    .from("reviews")
    .select(
      "id, connection_id, source, external_review_id, author_name, review_text, rating, review_created_at, " +
        "reply_text, reply_status, reply_published_at, reply_first_published_at, reply_last_edited_at, " +
        "reply_edit_count, is_read, is_auto_replied, skip_auto_reply, last_seen_in_api_at"
    )
    .eq("source", "play_store")
    .not("external_review_id", "like", "gp:%");

  if (selectErr) {
    console.error("[backfill] select failed:", selectErr.message);
    process.exit(1);
  }
  const corrupt = (corruptRows ?? []) as unknown as CorruptRow[];
  console.log(`[backfill] found ${corrupt.length} corrupt row(s) to evaluate`);

  if (corrupt.length === 0) {
    console.log("[backfill] nothing to do.");
    return;
  }

  // 2. Group by connection
  const byConnection = new Map<string, CorruptRow[]>();
  for (const row of corrupt) {
    const list = byConnection.get(row.connection_id) ?? [];
    list.push(row);
    byConnection.set(row.connection_id, list);
  }

  // 3. Per-connection: fetch credentials + live reviews, then reconcile
  const summary = {
    matched_update: 0,
    matched_merge_delete: 0,
    ambiguous: 0,
    unmatched: 0,
    errors: 0,
  };

  for (const [connId, rows] of Array.from(byConnection.entries())) {
    console.log(`\n[backfill] connection=${connId} corrupt_rows=${rows.length}`);

    const { data: connRow, error: connErr } = await supabase
      .from("connections")
      .select("id, external_id, credentials, type")
      .eq("id", connId)
      .single();
    if (connErr || !connRow) {
      console.error(`[backfill] could not load connection ${connId}: ${connErr?.message}`);
      summary.errors += rows.length;
      continue;
    }
    const conn = connRow as ConnectionRow;
    if (!conn.external_id || conn.type !== "play_store") {
      console.warn(
        `[backfill] connection ${connId} is not a play_store connection or has no package — skipping ${rows.length} row(s)`
      );
      summary.errors += rows.length;
      continue;
    }

    let live: Awaited<ReturnType<typeof fetchPlayStoreReviews>> = [];
    try {
      live = await fetchPlayStoreReviews(
        conn.external_id,
        conn.credentials as Record<string, unknown> | null
      );
      console.log(`[backfill] fetched ${live.length} live review(s) from Play Store`);
    } catch (e) {
      console.error(`[backfill] live fetch failed for connection ${connId}:`, e);
      summary.errors += rows.length;
      continue;
    }

    for (const row of rows) {
      const matches = live.filter((r) => {
        if (r.author_name !== row.author_name) return false;
        if (r.review_text !== row.review_text) return false;
        if ((r.rating ?? null) !== (row.rating ?? null)) return false;
        if (row.review_created_at) {
          const storedMs = new Date(row.review_created_at).getTime();
          const liveMs = new Date(r.review_created_at).getTime();
          if (!Number.isFinite(storedMs) || !Number.isFinite(liveMs)) return false;
          if (Math.abs(storedMs - liveMs) > TEN_MIN_MS) return false;
        }
        return !!r.external_review_id && GP_PREFIX.test(r.external_review_id);
      });

      if (matches.length === 0) {
        summary.unmatched++;
        console.warn(
          `[backfill] UNMATCHED corrupt_id=${row.id} stored_eri=${row.external_review_id} author="${row.author_name}" rating=${row.rating} — leaving in place`
        );
        continue;
      }
      if (matches.length > 1) {
        summary.ambiguous++;
        console.warn(
          `[backfill] AMBIGUOUS corrupt_id=${row.id} matched ${matches.length} live reviews — leaving in place`
        );
        continue;
      }

      const realEri = matches[0].external_review_id;

      // Does a canonical row already exist with this gp: id?
      const { data: canonicalRow, error: canonicalErr } = await supabase
        .from("reviews")
        .select(
          "id, external_review_id, reply_text, reply_status, reply_published_at, reply_first_published_at, reply_last_edited_at, reply_edit_count, is_read, is_auto_replied, skip_auto_reply, last_seen_in_api_at"
        )
        .eq("connection_id", connId)
        .eq("external_review_id", realEri)
        .maybeSingle();

      if (canonicalErr) {
        console.error(`[backfill] canonical-lookup failed for ${row.id}: ${canonicalErr.message}`);
        summary.errors++;
        continue;
      }

      if (!canonicalRow) {
        // Case (a): straight UPDATE
        console.log(
          `[backfill] PLAN UPDATE corrupt_id=${row.id} ${row.external_review_id} → ${realEri}`
        );
        if (APPLY) {
          const { error: upErr } = await supabase
            .from("reviews")
            .update({ external_review_id: realEri })
            .eq("id", row.id);
          if (upErr) {
            console.error(`[backfill] UPDATE failed for ${row.id}: ${upErr.message}`);
            summary.errors++;
            continue;
          }
        }
        summary.matched_update++;
        continue;
      }

      // Case (b): MERGE then DELETE corrupt
      const plan = planMerge(row, canonicalRow as ReviewRow);
      console.log(
        `[backfill] PLAN MERGE+DELETE corrupt_id=${row.id} → canonical_id=${canonicalRow.id} (${realEri})`
      );
      for (const d of plan.decisions) {
        console.log(`           ${d.field}: from=${d.from} value=${JSON.stringify(d.value)}`);
      }

      if (APPLY) {
        // Atomic merge+delete via RPC. The RPC wraps the UPDATE on canonical
        // and the DELETE on corrupt in a single transaction so a crash
        // between them cannot orphan user-touched fields.
        const { error: rpcErr } = await supabase.rpc("backfill_merge_and_delete_review", {
          p_canonical_id: canonicalRow.id,
          p_corrupt_id: row.id,
          p_update: plan.canonical_update,
        });
        if (rpcErr) {
          console.error(`[backfill] RPC failed for ${row.id}: ${rpcErr.message}`);
          summary.errors++;
          continue;
        }
      }
      summary.matched_merge_delete++;
    }
  }

  console.log("\n[backfill] summary:");
  console.log(`  straight updates  : ${summary.matched_update}`);
  console.log(`  merge + delete    : ${summary.matched_merge_delete}`);
  console.log(`  unmatched         : ${summary.unmatched}`);
  console.log(`  ambiguous         : ${summary.ambiguous}`);
  console.log(`  errors            : ${summary.errors}`);
  if (!APPLY) {
    console.log("\n[backfill] dry-run only. Re-run with --apply to perform writes.");
  }
}

main().catch((e) => {
  console.error("[backfill] fatal:", e);
  process.exit(1);
});
