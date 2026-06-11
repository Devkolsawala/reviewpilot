// Reads the user's STORED, review-derived data for one connected app and
// shapes it for the ASO audit + Grok prompt. READ-ONLY: it never writes to
// reviews or issues — it only aggregates what the Issue Tracker / insights
// pipeline already produced.
//
// Sources (all RLS-scoped to the caller via the passed session client):
//   - reviews.keywords        → review_keywords term frequency
//   - reviews.ai_theme        → additional keyword phrases
//   - reviews.ai_sentiment    → sentiment vote per keyword
//   - reviews.ai_aspects      → ABSA aspect sentiment
//   - issues (status)         → complaint clusters (active vs resolved/fixed)

import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = ReturnType<typeof createClient>;

export type KeywordSentiment = "positive" | "neutral" | "negative";

export interface ReviewKeyword {
  term: string;
  frequency: number;
  sentiment: KeywordSentiment;
}

export interface AspectSentiment {
  aspect: string;
  sentiment_score: number; // -1..1
}

export interface IssueClusters {
  active: string[];
  resolved: string[];
}

export interface AsoReviewData {
  review_keywords: ReviewKeyword[];
  aspect_sentiment: AspectSentiment[];
  issue_clusters: IssueClusters;
}

const MAX_REVIEWS = 500;
const MAX_KEYWORDS = 30;

function normaliseSentiment(value: unknown): KeywordSentiment | null {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (v === "positive" || v === "negative" || v === "neutral") return v;
  return null;
}

interface ReviewRow {
  keywords: string[] | null;
  ai_theme: string | null;
  ai_sentiment: string | null;
  sentiment: string | null;
  ai_aspects: Record<string, unknown> | null;
}

function aggregateKeywords(rows: ReviewRow[]): ReviewKeyword[] {
  // term -> { freq, sentiment vote counts }
  const acc = new Map<
    string,
    { freq: number; pos: number; neg: number; neu: number }
  >();

  for (const row of rows) {
    const sentiment =
      normaliseSentiment(row.ai_sentiment) ??
      normaliseSentiment(row.sentiment) ??
      "neutral";

    const terms: string[] = [];
    if (Array.isArray(row.keywords)) terms.push(...row.keywords);
    // ai_theme is a 2-4 word phrase; treat the whole phrase as one keyword.
    if (row.ai_theme && row.ai_theme.trim()) terms.push(row.ai_theme.trim());

    for (const raw of terms) {
      const term = String(raw || "").trim().toLowerCase();
      if (term.length < 2 || term.length > 40) continue;
      const cur = acc.get(term) ?? { freq: 0, pos: 0, neg: 0, neu: 0 };
      cur.freq += 1;
      if (sentiment === "positive") cur.pos += 1;
      else if (sentiment === "negative") cur.neg += 1;
      else cur.neu += 1;
      acc.set(term, cur);
    }
  }

  return Array.from(acc.entries())
    .map(([term, v]) => {
      let sentiment: KeywordSentiment = "neutral";
      if (v.pos > v.neg && v.pos >= v.neu) sentiment = "positive";
      else if (v.neg > v.pos && v.neg >= v.neu) sentiment = "negative";
      return { term, frequency: v.freq, sentiment };
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, MAX_KEYWORDS);
}

function aggregateAspects(rows: ReviewRow[]): AspectSentiment[] {
  const acc = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    const aspects = row.ai_aspects;
    if (!aspects || typeof aspects !== "object" || Array.isArray(aspects)) continue;
    for (const [aspect, value] of Object.entries(aspects)) {
      const s = normaliseSentiment(value);
      if (!s) continue;
      const key = aspect.trim().toLowerCase();
      if (!key) continue;
      const cur = acc.get(key) ?? { sum: 0, count: 0 };
      cur.sum += s === "positive" ? 1 : s === "negative" ? -1 : 0;
      cur.count += 1;
      acc.set(key, cur);
    }
  }
  return Array.from(acc.entries())
    .map(([aspect, v]) => ({
      aspect,
      sentiment_score: v.count ? Number((v.sum / v.count).toFixed(2)) : 0,
    }))
    .sort((a, b) => a.sentiment_score - b.sentiment_score); // most-negative first
}

/**
 * Gather review-derived data for a connection. `connectionId` may be null
 * (e.g. analysing a package that isn't a connected app) — in that case we
 * return empty review data and the audit/AI fall back gracefully.
 */
export async function getReviewData(
  supabase: SupabaseClient,
  userId: string,
  connectionId: string | null
): Promise<AsoReviewData> {
  if (!connectionId) {
    return { review_keywords: [], aspect_sentiment: [], issue_clusters: { active: [], resolved: [] } };
  }

  const [{ data: reviewRows }, { data: issueRows }] = await Promise.all([
    supabase
      .from("reviews")
      .select("keywords, ai_theme, ai_sentiment, sentiment, ai_aspects")
      .eq("connection_id", connectionId)
      .order("review_created_at", { ascending: false })
      .limit(MAX_REVIEWS),
    supabase
      .from("issues")
      .select("label, status")
      .eq("user_id", userId)
      .eq("connection_id", connectionId)
      .order("review_count", { ascending: false })
      .limit(50),
  ]);

  const rows = (reviewRows ?? []) as ReviewRow[];
  const issues = (issueRows ?? []) as Array<{ label: string | null; status: string | null }>;

  const active: string[] = [];
  const resolved: string[] = [];
  for (const i of issues) {
    const label = (i.label || "").trim();
    if (!label) continue;
    if (i.status === "fixed") resolved.push(label);
    else if (i.status === "active") active.push(label);
  }

  return {
    review_keywords: aggregateKeywords(rows),
    aspect_sentiment: aggregateAspects(rows),
    issue_clusters: { active, resolved },
  };
}
