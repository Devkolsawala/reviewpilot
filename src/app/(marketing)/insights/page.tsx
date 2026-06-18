// Public hub for the /insights review reports.
//
// Lists ONLY pages that pass the quality gate AND are still live (expires_at >
// now()). Uses the literal passesInsightsQualityGate function — the same gate
// that drives each page's robots meta — so the hub can never advertise a thin,
// flagged, or noindex report. Expired-but-rich pages stay indexable on their own
// (Step 0) but drop from this hub until re-run: an honest freshness signal.
//
// ISR (revalidate 3600): rebuilt at most hourly, near-zero per-request DB cost.
// The gate-sync lag is acceptable because each page's robots meta is the
// authoritative indexing signal; this hub is a discovery surface.

import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { JsonLd } from "@/components/marketing/JsonLd";
import { breadcrumbSchema, SITE_URL } from "@/lib/seo/schema";
import { passesInsightsQualityGate } from "@/lib/seo/insights-quality-gate";
import type { AnalysisResult } from "@/lib/analyzer/pipeline";

export const revalidate = 3600;

const PAGE_URL = `${SITE_URL}/insights`;
const MAX_APPS = 200;

export const metadata: Metadata = {
  title: "Play Store App Review Reports — Sentiment, Ratings & Response Rate",
  description:
    "Free review-health reports for Play Store apps: rating, sentiment breakdown, top complaints and praises, and developer response rate. Updated as apps are analyzed.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Play Store App Review Reports",
    description:
      "Browse free review-health reports for Play Store apps — sentiment, top complaints, and response rate.",
    url: PAGE_URL,
    type: "website",
  },
};

interface HubRow {
  package_id: string;
  app_name: string | null;
  app_icon_url: string | null;
  rating: number | null;
  rating_count: number | null;
  analysis: AnalysisResult["analysis"] | null;
}

interface HubApp {
  packageId: string;
  appName: string;
  iconUrl: string;
  score: number;
  ratingCount: number;
  themeCount: number;
}

async function loadIndexableApps(): Promise<HubApp[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("public_app_analyses")
    .select("package_id, app_name, app_icon_url, rating, rating_count, analysis")
    .gt("expires_at", new Date().toISOString())
    .not("analysis", "is", null)
    .order("rating_count", { ascending: false, nullsFirst: false })
    .limit(MAX_APPS);

  if (error || !data) return [];

  return (data as HubRow[])
    .filter((row) => {
      if (!row.analysis) return false;
      // Build the minimal shape the gate reads and run the LITERAL gate fn, so
      // the hub's inclusion rule is identical to the per-page robots decision.
      const result = {
        app: { score: row.rating ?? 0, ratingCount: row.rating_count ?? 0 },
        analysis: row.analysis,
      } as unknown as AnalysisResult;
      return passesInsightsQualityGate(result);
    })
    .map((row) => ({
      packageId: row.package_id,
      appName: row.app_name ?? row.package_id,
      iconUrl: row.app_icon_url ?? "",
      score: row.rating ?? 0,
      ratingCount: row.rating_count ?? 0,
      themeCount:
        (row.analysis?.complaints.length ?? 0) +
        (row.analysis?.praises.length ?? 0),
    }));
}

export default async function InsightsHubPage() {
  const apps = await loadIndexableApps();

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Insights", url: PAGE_URL },
  ]);

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <JsonLd data={breadcrumb} />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            Play Store app review reports
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Free review-health reports built from each app&apos;s recent public
            Play Store reviews — rating, sentiment, top complaints and praises,
            and how often the developer replies. Want one for your own app?{" "}
            <Link
              href="/tools/play-store-analyzer"
              className="font-medium text-foreground underline"
            >
              Run the free analyzer
            </Link>
            .
          </p>
        </header>

        {apps.length === 0 ? (
          <p className="mt-12 text-sm text-muted-foreground">
            No reports are available right now.{" "}
            <Link
              href="/tools/play-store-analyzer"
              className="font-medium text-foreground underline"
            >
              Analyze an app
            </Link>{" "}
            to create the first one.
          </p>
        ) : (
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {apps.map((app) => (
              <li key={app.packageId}>
                <Link
                  href={`/insights/${app.packageId}`}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/40 p-4 transition-colors hover:border-accent/50 hover:bg-card/60"
                >
                  {app.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={app.iconUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-xl border border-border/60"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-xl border border-border/60 bg-muted/40" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-semibold tracking-tight text-foreground">
                      {app.appName}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-foreground">
                        {app.score.toFixed(2)}
                      </span>
                      <span>
                        ({Intl.NumberFormat("en-IN").format(app.ratingCount)})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{app.themeCount} themes</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
