// Deterministic, data-driven copy for indexable /insights pages.
//
// Builds a prose summary + FAQ entirely from the metrics/themes already in the
// cached row — NO AI call, NO network, no page-load cost. Theme *labels* (short
// generated descriptors like "poor customer support") are surfaced verbatim and
// attributed to reviewers; scraped review quotes are never used as body copy.
// ratingTrend90d is intentionally excluded: it is computed from the recent
// sample only and would mislead next to the store rating.
//
// The FAQ array is the SINGLE source for both the visible FAQ and the FAQPage
// JSON-LD, so rendered content and schema can never disagree.

import type { AnalysisResult } from "@/lib/analyzer/pipeline";
import type { TopicCluster } from "@/lib/analyzer/pipeline";

export interface InsightsFaq {
  q: string;
  a: string;
}

export interface InsightsCopy {
  summary: string[];
  faqs: InsightsFaq[];
  lastUpdatedDisplay: string;
  methodologyNote: string;
}

function mentions(n: number): string {
  return `${n} ${n === 1 ? "mention" : "mentions"}`;
}

// Top `max` themes by count, rendered as "a (N mentions), b (M mentions), and c
// (K mentions)". Sorted by count desc so "most often" / "most common" is true.
function themeList(items: TopicCluster[], max: number): string {
  const picked = [...items]
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
    .map((t) => `${t.label} (${mentions(t.count)})`);
  if (picked.length === 0) return "";
  if (picked.length === 1) return picked[0];
  if (picked.length === 2) return `${picked[0]} and ${picked[1]}`;
  return `${picked.slice(0, -1).join(", ")}, and ${picked[picked.length - 1]}`;
}

function ratingCountProse(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} million`;
  return new Intl.NumberFormat("en-IN").format(n);
}

// Brand portion of a store title for repeated references, e.g.
// "CRED: Credit Cards, Bills, UPI" → "CRED", "axio: Expense Tracker" → "axio".
// Splits on the first " : | – — " style delimiter; falls back to the full name
// when there's no clean split or the head is too short.
function shortName(appName: string): string {
  const head = appName.split(/[:|–—]| - /)[0].trim();
  return head.length >= 2 ? head : appName;
}

export function buildInsightsCopy(result: AnalysisResult): InsightsCopy {
  const { app, analysis } = result;
  const name = app.appName;
  const total = analysis.reviewCount;
  const sent = analysis.metrics.sentimentBreakdown;
  const posPct = total ? Math.round((sent.positive / total) * 100) : 0;
  const neuPct = total ? Math.round((sent.neutral / total) * 100) : 0;
  const negPct = Math.max(0, 100 - posPct - neuPct);
  const responsePct = Math.round(analysis.metrics.responseRate * 100);
  const unreplied = analysis.metrics.unrepliedNegativeCount;
  const recoverable = analysis.metrics.recoverableCount;
  const scoreStr = app.score ? app.score.toFixed(2) : "—";
  const exact = new Intl.NumberFormat("en-IN").format(app.ratingCount);
  const short = shortName(name);

  const { complaints, praises } = analysis;

  // ── Summary paragraphs ──
  const overview = `${name} holds a ${scoreStr}★ rating from ${ratingCountProse(
    app.ratingCount
  )} ratings on Google Play. This report looks at the ${total} most recent public reviews, of which ${posPct}% are positive, ${neuPct}% neutral, and ${negPct}% negative.`;

  const themeSentences: string[] = [];
  if (praises.length > 0) {
    themeSentences.push(`Reviewers most often praise ${themeList(praises, 3)}.`);
  } else if (complaints.length > 0) {
    themeSentences.push(
      `Recent feedback skews critical, with no recurring praise themes in this sample.`
    );
  }
  if (complaints.length > 0) {
    themeSentences.push(
      `The most common complaints centre on ${themeList(complaints, 3)}.`
    );
  } else if (praises.length > 0) {
    themeSentences.push(`No recurring complaint themes surfaced in this sample.`);
  }
  const themePara = themeSentences.join(" ");

  const responsePara = `The developer has replied to about ${responsePct}% of these recent reviews, leaving ${unreplied} negative ${
    unreplied === 1 ? "review" : "reviews"
  } unanswered${
    recoverable > 0
      ? ` — ${recoverable} of them detailed enough to be worth a recovery reply`
      : ""
  }.`;

  const summary = [overview, themePara, responsePara].filter(
    (p) => p.length > 0
  );

  // ── FAQ (single source for visible render + JSON-LD) ──
  const faqs: InsightsFaq[] = [
    {
      q: `What is ${short}'s rating on Google Play?`,
      a: `${short} currently shows ${scoreStr}★, based on ${exact} ratings on the Play Store.`,
    },
    {
      q: `How responsive is ${short} to user reviews?`,
      a: `In the ${total} most recent reviews analysed, the developer had replied to ${responsePct}%. ${unreplied} negative ${
        unreplied === 1 ? "review was" : "reviews were"
      } still unanswered.`,
    },
  ];
  if (complaints.length > 0) {
    faqs.push({
      q: `What do users complain about most in ${short} reviews?`,
      a: `The most common complaint themes are ${themeList(complaints, 3)}.`,
    });
  }
  if (praises.length > 0) {
    faqs.push({
      q: `What do users like most about ${short}?`,
      a: `The top praise themes are ${themeList(praises, 3)}.`,
    });
  }
  faqs.push({
    q: `How positive are ${short}'s recent reviews?`,
    a: `Of the ${total} most recent reviews, ${posPct}% are positive, ${neuPct}% neutral, and ${negPct}% negative.`,
  });

  // ── Last updated + methodology ──
  const lastUpdatedDisplay = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(analysis.generatedAt));

  const methodologyNote = `Based on the ${total} most recent public Play Store reviews for this app — sentiment, themes, and reply rate are computed from that sample, not the app's entire review history. The star rating and rating count are the current public Play Store figures.`;

  return { summary, faqs, lastUpdatedDisplay, methodologyNote };
}
