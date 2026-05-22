/* eslint-disable react/no-unescaped-entities */
// Permanent SEO-friendly URL for a Play Store app's analyzer report.
//
// Cache hit  → render immediately, free.
// Cache miss → run a fresh analysis subject to per-IP daily rate limit. If
//              the IP is over quota or the scrape fails, render a graceful
//              empty state with a link back to /tools/play-store-analyzer.
//
// Touches the scraper pipeline indirectly via Supabase reads, so must run on
// the Node.js runtime — google-play-scraper depends on Node-only APIs.

import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Star } from "lucide-react";
import { JsonLd } from "@/components/marketing/JsonLd";
import {
  softwareApplicationSchema,
  breadcrumbSchema,
  SITE_URL,
} from "@/lib/seo/schema";
import {
  readCachedAnalysis,
  runFreshAnalysis,
  type AnalysisResult,
} from "@/lib/analyzer/pipeline";
import {
  hashIp,
  releaseQuota,
  reserveQuota,
} from "@/lib/analyzer/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  packageId: string;
}

interface PageProps {
  params: RouteParams;
}

// Reuse Phase A's IP helper without coupling client/server — headers() lives
// only on the server.
function ipFromHeaders(): string {
  const h = headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0];
    if (first) return first.trim();
  }
  return h.get("x-real-ip")?.trim() ?? "unknown";
}

async function loadAnalysis(packageId: string): Promise<AnalysisResult | null> {
  const cached = await readCachedAnalysis(packageId).catch(() => null);
  if (cached) return cached;

  const ipHash = hashIp(ipFromHeaders());
  // Atomic reserve — matches the POST route. If we get a slot but the
  // pipeline fails, refund so the user does not lose quota to a scrape
  // error on a public crawl.
  const reservation = await reserveQuota(ipHash, packageId).catch(() => null);
  if (!reservation || !reservation.accepted) return null;

  const outcome = await runFreshAnalysis(packageId).catch(() => null);
  if (!outcome || !outcome.ok) {
    await releaseQuota(ipHash).catch(() => undefined);
    return null;
  }
  return outcome.result;
}

// Don't try to scrape from generateMetadata — it runs on every request, has
// no body output, and would silently burn quota. Read cache only; fall back
// to a generic title if not cached.
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const cached = await readCachedAnalysis(params.packageId).catch(() => null);
  const url = `${SITE_URL}/insights/${params.packageId}`;

  const appName = cached?.app.appName || params.packageId;
  const title = `${appName} Reviews Analysis — Rating, Sentiment & Response Rate`;
  const description = cached
    ? `${appName}: ${(cached.app.score || 0).toFixed(2)}★ from ${
        cached.app.ratingCount
      } ratings. Sentiment breakdown, ${Math.round(
        cached.analysis.metrics.responseRate * 100
      )}% developer response rate, top complaints, and a sample AI reply.`
    : `Free Play Store analysis for ${params.packageId}: sentiment breakdown, response rate, top complaints, and a sample AI reply.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function InsightsPage({ params }: PageProps) {
  const result = await loadAnalysis(params.packageId);

  if (!result) {
    return <EmptyState packageId={params.packageId} />;
  }

  const { app, analysis } = result;
  const url = `${SITE_URL}/insights/${params.packageId}`;
  const total = analysis.reviewCount;
  const responsePct = Math.round(analysis.metrics.responseRate * 100);
  const sent = analysis.metrics.sentimentBreakdown;
  const positivePct = total ? Math.round((sent.positive / total) * 100) : 0;
  const neutralPct = total ? Math.round((sent.neutral / total) * 100) : 0;
  const negativePct = Math.max(0, 100 - positivePct - neutralPct);

  const schemas = [
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Insights", url: `${SITE_URL}/insights` },
      { name: app.appName, url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: app.appName,
      url,
      applicationCategory: "MobileApplication",
      operatingSystem: "Android",
      ...(app.iconUrl ? { image: app.iconUrl } : {}),
      ...(app.developer
        ? { author: { "@type": "Organization", name: app.developer } }
        : {}),
      ...(app.score && app.ratingCount
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(app.score.toFixed(2)),
              ratingCount: app.ratingCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    } as Record<string, unknown>,
    softwareApplicationSchema({
      name: "ReviewPilot Play Store Review Analyzer",
      description:
        "Free analyzer that audits any Play Store app's response rate, sentiment, and recoverable reviews.",
      url: `${SITE_URL}/tools/play-store-analyzer`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (web)",
    }),
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-xs text-muted-foreground">
          <Link href="/tools/play-store-analyzer" className="hover:underline">
            ← Analyze another app
          </Link>
        </p>

        <header className="mt-6 flex items-start gap-4">
          {app.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={app.iconUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl border border-border/60"
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-2xl border border-border/60 bg-muted/40" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
              {app.appName}
            </h1>
            {app.developer && (
              <p className="truncate text-sm text-muted-foreground">
                {app.developer}
              </p>
            )}
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {app.score ? app.score.toFixed(2) : "—"}
              </span>
              {app.ratingCount > 0 && (
                <span>
                  ({Intl.NumberFormat("en-IN").format(app.ratingCount)} ratings)
                </span>
              )}
            </p>
          </div>
        </header>

        <h2 className="sr-only">Review analysis summary</h2>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Metric label="Response rate" value={`${responsePct}%`} />
          <Metric
            label="Unreplied negatives"
            value={analysis.metrics.unrepliedNegativeCount}
          />
          <Metric
            label="Recoverable reviews"
            value={analysis.metrics.recoverableCount}
          />
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Sentiment (last {total} reviews)
          </p>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted/40">
            <div className="bg-emerald-500" style={{ width: `${positivePct}%` }} />
            <div className="bg-amber-400" style={{ width: `${neutralPct}%` }} />
            <div className="bg-rose-500" style={{ width: `${negativePct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Positive {positivePct}%</span>
            <span>Neutral {neutralPct}%</span>
            <span>Negative {negativePct}%</span>
          </div>
        </div>

        {analysis.complaints.length > 0 && (
          <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Top complaints
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {analysis.complaints.map((c) => (
                <div
                  key={c.label}
                  className="rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize text-foreground">
                      {c.label}
                    </p>
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-600">
                      {c.count}
                    </span>
                  </div>
                  {c.sampleQuotes[0] && (
                    <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground">
                      &ldquo;{c.sampleQuotes[0]}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.praises.length > 0 && (
          <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Top praises
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {analysis.praises.map((c) => (
                <div
                  key={c.label}
                  className="rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize text-foreground">
                      {c.label}
                    </p>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600">
                      {c.count}
                    </span>
                  </div>
                  {c.sampleQuotes[0] && (
                    <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground">
                      &ldquo;{c.sampleQuotes[0]}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.sampleReply && (
          <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Sample AI reply
            </p>
            <blockquote className="mt-3 rounded-lg border-l-2 border-border/60 bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground">
              <span className="mr-1.5 text-xs text-amber-500">
                {"★".repeat(analysis.sampleReply.reviewRating)}
                {"☆".repeat(5 - analysis.sampleReply.reviewRating)}
              </span>
              {analysis.sampleReply.reviewText}
            </blockquote>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              {analysis.sampleReply.reply}
            </p>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-5 text-sm text-muted-foreground">
          Want this audit on your own app every week?{" "}
          <Link href="/pricing" className="font-medium text-foreground underline">
            Try ReviewPilot
          </Link>{" "}
          and we'll monitor new reviews and auto-draft replies in your tone.
        </div>
      </div>

      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema as Record<string, unknown>} />
      ))}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ packageId }: { packageId: string }) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <h1 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
          No cached analysis for{" "}
          <span className="text-gradient-brand font-serif italic">
            {packageId}
          </span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We couldn't load a fresh analysis right now — either today's daily
          limit has been reached for your IP, or Play Store is rate-limiting our
          scraper. Try again in a few minutes, or run a fresh analysis from the
          tool page.
        </p>
        <Link
          href="/tools/play-store-analyzer"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-foreground hover:bg-card/60"
        >
          Open the Play Store Analyzer
        </Link>
      </div>
    </section>
  );
}
