"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  Star,
  MessageSquare,
  AlertTriangle,
  Mail,
  Check,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EMAIL_RE as STRICT_EMAIL_RE,
  suggestEmailCorrection,
} from "@/lib/analyzer/email-validation";
import { ReviewHealthScore } from "@/components/tools/ReviewHealthScore";
import { ShareReport } from "@/components/tools/ShareReport";
import { computeHealthScore } from "@/lib/analyzer/health-score";
import { SITE_URL } from "@/lib/seo/schema";

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

interface RatingTrendPoint {
  date: string;
  avg: number;
  count: number;
}

interface AnalysisPayload {
  metrics: {
    responseRate: number;
    unrepliedNegativeCount: number;
    sentimentBreakdown: SentimentBreakdown;
    ratingTrend90d: RatingTrendPoint[];
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
// Stricter email regex — requires plausible TLD. Mirrors the server check
// in src/lib/analyzer/email-validation.ts so client/server reject the same
// strings without a round trip.
const EMAIL_RE = STRICT_EMAIL_RE;

// Maps server-side error codes from /api/tools/analyze-app/email-report
// to user-facing copy. EMAIL_TYPO_SUSPECTED is handled separately (it
// drives a "Did you mean ...?" suggestion UI rather than a flat error).
function mapEmailReportError(
  code: string | undefined,
  fallback: string | undefined
): string {
  switch (code) {
    case "INVALID_EMAIL_FORMAT":
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
    case "DISPOSABLE_EMAIL":
      return "Please use a permanent email address. Temporary email services aren't supported.";
    case "EMAIL_DOMAIN_INVALID":
      return "We couldn't verify that email domain. Please try a different address.";
    case "EMAIL_SUBMISSION_LIMIT":
      return (
        fallback ||
        "You've reached today's limit for email reports. Start a free trial for unlimited reports."
      );
    case "MISSING_PACKAGE":
      return "Missing app id — please paste the Play Store URL again.";
    case "SEND_FAILED":
      return "We couldn't send the email. Please double-check the address and try again.";
    default:
      return fallback || "Couldn't submit. Please try again.";
  }
}

const DEFAULT_COPY = "3 free analyses today. Cached results don't count.";

// ── Cooldown ────────────────────────────────────────────────────────────────
// Pure client-side UX guard: when the analyze API returns a true failure
// (scraper crash, timeout, generic 5xx), disable the button for 30s so a
// user mashing it does not pile up identical failing requests against an
// already-strained upstream. Quota-rejection codes (ANON_QUOTA/EMAIL_QUOTA)
// have their own UI and never trigger this; INVALID_URL/APP_NOT_FOUND are
// user typos and should let them retype immediately. Persists in
// sessionStorage so a refresh mid-cooldown continues the countdown.

const COOLDOWN_MS = 30_000;
const COOLDOWN_STORAGE_KEY = "rp:analyzer:cooldown-until";
const COOLDOWN_TRIGGER_CODES: ReadonlySet<string> = new Set([
  "SCRAPER_FAILED",
  "TIMEOUT",
  "XAI_TIMEOUT",
  "UNKNOWN",
  "DB_ERROR",
]);

function readStoredCooldown(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (!raw) return null;
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= Date.now()) {
      window.sessionStorage.removeItem(COOLDOWN_STORAGE_KEY);
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

function storeCooldown(until: number) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(COOLDOWN_STORAGE_KEY, String(until));
  } catch {
    /* sessionStorage disabled — cooldown is in-memory only, acceptable. */
  }
}

function clearStoredCooldown() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(COOLDOWN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// Map server error codes to the user-facing copy. Unknown codes fall through
// to the generic UNKNOWN message so we never show "undefined" or a raw stack.
function friendlyError(code: string, fallback: string): string {
  switch (code) {
    case "INVALID_URL":
      return "That doesn't look like a Play Store URL. It should look like https://play.google.com/store/apps/details?id=YOUR_APP_ID";
    case "APP_NOT_FOUND":
      return "We couldn't find that app on Play Store. Double-check the package ID in the URL — it should look like com.example.app and match the id parameter in the original Play Store link.";
    case "SCRAPER_FAILED":
      return "Play Store is being a bit slow right now. Give it a minute and try again.";
    case "TIMEOUT":
    case "XAI_TIMEOUT":
      return "Our AI took a bit longer than expected. Refresh the page and try once more — your analysis won't count against today's limit if it failed.";
    case "ANON_QUOTA":
      return "You've used all 3 free analyses today. Drop your email below for 5 more and a PDF of this report.";
    case "EMAIL_QUOTA":
      return "You've used all 8 free analyses today. Start a free trial to keep going.";
    case "UNIQUE_CAP":
      return "You've hit today's hard cap of 20 different apps. Please come back tomorrow.";
    case "DB_ERROR":
      return "Service is temporarily unavailable. Please try again shortly.";
    case "BAD_JSON":
    case "UNKNOWN":
    default:
      return fallback || "Something unexpected happened. Refresh and try again.";
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

  if (cached && left > 0) {
    return `Cached result — didn't count toward today's limit. ${left} fresh ${
      left === 1 ? "analysis" : "analyses"
    } left.`;
  }

  if (emailUnlocked) {
    if (left === 0) {
      return "Free analyses done for today. Start a trial for unlimited.";
    }
    return `${left} fresh ${
      left === 1 ? "analysis" : "analyses"
    } left today.`;
  }

  if (left === 3) return DEFAULT_COPY;
  if (left === 2) return "2 fresh analyses left today. Cached results stay free.";
  if (left === 1) return "1 fresh analysis left today. Cached results stay free.";
  return "Out of free analyses for today. Get the PDF — and 5 more — below.";
}

export function PlayStoreAnalyzer() {
  const [url, setUrl] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // "No, this isn't my app" → clear the result and refocus the input so the
  // visitor can paste their own app. Used by the qualification control in
  // ResultView.
  function focusInputForOwnApp() {
    setResult(null);
    setError(null);
    setUrl("");
    requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      inputRef.current?.focus();
    });
  }

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

  // Restore any in-flight cooldown from sessionStorage so a refresh
  // mid-cooldown continues the countdown rather than letting the user mash
  // the button again immediately.
  useEffect(() => {
    const stored = readStoredCooldown();
    if (stored) setCooldownEndsAt(stored);
  }, []);

  // Ticker — drives the visible countdown and clears the cooldown when it
  // expires. Interval only runs while a cooldown is active.
  useEffect(() => {
    if (!cooldownEndsAt) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const ms = cooldownEndsAt - Date.now();
      if (ms <= 0) {
        setCooldownEndsAt(null);
        clearStoredCooldown();
        setSecondsLeft(0);
      } else {
        setSecondsLeft(Math.ceil(ms / 1000));
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cooldownEndsAt]);

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

      const usageFromBody =
        body && "usage" in body && body.usage ? (body.usage as UsageInfo) : null;
      if (usageFromBody) setUsage(usageFromBody);

      if (!res.ok || !body) {
        const err: ApiError =
          body && "error" in body
            ? body
            : { error: "", code: "UNKNOWN" };
        setError(err);
        // Trigger cooldown on true failures (5xx, scraper crashes, timeouts,
        // anything generic). User-typo paths and quota rejections do NOT
        // trigger — they have their own UI affordances.
        if (COOLDOWN_TRIGGER_CODES.has(err.code) || res.status >= 500) {
          const until = Date.now() + COOLDOWN_MS;
          storeCooldown(until);
          setCooldownEndsAt(until);
        }
        return;
      }
      setResult(body as AnalysisResult);
    } catch {
      setError({ error: "", code: "UNKNOWN" });
      // Network error / fetch crash — same backoff signal as a 5xx.
      const until = Date.now() + COOLDOWN_MS;
      storeCooldown(until);
      setCooldownEndsAt(until);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldownEndsAt && Date.now() < cooldownEndsAt) return;
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

  const cooldownActive = cooldownEndsAt !== null && secondsLeft > 0;
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
            ref={inputRef}
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
          <Button
            type="submit"
            disabled={loading || cooldownActive}
            className="sm:w-40"
          >
            {cooldownActive ? (
              `Try again in ${secondsLeft}s`
            ) : loading ? (
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
        {cooldownActive && (
          <p className="text-xs text-muted-foreground" role="status">
            We are hitting our limits &mdash; give us a moment to catch our
            breath.
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
          <p className="text-sm font-medium text-foreground">
            You&rsquo;ve got the bug, we like that
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You&rsquo;ve used all 8 free analyses today. Start a 7-day trial
            for unlimited analyses on your own apps.
          </p>
          <Link
            href="/signup"
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-border/60 bg-card/60 px-4 py-2 text-sm font-medium text-foreground hover:bg-card/80"
          >
            Start 7-day free trial
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

      {result && (
        <ResultView
          key={result.packageId}
          result={result}
          onAnalyzeYours={focusInputForOwnApp}
        />
      )}
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
  const [typoSuggestion, setTypoSuggestion] = useState<string | null>(null);

  function handleBlur() {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!EMAIL_RE.test(trimmed)) {
      setErr("Please enter a valid email address.");
      return;
    }
    const sug = suggestEmailCorrection(trimmed.toLowerCase());
    if (sug && sug !== trimmed.toLowerCase()) {
      setTypoSuggestion(sug);
    }
  }

  function applyTypoSuggestion() {
    if (!typoSuggestion) return;
    setEmail(typoSuggestion);
    setTypoSuggestion(null);
    setErr(null);
  }

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
        body: JSON.stringify({
          email: email.trim(),
          packageId,
          context: "quota_gate",
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | { error?: string; code?: string; suggestion?: string }
        | null;
      if (!res.ok) {
        if (body?.code === "EMAIL_TYPO_SUSPECTED" && body.suggestion) {
          setTypoSuggestion(body.suggestion);
          setErr(null);
          return;
        }
        setErr(mapEmailReportError(body?.code, body?.error));
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
            You&rsquo;re on a roll &mdash; keep going
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop your email and we&rsquo;ll send you a polished PDF of this
            report. As a thank-you, you&rsquo;ll get 5 more analyses on the
            house today.
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
            if (typoSuggestion) setTypoSuggestion(null);
          }}
          onBlur={handleBlur}
          className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          disabled={submitting}
          aria-invalid={err ? "true" : "false"}
        />
        <Button type="submit" disabled={submitting} className="sm:w-40">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            "Send me the report"
          )}
        </Button>
      </div>
      {typoSuggestion && (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          Did you mean{" "}
          <button
            type="button"
            onClick={applyTypoSuggestion}
            className="font-medium text-accent underline underline-offset-2"
          >
            {typoSuggestion}
          </button>
          ?
        </p>
      )}
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

function ResultView({
  result,
  onAnalyzeYours,
}: {
  result: AnalysisResult;
  onAnalyzeYours: () => void;
}) {
  const { app, analysis } = result;
  const total = analysis.reviewCount;
  const [unlocked, setUnlocked] = useState(false);

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

  const health = computeHealthScore({
    responseRate: analysis.metrics.responseRate,
    unrepliedNegativeCount: analysis.metrics.unrepliedNegativeCount,
    sentimentBreakdown: analysis.metrics.sentimentBreakdown,
    ratingTrend90d: analysis.metrics.ratingTrend90d,
    reviewCount: total,
  });

  // Top 3 issues stay public (shareable). Everything else is value-gated.
  const topComplaints = analysis.complaints.slice(0, 3);
  const lockedComplaints = analysis.complaints.slice(3);
  const hasGatedContent =
    lockedComplaints.length > 0 ||
    analysis.praises.length > 0 ||
    !!analysis.sampleReply;

  return (
    <div className="mt-6 space-y-5">
      <AppHeader app={app} cached={result.cached} />

      <ReviewHealthScore
        input={{
          responseRate: analysis.metrics.responseRate,
          unrepliedNegativeCount: analysis.metrics.unrepliedNegativeCount,
          sentimentBreakdown: analysis.metrics.sentimentBreakdown,
          ratingTrend90d: analysis.metrics.ratingTrend90d,
          reviewCount: total,
        }}
      />

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

      {/* Qualification — "Is this your app?" → segmented CTA. */}
      <QualificationCard
        score={health.score}
        unrepliedNegativeCount={analysis.metrics.unrepliedNegativeCount}
        onAnalyzeYours={onAnalyzeYours}
      />

      {/* Public: top 3 issues. */}
      <ClusterGrid title="Top issues" clusters={topComplaints} tone="negative" />

      {/* Value gate: full breakdown + sample reply + PDF behind email. */}
      {hasGatedContent && !unlocked && (
        <ValueGate
          packageId={result.packageId}
          lockedComplaintCount={lockedComplaints.length}
          praiseCount={analysis.praises.length}
          hasSampleReply={!!analysis.sampleReply}
          onUnlocked={() => setUnlocked(true)}
        />
      )}

      {hasGatedContent && unlocked && (
        <>
          {lockedComplaints.length > 0 && (
            <ClusterGrid
              title="More issues"
              clusters={lockedComplaints}
              tone="negative"
            />
          )}
          {analysis.praises.length > 0 && (
            <ClusterGrid
              title="Top praises"
              clusters={analysis.praises}
              tone="positive"
            />
          )}
          {analysis.sampleReply && (
            <SampleReply reply={analysis.sampleReply} />
          )}
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-emerald-500" />
              Full report unlocked — we&rsquo;ve emailed you the PDF too.
            </div>
          </div>
        </>
      )}

      <ShareReport
        url={`${SITE_URL}${result.insightUrl}`}
        title={`${app.appName} — Review Health Report`}
      />
    </div>
  );
}

// ── Sample AI reply (gated) ──────────────────────────────────────────────────

function SampleReply({
  reply,
}: {
  reply: NonNullable<AnalysisPayload["sampleReply"]>;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Sample AI reply to the worst unanswered review
        </p>
      </div>
      <blockquote className="mt-3 rounded-lg border-l-2 border-border/60 bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground">
        <span className="mr-1.5 text-xs text-amber-500">
          {"★".repeat(reply.reviewRating)}
          {"☆".repeat(5 - reply.reviewRating)}
        </span>
        {reply.reviewText}
      </blockquote>
      <p className="mt-3 text-sm leading-relaxed text-foreground">
        {reply.reply}
      </p>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
        <Sparkles className="h-3.5 w-3.5" />
        ReviewPilot posts replies like this automatically.
      </p>
    </div>
  );
}

// ── Qualification + segmented CTA ─────────────────────────────────────────────

// "Weak" = anything below a B. Above that, the app is well-managed and the
// pitch shifts from "fix this" to "keep it this way".
const WEAK_SCORE_BELOW = 70;

function QualificationCard({
  score,
  unrepliedNegativeCount,
  onAnalyzeYours,
}: {
  score: number;
  unrepliedNegativeCount: number;
  onAnalyzeYours: () => void;
}) {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);

  if (answer === null) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            Is this your app?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnswer("yes")}
              className="rounded-lg border border-border/60 bg-background/60 px-4 py-1.5 text-sm font-medium text-foreground hover:bg-background/80"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setAnswer("no")}
              className="rounded-lg border border-border/60 bg-background/60 px-4 py-1.5 text-sm font-medium text-foreground hover:bg-background/80"
            >
              No
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (answer === "no") {
    return (
      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <p className="text-sm text-muted-foreground">
          No problem — run the same audit on your own app.
        </p>
        <button
          type="button"
          onClick={onAnalyzeYours}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-foreground hover:bg-background/80"
        >
          <Search className="h-4 w-4" />
          Now analyze YOUR app
        </button>
      </div>
    );
  }

  // answer === "yes"
  const weak = score < WEAK_SCORE_BELOW;
  const headline = weak
    ? "These reviews are costing you ratings."
    : "Your reviews are in great shape.";
  const body =
    weak && unrepliedNegativeCount > 0
      ? `Let ReviewPilot reply to these ${unrepliedNegativeCount} unanswered negative ${
          unrepliedNegativeCount === 1 ? "review" : "reviews"
        } for you — in your tone, automatically.`
      : weak
        ? "Let ReviewPilot keep your reviews answered and your score climbing — automatically."
        : "Keep them that way on autopilot — ReviewPilot answers every new review in your tone.";

  return (
    <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
      <p className="text-sm font-medium text-foreground">{headline}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Link
        href="/signup"
        className="mt-3 inline-flex items-center justify-center rounded-lg border border-accent/50 bg-accent/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/20"
      >
        {weak
          ? "Let ReviewPilot reply to these — 7-day free trial"
          : "Start your 7-day free trial"}
      </Link>
    </div>
  );
}

// ── Value gate (email unlocks full breakdown + sample reply + PDF) ────────────

function ValueGate({
  packageId,
  lockedComplaintCount,
  praiseCount,
  hasSampleReply,
  onUnlocked,
}: {
  packageId: string;
  lockedComplaintCount: number;
  praiseCount: number;
  hasSampleReply: boolean;
  onUnlocked: () => void;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [typoSuggestion, setTypoSuggestion] = useState<string | null>(null);

  function handleBlur() {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!EMAIL_RE.test(trimmed)) {
      setErr("Please enter a valid email address.");
      return;
    }
    const sug = suggestEmailCorrection(trimmed.toLowerCase());
    if (sug && sug !== trimmed.toLowerCase()) {
      setTypoSuggestion(sug);
    }
  }

  function applyTypoSuggestion() {
    if (!typoSuggestion) return;
    setEmail(typoSuggestion);
    setTypoSuggestion(null);
    setErr(null);
  }

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
        body: JSON.stringify({
          email: email.trim(),
          packageId,
          context: "value_gate",
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | { error?: string; code?: string; suggestion?: string }
        | null;
      if (!res.ok) {
        if (body?.code === "EMAIL_TYPO_SUSPECTED" && body.suggestion) {
          setTypoSuggestion(body.suggestion);
          setErr(null);
          return;
        }
        setErr(mapEmailReportError(body?.code, body?.error));
        return;
      }
      onUnlocked();
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Build the teaser line from what's actually still locked.
  const teasers: string[] = [];
  if (lockedComplaintCount > 0) {
    teasers.push(
      `${lockedComplaintCount} more issue ${
        lockedComplaintCount === 1 ? "theme" : "themes"
      }`
    );
  }
  if (praiseCount > 0) {
    teasers.push(
      `${praiseCount} praise ${praiseCount === 1 ? "theme" : "themes"}`
    );
  }
  if (hasSampleReply) {
    teasers.push("the exact AI reply ReviewPilot would post");
  }
  teasers.push("a PDF of the full report");
  const teaserLine = formatList(teasers);

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-accent/40 bg-accent/5 p-4"
    >
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Unlock the full breakdown
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop your email to reveal {teaserLine}. Free — no card.
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
            if (typoSuggestion) setTypoSuggestion(null);
          }}
          onBlur={handleBlur}
          className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          disabled={submitting}
          aria-invalid={err ? "true" : "false"}
        />
        <Button type="submit" disabled={submitting} className="sm:w-44">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Unlocking
            </>
          ) : (
            "Unlock full report"
          )}
        </Button>
      </div>
      {typoSuggestion && (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          Did you mean{" "}
          <button
            type="button"
            onClick={applyTypoSuggestion}
            className="font-medium text-accent underline underline-offset-2"
          >
            {typoSuggestion}
          </button>
          ?
        </p>
      )}
      {err && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {err}
        </p>
      )}
    </form>
  );
}

// Join a list with commas and a trailing "and": ["a","b","c"] → "a, b, and c".
function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
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
