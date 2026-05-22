// Orchestrates a single analyzer run: scrape → metrics → AI cluster → reply
// preview → cache. All AI calls go through src/lib/tools/xai.ts so we inherit
// the project's xAI client, model default, retry/backoff, and rate limiter.
//
// One xAI call for clustering complaints+praises (single multi-topic prompt)
// and one for the sample reply. Metrics + recoverable count are computed from
// scraped fields — we don't fire per-review AI calls; that would blow the
// 30s Vercel budget on a 150-review batch.

import { toolCompletion } from "@/lib/tools/xai";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAppMetadata,
  getRecentReviews,
  type AppMetadata,
  type PublicReview,
} from "./play-store-scraper";

const XAI_TIMEOUT_MS = 20_000;

export interface TopicCluster {
  label: string;
  count: number;
  sampleQuotes: string[];
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface RatingTrendPoint {
  date: string;   // YYYY-MM-DD
  avg: number;    // average rating that day
  count: number;  // number of reviews that day
}

export interface AnalyzerMetrics {
  responseRate: number;            // 0..1
  unrepliedNegativeCount: number;  // ≤3★ with no developer reply
  sentimentBreakdown: SentimentBreakdown;
  ratingTrend90d: RatingTrendPoint[];
  recoverableCount: number;
}

export interface AnalysisPayload {
  metrics: AnalyzerMetrics;
  complaints: TopicCluster[];
  praises: TopicCluster[];
  sampleReply: {
    reviewId: string;
    reviewText: string;
    reviewRating: number;
    reply: string;
  } | null;
  reviewCount: number;
  generatedAt: string;
}

export interface AnalysisResult {
  packageId: string;
  app: AppMetadata;
  analysis: AnalysisPayload;
  cached: boolean;
  insightUrl: string;
}

// ── Metrics (pure, no AI) ────────────────────────────────────────────────────

export function computeMetrics(reviews: PublicReview[]): AnalyzerMetrics {
  const total = reviews.length;
  const replied = reviews.filter((r) => r.replyText !== null).length;
  const negative = reviews.filter((r) => r.rating <= 3);
  const unrepliedNegative = negative.filter((r) => r.replyText === null);

  const sentimentBreakdown: SentimentBreakdown = {
    positive: reviews.filter((r) => r.rating >= 4).length,
    neutral: reviews.filter((r) => r.rating === 3).length,
    negative: reviews.filter((r) => r.rating <= 2).length,
  };

  // 90-day daily rolling average. Group by YYYY-MM-DD in UTC.
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const t = Date.parse(r.date);
    if (Number.isNaN(t) || t < cutoff) continue;
    const day = new Date(t).toISOString().slice(0, 10);
    const b = buckets.get(day) ?? { sum: 0, count: 0 };
    b.sum += r.rating;
    b.count += 1;
    buckets.set(day, b);
  }
  const ratingTrend90d: RatingTrendPoint[] = Array.from(buckets.entries())
    .map(([date, b]) => ({
      date,
      avg: b.count ? Number((b.sum / b.count).toFixed(2)) : 0,
      count: b.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Recoverable = unreplied ≤3★ reviews with non-trivial text. Heuristic
  // proxy for the Recovery Engine's notion of actionable negatives; running
  // the full per-review classifier on 150 rows would blow our 30s budget on
  // a free public tool.
  const recoverableCount = unrepliedNegative.filter(
    (r) => (r.text || "").trim().length >= 15
  ).length;

  return {
    responseRate: total === 0 ? 0 : Number((replied / total).toFixed(3)),
    unrepliedNegativeCount: unrepliedNegative.length,
    sentimentBreakdown,
    ratingTrend90d,
    recoverableCount,
  };
}

// ── AI topic clustering ──────────────────────────────────────────────────────

interface RawClusters {
  complaints?: Array<{ label?: unknown; count?: unknown; quotes?: unknown }>;
  praises?: Array<{ label?: unknown; count?: unknown; quotes?: unknown }>;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`xai_timeout:${label}:${ms}ms`)), ms)
    ),
  ]);
}

function coerceClusters(raw: RawClusters["complaints"]): TopicCluster[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 6)
    .map((c) => {
      const label = typeof c?.label === "string" ? c.label.trim().slice(0, 60) : "";
      const count =
        typeof c?.count === "number" && Number.isFinite(c.count)
          ? Math.max(0, Math.floor(c.count))
          : 0;
      const quotesRaw = Array.isArray(c?.quotes) ? c.quotes : [];
      const sampleQuotes = quotesRaw
        .filter((q): q is string => typeof q === "string")
        .map((q) => q.trim().slice(0, 240))
        .filter((q) => q.length >= 3)
        .slice(0, 3);
      return { label, count, sampleQuotes };
    })
    .filter((c) => c.label.length > 0);
}

export async function clusterTopics(
  reviews: PublicReview[]
): Promise<{ complaints: TopicCluster[]; praises: TopicCluster[] }> {
  const sampled = reviews
    .filter((r) => (r.text || "").trim().length >= 8)
    .slice(0, 80)
    .map((r, i) => `[${i + 1}] (${r.rating}★) ${r.text.replace(/\s+/g, " ").slice(0, 280)}`)
    .join("\n");

  if (!sampled) return { complaints: [], praises: [] };

  const system = `You analyze app reviews for an Indian SaaS called ReviewPilot. Reviewers may write in English, Hindi, Hinglish, or other Indian languages. Group reviews into recurring COMPLAINT clusters and PRAISE clusters.

Return STRICT JSON only — no preamble, no markdown, no code fences. Shape:
{"complaints":[{"label":"...","count":N,"quotes":["...","..."]}],"praises":[{"label":"...","count":N,"quotes":["...","..."]}]}

Rules:
- Up to 5 complaint clusters and up to 5 praise clusters, ordered by frequency.
- "label" is 2–4 lowercase English words naming the specific theme (e.g. "payment failures", "slow checkout", "great delivery", "polite staff"). Never generic like "bad app" or "good service".
- "count" is the number of reviews in the input that belong to the cluster.
- "quotes" is up to 3 verbatim short snippets (≤200 chars each) from the input that exemplify the cluster.
- Complaints come from negative-tone reviews, praises from positive-tone reviews. Ignore reviews too vague to cluster.
- If there are no complaints or no praises, return that side as an empty array.`;

  const user = `Reviews:\n${sampled}\n\nReturn the JSON object now.`;

  let raw = "";
  try {
    raw = await withTimeout(
      toolCompletion({
        system,
        user,
        maxTokens: 900,
        context: "analyzer-clusters",
      }),
      XAI_TIMEOUT_MS,
      "clusterTopics"
    );
  } catch (err) {
    console.error("[analyzer-pipeline] clusterTopics failed", (err as Error).message);
    return { complaints: [], praises: [] };
  }

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return { complaints: [], praises: [] };

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as RawClusters;
    return {
      complaints: coerceClusters(parsed.complaints),
      praises: coerceClusters(parsed.praises),
    };
  } catch {
    return { complaints: [], praises: [] };
  }
}

// ── Sample reply preview ─────────────────────────────────────────────────────

export async function generateSampleReply(
  worst: PublicReview,
  app: AppMetadata
): Promise<string> {
  const system = `You are a senior customer-support writer for ${app.appName}, an app in the "${app.genre}" category on Google Play. Write a single empathetic reply (≤300 characters) to the user's review.

Rules:
- Acknowledge the specific issue named in the review.
- Apologise briefly, then state ONE concrete next step (e.g. "please email support@... with your order id" or "tap Settings → Help → Report a problem").
- Plain text only — no markdown, no greetings like "Dear user", no sign-off, no quotes around the reply.
- Match the reviewer's likely language (English or Hinglish). Keep it warm and professional.
- Output ONLY the reply text. No preamble.`;

  const user = `Rating: ${worst.rating}/5\nReview: ${worst.text.slice(0, 800)}`;

  try {
    return await withTimeout(
      toolCompletion({
        system,
        user,
        maxTokens: 220,
        context: "analyzer-sample-reply",
      }),
      XAI_TIMEOUT_MS,
      "sampleReply"
    );
  } catch (err) {
    console.error(
      "[analyzer-pipeline] generateSampleReply failed",
      (err as Error).message
    );
    return "";
  }
}

// ── Cache I/O ────────────────────────────────────────────────────────────────

interface CachedAnalysisRow {
  package_id: string;
  app_name: string | null;
  app_icon_url: string | null;
  rating: number | null;
  rating_count: number | null;
  analysis: AnalysisPayload | null;
  scraped_at: string;
  expires_at: string;
}

export async function readCachedAnalysis(
  packageId: string
): Promise<AnalysisResult | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("public_app_analyses")
    .select(
      "package_id, app_name, app_icon_url, rating, rating_count, analysis, scraped_at, expires_at"
    )
    .eq("package_id", packageId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as CachedAnalysisRow;
  if (!row.analysis) return null;

  if (Date.parse(row.expires_at) <= Date.now()) return null;

  return {
    packageId,
    app: {
      packageId,
      appName: row.app_name ?? packageId,
      iconUrl: row.app_icon_url ?? "",
      developer: "",
      score: row.rating ?? 0,
      ratingCount: row.rating_count ?? 0,
      reviewCount: row.analysis.reviewCount,
      histogram: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
      description: "",
      genre: "",
    },
    analysis: row.analysis,
    cached: true,
    insightUrl: `/insights/${packageId}`,
  };
}

async function writeCachedAnalysis(
  packageId: string,
  app: AppMetadata,
  analysis: AnalysisPayload
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("public_app_analyses")
    .upsert(
      {
        package_id: packageId,
        app_name: app.appName,
        app_icon_url: app.iconUrl,
        rating: app.score,
        rating_count: app.ratingCount,
        analysis,
        scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "package_id" }
    );
  if (error) {
    console.error("[analyzer-pipeline] cache write failed", error.message);
  }
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export type RunAnalysisError =
  | { ok: false; code: "app_not_found" | "scrape_failed" | "internal" };
export type RunAnalysisOk = { ok: true; result: AnalysisResult };
export type RunAnalysisOutcome = RunAnalysisOk | RunAnalysisError;

export async function runFreshAnalysis(
  packageId: string
): Promise<RunAnalysisOutcome> {
  const [appResult, reviews] = await Promise.all([
    getAppMetadata(packageId),
    getRecentReviews(packageId, 150),
  ]);

  if (!appResult.ok) {
    return {
      ok: false,
      code: appResult.reason === "not_found" ? "app_not_found" : "scrape_failed",
    };
  }
  const app = appResult.data;

  if (reviews.length === 0) {
    // App exists but has no reviews — return a minimal payload so the page
    // can still render the app metadata without crashing.
    const empty: AnalysisPayload = {
      metrics: {
        responseRate: 0,
        unrepliedNegativeCount: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        ratingTrend90d: [],
        recoverableCount: 0,
      },
      complaints: [],
      praises: [],
      sampleReply: null,
      reviewCount: 0,
      generatedAt: new Date().toISOString(),
    };
    await writeCachedAnalysis(packageId, app, empty);
    return {
      ok: true,
      result: {
        packageId,
        app,
        analysis: empty,
        cached: false,
        insightUrl: `/insights/${packageId}`,
      },
    };
  }

  const metrics = computeMetrics(reviews);

  // Worst unreplied negative review = best candidate for the sample reply
  // demo. Falls back to the lowest-rated review with any text.
  const worst =
    reviews
      .filter((r) => r.replyText === null && r.text.trim().length >= 15)
      .sort((a, b) => a.rating - b.rating)[0] ??
    reviews
      .filter((r) => r.text.trim().length >= 15)
      .sort((a, b) => a.rating - b.rating)[0] ??
    null;

  const [clusters, sampleReplyText] = await Promise.all([
    clusterTopics(reviews),
    worst ? generateSampleReply(worst, app) : Promise.resolve(""),
  ]);

  const analysis: AnalysisPayload = {
    metrics,
    complaints: clusters.complaints,
    praises: clusters.praises,
    sampleReply:
      worst && sampleReplyText
        ? {
            reviewId: worst.id,
            reviewText: worst.text.slice(0, 600),
            reviewRating: worst.rating,
            reply: sampleReplyText,
          }
        : null,
    reviewCount: reviews.length,
    generatedAt: new Date().toISOString(),
  };

  await writeCachedAnalysis(packageId, app, analysis);

  return {
    ok: true,
    result: {
      packageId,
      app,
      analysis,
      cached: false,
      insightUrl: `/insights/${packageId}`,
    },
  };
}
