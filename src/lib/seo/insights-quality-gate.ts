// Quality gate for public /insights/[packageId] pages.
//
// A page only stays indexable when it carries enough unique, substantive data
// to rank legitimately. Everything else (cache-miss, an app with no real
// rating, too few analyzed reviews, or no extracted themes) is served with
// robots noindex so thin/templated pages never enter the search index. We keep
// follow:true so internal crawl equity still flows through these pages.
//
// The threshold numbers live in ./insights-gate-constants.js — a plain-CJS
// module shared with next-sitemap.config.js so the build-time sitemap query and
// this runtime gate can never drift. Adjust the numbers there; the predicate
// below is the single behavioural source of truth (hub, robots, and sitemap all
// derive their decision from it).

import type { AnalysisResult } from "@/lib/analyzer/pipeline";
import { INSIGHTS_GATE } from "./insights-gate-constants";

export { INSIGHTS_GATE };

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
