// Single source of truth for the /insights quality-gate thresholds.
//
// Plain CommonJS on purpose: this is imported BOTH by the TypeScript gate
// (src/lib/seo/insights-quality-gate.ts) AND required by the CommonJS
// next-sitemap.config.js build-time hook. Keeping the numbers here means the
// hub, the per-page robots gate, and the sitemap can never silently drift.
//
// Adjust thresholds HERE only. The gate's predicate logic lives in
// insights-quality-gate.ts and is unaffected by this file.

/** @type {{ minRatingCount: number, minReviewCount: number, minThemeCount: number }} */
const INSIGHTS_GATE = {
  /** Total Play Store ratings behind the displayed score. */
  minRatingCount: 50,
  /** Reviews actually analyzed for this report (drives every metric on-page). */
  minReviewCount: 30,
  /** Complaint + praise clusters combined; at least one is required. */
  minThemeCount: 1,
};

module.exports = { INSIGHTS_GATE };
