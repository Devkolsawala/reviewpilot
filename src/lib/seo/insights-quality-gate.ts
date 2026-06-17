// Quality gate for public /insights/[packageId] pages.
//
// A page only stays indexable when it carries enough unique, substantive data
// to rank legitimately. Everything else (cache-miss, an app with no real
// rating, too few analyzed reviews, or no extracted themes) is served with
// robots noindex so thin/templated pages never enter the search index. We keep
// follow:true so internal crawl equity still flows through these pages.
//
// These floors are the SINGLE source of truth — adjust them here, not inline.
// Both generateMetadata and any future consumer (e.g. the Step 3 sitemap) must
// call passesInsightsQualityGate so the indexing decision can never drift.

import type { AnalysisResult } from "@/lib/analyzer/pipeline";

export const INSIGHTS_GATE = {
  /** Total Play Store ratings behind the displayed score. Filters brand-new /
   *  no-name apps that have effectively no public signal. */
  minRatingCount: 50,
  /** Reviews actually analyzed for this report (drives every metric on-page). */
  minReviewCount: 30,
  /** Complaint + praise clusters combined; at least one is required so the page
   *  has genuine, non-boilerplate content. */
  minThemeCount: 1,
} as const;

/** Indexable: substantive page that can rank on its own merits. */
export const INSIGHTS_INDEXABLE = { index: true, follow: true } as const;
/** Below threshold: keep out of the index, but let link equity flow through. */
export const INSIGHTS_NOINDEX = { index: false, follow: true } as const;

/**
 * True when an /insights page is substantive enough to be indexable.
 * `null` (cache-miss / no row) always fails the gate.
 */
export function passesInsightsQualityGate(
  result: AnalysisResult | null
): boolean {
  if (!result) return false;
  const { app, analysis } = result;
  // A failed clustering run is recoverable, not genuinely thin — never index it
  // (it would otherwise re-run and gain themes). The tool re-runs flagged rows.
  if (analysis.clusteringFailed) return false;
  const themeCount = analysis.complaints.length + analysis.praises.length;
  return (
    typeof app.score === "number" &&
    app.score > 0 &&
    app.ratingCount >= INSIGHTS_GATE.minRatingCount &&
    analysis.reviewCount >= INSIGHTS_GATE.minReviewCount &&
    themeCount >= INSIGHTS_GATE.minThemeCount
  );
}
