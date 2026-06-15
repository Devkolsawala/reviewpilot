// Public Play Store scraper for the free "Review Analyzer" tool.
//
// IMPORTANT: Do NOT confuse with src/lib/google/playstore.ts. That module uses
// the authenticated Play Developer API (googleapis + service account) and only
// works on apps the customer has connected via Play Console. This module is
// for the public free tool — it scrapes the public Play Store HTML for ANY
// app id, including ones we don't own (e.g. com.example.app). The two
// modules must remain separate.
//
// Scraping public pages is brittle (Google can change markup, Vercel IPs can
// get rate-limited). getAppMetadata returns a discriminated result so the
// caller can distinguish a genuine "app does not exist" 404 (user typo'd the
// package id) from a transient scraper crash (Google rate-limit, network
// blip, parse error). getRecentReviews keeps returning [] on any failure —
// an app with zero reviews is a valid empty result, not an error.

// Lazy-loaded because google-play-scraper@10+ ships as ESM-only (no CJS
// entry point). A top-level `import gplay from "google-play-scraper"` works
// fine for tsc and `next dev`, but Vercel bundles API routes as CommonJS and
// the resulting `require()` of an ESM-only module crashes at runtime with
// ERR_REQUIRE_ESM. Deferring to a dynamic import sidesteps the bundling
// issue entirely — Node loads the ESM module via its native loader at the
// first call, and we memoize the promise so subsequent calls are free.
let gplayModulePromise:
  | Promise<typeof import("google-play-scraper")>
  | null = null;
function loadGplay() {
  if (!gplayModulePromise) {
    gplayModulePromise = import("google-play-scraper");
  }
  return gplayModulePromise;
}

const SCRAPE_TIMEOUT_MS = 10_000;

export interface AppMetadata {
  packageId: string;
  appName: string;
  iconUrl: string;
  developer: string;
  score: number;          // 0..5
  ratingCount: number;    // total ratings
  reviewCount: number;    // total written reviews
  histogram: { "1": number; "2": number; "3": number; "4": number; "5": number };
  description: string;
  genre: string;
}

export interface PublicReview {
  id: string;
  author: string;
  rating: number;          // 1..5
  text: string;
  date: string;            // ISO 8601
  thumbsUp: number;
  replyText: string | null;
  replyDate: string | null;
  version: string | null;
}

export type AppMetadataResult =
  | { ok: true; data: AppMetadata }
  | { ok: false; reason: "not_found" | "crashed" };

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`scrape_timeout:${label}:${ms}ms`)),
        ms
      )
    ),
  ]);
}

// google-play-scraper throws a plain Error whose message includes the HTTP
// status when the public Play Store page returns 404. The lib doesn't expose
// a typed error class, so we match on the well-known message shape. Keep this
// permissive: the upstream lib has changed the exact wording at least once
// across major versions ("Response code 404 (Not Found)" vs. "App not
// found"), so match any of them.
function isAppNotFoundError(err: unknown): boolean {
  const msg = (err as { message?: unknown })?.message;
  if (typeof msg !== "string") return false;
  return /\b404\b|app not found|not found \(404\)/i.test(msg);
}

export async function getAppMetadata(
  packageId: string
): Promise<AppMetadataResult> {
  try {
    const gplay = (await loadGplay()).default;
    const data = await withTimeout(
      gplay.app({ appId: packageId, lang: "en", country: "in" }),
      SCRAPE_TIMEOUT_MS,
      "app"
    );
    const hist = data.histogram || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    return {
      ok: true,
      data: {
        packageId,
        appName: data.title || packageId,
        iconUrl: data.icon || "",
        developer: data.developer || "",
        score: typeof data.score === "number" ? data.score : 0,
        ratingCount: typeof data.ratings === "number" ? data.ratings : 0,
        reviewCount: typeof data.reviews === "number" ? data.reviews : 0,
        histogram: {
          "1": Number(hist["1"] || 0),
          "2": Number(hist["2"] || 0),
          "3": Number(hist["3"] || 0),
          "4": Number(hist["4"] || 0),
          "5": Number(hist["5"] || 0),
        },
        description: (data.description || "").slice(0, 2000),
        genre: data.genre || "",
      },
    };
  } catch (err) {
    if (isAppNotFoundError(err)) {
      console.warn(
        "[play-store-scraper] app not found",
        packageId,
        (err as Error).message
      );
      return { ok: false, reason: "not_found" };
    }
    console.error(
      "[play-store-scraper] getAppMetadata failed",
      packageId,
      (err as Error).message
    );
    return { ok: false, reason: "crashed" };
  }
}

// ── ASO listing metadata ──────────────────────────────────────────────────────
// Used by the paid ASO Analysis feature. Reuses the SAME google-play-scraper
// dependency + memoized loader + timeout as getAppMetadata above — it just maps
// the additional listing fields the ASO audit needs (short/long description,
// installs bucket, category, screenshot count) which the analyzer's
// AppMetadata shape doesn't carry. No new scraping dependency is introduced.

export interface AsoListingMetadata {
  packageId: string;
  title: string;
  shortDescription: string;   // Play "summary" — the 80-char tagline
  longDescription: string;    // full store description
  rating: number | null;      // 0..5, null when Play omits it
  installs: string | null;    // human bucket, e.g. "1,000,000+"
  category: string | null;    // genre, e.g. "Productivity"
  screenshotCount: number;
}

export type AsoListingResult =
  | { ok: true; data: AsoListingMetadata }
  | { ok: false; reason: "not_found" | "crashed" };

export async function getListingMetadata(
  packageId: string
): Promise<AsoListingResult> {
  try {
    const gplay = (await loadGplay()).default;
    const data = await withTimeout(
      gplay.app({ appId: packageId, lang: "en", country: "in" }),
      SCRAPE_TIMEOUT_MS,
      "aso-app"
    );
    const screenshots = Array.isArray(data.screenshots) ? data.screenshots : [];
    return {
      ok: true,
      data: {
        packageId,
        title: data.title || packageId,
        shortDescription: (data.summary || "").trim(),
        // Cap the long description to bound the AI token budget; full Play
        // descriptions can be 4000 chars and we never need more for the audit.
        longDescription: (data.description || "").slice(0, 6000),
        rating: typeof data.score === "number" ? data.score : null,
        installs:
          (typeof data.installs === "string" && data.installs) ||
          (typeof data.minInstalls === "number"
            ? `${data.minInstalls.toLocaleString("en-US")}+`
            : null),
        category: data.genre || null,
        screenshotCount: screenshots.length,
      },
    };
  } catch (err) {
    if (isAppNotFoundError(err)) {
      console.warn(
        "[play-store-scraper] aso listing not found",
        packageId,
        (err as Error).message
      );
      return { ok: false, reason: "not_found" };
    }
    console.error(
      "[play-store-scraper] getListingMetadata failed",
      packageId,
      (err as Error).message
    );
    return { ok: false, reason: "crashed" };
  }
}

export async function getRecentReviews(
  packageId: string,
  count = 150
): Promise<PublicReview[]> {
  try {
    const gplay = (await loadGplay()).default;
    // The package's d.ts `declare enum sort` is not exported, so
    // gplay.sort.NEWEST is invisible on the typed surface even though it
    // exists at runtime. Narrow at the callsite rather than at module level
    // (we no longer have a module-level gplay binding to attach SORT to).
    const SORT = gplay.sort as unknown as {
      NEWEST: number;
      RATING: number;
      HELPFULNESS: number;
    };
    const result = await withTimeout(
      gplay.reviews({
        appId: packageId,
        lang: "en",
        country: "in",
        sort: SORT.NEWEST,
        num: count,
      }),
      SCRAPE_TIMEOUT_MS,
      "reviews"
    );

    const items = result?.data ?? [];
    return items.map((r) => ({
      id: String(r.id ?? ""),
      author: r.userName || "Anonymous",
      rating: typeof r.score === "number" ? r.score : 0,
      text: r.text || "",
      date: r.date || new Date().toISOString(),
      thumbsUp: typeof r.thumbsUp === "number" ? r.thumbsUp : 0,
      replyText: r.replyText && r.replyText.trim().length > 0 ? r.replyText : null,
      replyDate: r.replyDate || null,
      version: r.version || null,
    }));
  } catch (err) {
    console.error(
      "[play-store-scraper] getRecentReviews failed",
      packageId,
      (err as Error).message
    );
    return [];
  }
}

// Asset/file extensions and crawler-probe suffixes. Strings like "script.js",
// "script.js.map", "robots.txt", and "sitemap.xml" are dot-separated lowercase
// tokens, so the naive reverse-domain regex below treats them as valid package
// ids. When that happens on /insights/[packageId] they get appended to the
// rate-limiter's unique_packages array and burn the 20/day hard cap. Rejecting
// any id whose final segment is a known asset extension fixes that without a
// TLD allowlist (real package ids aren't real domains).
const ASSET_EXTENSIONS = new Set([
  "js", "mjs", "cjs", "jsx", "ts", "tsx", "map", "css", "scss",
  "png", "jpg", "jpeg", "gif", "ico", "svg", "webp", "avif", "bmp",
  "txt", "json", "xml", "webmanifest", "csv", "pdf", "wasm",
  "html", "htm", "php", "woff", "woff2", "ttf", "eot", "otf",
  "mp4", "webm", "mp3", "wav", "zip", "gz",
]);

// Reverse-domain shape: at least two dot-separated segments, each starting
// with a letter. Mirrors Android application-id rules closely enough for a
// public validator. NOTE: this alone still matches "script.js" — the asset
// extension check in isValidPackageId is what rejects those.
const PACKAGE_ID_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i;

// True only for plausible Android application ids. Used both to validate user
// input (parsePackageId) and to guard the /insights/[packageId] route before
// it reserves any quota.
export function isValidPackageId(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 255) return false;
  if (!PACKAGE_ID_RE.test(trimmed)) return false;

  const lastDot = trimmed.lastIndexOf(".");
  const finalSegment = trimmed.slice(lastDot + 1).toLowerCase();
  if (ASSET_EXTENSIONS.has(finalSegment)) return false;

  return true;
}

// Parse a Play Store URL and return the package id, or null if the URL is not
// a recognizable Play Store app URL. Accepts:
//   https://play.google.com/store/apps/details?id=com.example.app
//   https://play.google.com/store/apps/details?id=com.x&hl=en&gl=in
//   market://details?id=com.x
// Also accepts a bare package id (com.example.app) for convenience.
export function parsePackageId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // Bare package id like "com.example.app"
  if (isValidPackageId(trimmed)) return trimmed;

  // URL forms — pull id= query param without constructing URL to tolerate
  // market:// scheme and tracker garbage.
  const match = trimmed.match(/[?&]id=([a-zA-Z0-9_.]+)/);
  if (match && match[1] && isValidPackageId(match[1])) return match[1];

  return null;
}
