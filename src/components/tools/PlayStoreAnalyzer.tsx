"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  Star,
  MessageSquare,
  AlertTriangle,
  Mail,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopicCluster {
  label: string;
  count: number;
  sampleQuotes: string[];
}

interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

interface AnalysisPayload {
  metrics: {
    responseRate: number;
    unrepliedNegativeCount: number;
    sentimentBreakdown: SentimentBreakdown;
    recoverableCount: number;
  };
  complaints: TopicCluster[];
  praises: TopicCluster[];
  sampleReply: {
    reviewText: string;
    reviewRating: number;
    reply: string;
  } | null;
  reviewCount: number;
}

interface UsageInfo {
  freshUsedToday: number;
  freshLimitToday: number;
  emailUnlocked: boolean;
  uniquePackageCount: number;
  cached: boolean;
}

interface AnalysisResult {
  packageId: string;
  app: {
    appName: string;
    iconUrl: string;
    developer: string;
    score: number;
    ratingCount: number;
  };
  analysis: AnalysisPayload;
  cached: boolean;
  insightUrl: string;
  usage?: UsageInfo;
}

interface ApiError {
  error: string;
  code: string;
  needsEmail?: boolean;
  usage?: UsageInfo;
}

const PLAY_URL_RE = /^https?:\/\/play\.google\.com\/store\/apps\/details\?id=[a-zA-Z0-9_.]+/;
const BARE_PKG_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_COPY = "Free for 3 fresh analyses per day. Cached results are unlimited.";

// Map server error codes to the user-facing copy. Unknown codes fall through
// to the generic UNKNOWN message so we never show "undefined" or a raw stack.
function friendlyError(code: string, fallback: string): string {
  switch (code) {
    case "INVALID_URL":
      return "That does not look like a Play Store URL. It should look like https://play.google.com/store/apps/details?id=YOUR_APP_ID";
    case "APP_NOT_FOUND":
      return "We could not find that app on Play Store. Double-check the package ID in the URL — for example, the correct ID for Swiggy is in.swiggy.android, not com.swiggy.consumer.";
    case "SCRAPER_FAILED":
      return "Play Store is temporarily unreachable. Please try again in a minute.";
    case "TIMEOUT":
      return "That took longer than expected. Please try again in a minute.";
    case "ANON_QUOTA":
      return "You have used all 3 free analyses today. Enter your email below to unlock 5 more and get a PDF report.";
    case "EMAIL_QUOTA":
      return "You have used all 8 free analyses today. Start a 7-day free trial to analyze unlimited apps.";
    case "UNIQUE_CAP":
      return "You have hit today's hard cap of 20 different apps. Please come back tomorrow.";
    case "DB_ERROR":
      return "Service is temporarily unavailable. Please try again shortly.";
    case "BAD_JSON":
    case "UNKNOWN":
    default:
      return fallback || "Something unexpected happened. Please try again in a moment.";
  }
}

function validateInput(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "Please paste a Play Store URL.";
  if (!PLAY_URL_RE.test(trimmed) && !BARE_PKG_RE.test(trimmed)) {
    return friendlyError("INVALID_URL", "");
  }
  return null;
}

function extractPackageId(url: string): string | null {
  const trimmed = url.trim();
  if (BARE_PKG_RE.test(trimmed)) return trimmed;
  const m = trimmed.match(/[?&]id=([a-zA-Z0-9_.]+)/);
  return m && m[1] ? m[1] : null;
}

// Single source of truth for the usage-aware copy under the input field.
function getUsageCopy(usage: UsageInfo | null): string {
  if (!usage) return DEFAULT_COPY;
  const { freshUsedToday, freshLimitToday, emailUnlocked, cached } = usage;
  const left = Math.max(0, freshLimitToday - freshUsedToday);

  if (cached) {
    return `Cached result — did not count toward your daily limit. ${left} fresh ${
      left === 1 ? "analysis" : "analyses"
    } left today.`;
  }

  if (freshUsedToday === 0) return DEFAULT_COPY;

  if (left > 0) {
    return `${left} fresh ${
      left === 1 ? "analysis" : "analyses"
    } left today. Cached results are unlimited.`;
  }

  if (emailUnlocked) {
    return "You have used all 8 analyses today. Start a free trial to analyze unlimited apps.";
  }
  return "You have used all 3 free analyses today. Cached results are still unlimited — or unlock 5 more with your email.";
}

export function PlayStoreAnalyzer() {
  const [url, setUrl] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  // Fetch baseline usage on mount so the copy under the input is accurate
  // even before the user runs anything. No quota consumed.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tools/analyze-app/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body?.usage) return;
        setUsage(body.usage as UsageInfo);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function runAnalyze(targetUrl: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/analyze-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const body = (await res.json().catch(() => null)) as
        | AnalysisResult
        | ApiError
        | null;

      // Update usage from whatever the server returned, success or failure,
      // as long as it included a usage block.
      const usageFromBody =
        body && "usage" in body && body.usage ? (body.usage as UsageInfo) : null;
      if (usageFromBody) setUsage(usageFromBody);

      if (!res.ok || !body) {
        const err: ApiError =
          body && "error" in body
            ? body
            : { error: "", code: "UNKNOWN" };
        setError(err);
        return;
      }
      setResult(body as AnalysisResult);
    } catch {
      setError({ error: "", code: "UNKNOWN" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const v = validateInput(url);
    setValidation(v);
    if (v) return;
    await runAnalyze(url);
  }

  async function handleUnlockRetry() {
    if (!url) return;
    await runAnalyze(url);
  }

  const showEmailGate =
    !loading && error?.code === "ANON_QUOTA" && error?.needsEmail === true;
  const showTrialCta = !loading && error?.code === "EMAIL_QUOTA";
  const usageCopy = getUsageCopy(usage);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="play-store-url"
          className="block text-sm font-medium text-foreground"
        >
          Play Store URL
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="play-store-url"
            type="text"
            inputMode="url"
            spellCheck={false}
            placeholder="https://play.google.com/store/apps/details?id=com.example.app"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (validation) setValidation(null);
            }}
            className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            aria-invalid={validation ? "true" : "false"}
            aria-describedby={validation ? "play-store-url-error" : undefined}
            disabled={loading}
          />
          <Button type="submit" disabled={loading} className="sm:w-40">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </div>
        {validation && (
          <p
            id="play-store-url-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {validation}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{usageCopy}</p>
      </form>

      {loading && <LoadingSkeleton />}

      {showEmailGate && (
        <EmailGate
          packageId={extractPackageId(url) ?? ""}
          onUnlocked={handleUnlockRetry}
        />
      )}

      {showTrialCta && (
        <div
          className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4"
          role="alert"
        >
          <p className="text-sm text-foreground">
            {friendlyError("EMAIL_QUOTA", "")}
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-border/60 bg-card/60 px-4 py-2 text-sm font-medium text-foreground hover:bg-card/80"
          >
            See pricing
          </Link>
        </div>
      )}

      {error && !showEmailGate && !showTrialCta && (
        <div
          className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm text-foreground">
                {friendlyError(error.code, error.error)}
              </p>
            </div>
          </div>
        </div>
      )}

      {result && <ResultView result={result} />}
    </div>
  );
}

// ── Email gate ───────────────────────────────────────────────────────────────

function EmailGate({
  packageId,
  onUnlocked,
}: {
  packageId: string;
  onUnlocked: () => void | Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!EMAIL_RE.test(email.trim())) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (!packageId) {
      setErr("Missing app id — please paste the Play Store URL again.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tools/analyze-app/email-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), packageId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(
          (body as { error?: string } | null)?.error ||
            "Could not unlock. Please try again."
        );
        return;
      }
      await onUnlocked();
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-xl border border-accent/40 bg-accent/5 p-4"
    >
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Daily free limit reached
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email to unlock 5 more analyses today and we will email
            you the PDF report of this analysis when it completes.
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (err) setErr(null);
          }}
          className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          disabled={submitting}
          aria-invalid={err ? "true" : "false"}
        />
        <Button type="submit" disabled={submitting} className="sm:w-40">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Unlocking
            </>
          ) : (
            "Unlock 5 more"
          )}
        </Button>
      </div>
      {err && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {err}
        </p>
      )}
    </form>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-6 animate-pulse space-y-3">
      <div className="h-5 w-1/3 rounded bg-muted/60" />
      <div className="h-24 rounded-xl bg-muted/40" />
      <div className="h-32 rounded-xl bg-muted/40" />
    </div>
  );
}

// ── Result view ──────────────────────────────────────────────────────────────

function ResultView({ result }: { result: AnalysisResult }) {
  const { app, analysis } = result;
  const total = analysis.reviewCount;

  if (total === 0) {
    return (
      <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-5">
        <AppHeader app={app} />
        <p className="mt-4 text-sm text-muted-foreground">
          We could not find any recent reviews for this app on the public Play
          Store page. There is nothing to analyze yet &mdash; try again once it
          has user feedback.
        </p>
      </div>
    );
  }

  const responsePct = Math.round(analysis.metrics.responseRate * 100);
  const sent = analysis.metrics.sentimentBreakdown;
  const positivePct = total ? Math.round((sent.positive / total) * 100) : 0;
  const neutralPct = total ? Math.round((sent.neutral / total) * 100) : 0;
  const negativePct = Math.max(0, 100 - positivePct - neutralPct);

  return (
    <div className="mt-6 space-y-5">
      <AppHeader app={app} cached={result.cached} />

      <div className="grid gap-3 sm:grid-cols-3">
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

      <div className="rounded-xl border border-border/60 bg-background/40 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Sentiment (last {total} reviews)
        </p>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted/40">
          <div
            className="bg-emerald-500"
            style={{ width: `${positivePct}%` }}
            title={`Positive ${positivePct}%`}
          />
          <div
            className="bg-amber-400"
            style={{ width: `${neutralPct}%` }}
            title={`Neutral ${neutralPct}%`}
          />
          <div
            className="bg-rose-500"
            style={{ width: `${negativePct}%` }}
            title={`Negative ${negativePct}%`}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Positive {positivePct}%</span>
          <span>Neutral {neutralPct}%</span>
          <span>Negative {negativePct}%</span>
        </div>
      </div>

      <ClusterGrid title="Top complaints" clusters={analysis.complaints} tone="negative" />
      <ClusterGrid title="Top praises" clusters={analysis.praises} tone="positive" />

      {analysis.sampleReply && (
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Sample AI reply
            </p>
          </div>
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

      <EmailPdfButton packageId={result.packageId} />

      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <p className="text-sm text-foreground">
          Share this analysis at a permanent URL:
        </p>
        <Link
          href={result.insightUrl}
          className="mt-1 inline-block text-sm font-medium text-accent underline underline-offset-2"
        >
          reviewpilot.co.in{result.insightUrl}
        </Link>
      </div>
    </div>
  );
}

function EmailPdfButton({ packageId }: { packageId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Check className="h-4 w-4 text-emerald-500" />
          PDF report on its way to your inbox.
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 py-2 text-sm font-medium text-foreground hover:bg-card/80"
      >
        <Mail className="h-4 w-4" />
        Email me the PDF report
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!EMAIL_RE.test(email.trim())) {
      setErr("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tools/analyze-app/email-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), packageId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(
          (body as { error?: string } | null)?.error ||
            "Could not send. Please try again."
        );
        return;
      }
      setSent(true);
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border/60 bg-card/40 p-4"
    >
      <p className="text-sm font-medium text-foreground">
        Email me the PDF report
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (err) setErr(null);
          }}
          className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          disabled={submitting}
        />
        <Button type="submit" disabled={submitting} className="sm:w-40">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            "Send PDF"
          )}
        </Button>
      </div>
      {err && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {err}
        </p>
      )}
    </form>
  );
}

function AppHeader({
  app,
  cached,
}: {
  app: AnalysisResult["app"];
  cached?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      {app.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={app.iconUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg border border-border/60"
        />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-lg border border-border/60 bg-muted/40" />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-foreground">
          {app.appName}
        </h3>
        {app.developer && (
          <p className="truncate text-xs text-muted-foreground">
            {app.developer}
          </p>
        )}
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {app.score ? app.score.toFixed(2) : "—"}
          {app.ratingCount > 0 && (
            <span className="ml-1">
              ({Intl.NumberFormat("en-IN").format(app.ratingCount)})
            </span>
          )}
        </p>
      </div>
      {cached && (
        <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          Cached
        </span>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function ClusterGrid({
  title,
  clusters,
  tone,
}: {
  title: string;
  clusters: TopicCluster[];
  tone: "negative" | "positive";
}) {
  if (clusters.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-background/40 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          No clear clusters surfaced from the sampled reviews.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {clusters.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border/60 bg-card/30 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium capitalize text-foreground">
                {c.label}
              </p>
              <span
                className={
                  tone === "negative"
                    ? "rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-600"
                    : "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600"
                }
              >
                {c.count}
              </span>
            </div>
            {c.sampleQuotes.length > 0 && (
              <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground">
                &ldquo;{c.sampleQuotes[0]}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
