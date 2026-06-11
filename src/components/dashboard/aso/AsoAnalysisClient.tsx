"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Rocket,
  Loader2,
  Copy,
  Check,
  RefreshCcw,
  Smartphone,
  TriangleAlert,
  Lightbulb,
  Star,
  ArrowRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getPlan, USAGE_PERIOD } from "@/lib/plans";
import { formatDateTime, formatDateTimeShort } from "@/lib/format";
import type {
  AsoAnalysis,
  AsoFactorScore,
  AsoKeywordGap,
  AsoLongDescriptionSection,
  AsoScoreBreakdown,
} from "@/types/database";

// Play Store metadata character limits — drive the live "x / max" counters.
const LIMITS = { title: 30, short: 80, long: 4000, whats_new: 480 } as const;

// ── Refresh resilience ────────────────────────────────────────────────────────
// An analysis can take ~10–40s (scrape + Grok). The route runs to completion
// server-side even if the client disconnects, so the analysis row is inserted
// regardless of a refresh. We persist a small in-flight marker in localStorage
// so that after a reload we (a) re-select the app being analyzed, (b) restore
// the "analyzing" state, and (c) poll for the newly-inserted row — the same
// "don't lose state on refresh" guarantee the AI reply flow gives.
const PENDING_KEY = "reviewpilot_aso_pending_v1";
const PENDING_TTL_MS = 120_000; // matches the route's maxDuration + headroom

interface PendingRun {
  packageName: string;
  startedAt: number;
  /** id of the latest analysis at run start — the new row will differ from it. */
  prevLatestId: string | null;
}

function readPending(): PendingRun | null {
  try {
    const s = typeof window !== "undefined" ? window.localStorage.getItem(PENDING_KEY) : null;
    if (!s) return null;
    const p = JSON.parse(s);
    if (p && typeof p.packageName === "string" && typeof p.startedAt === "number") {
      return { packageName: p.packageName, startedAt: p.startedAt, prevLatestId: p.prevLatestId ?? null };
    }
  } catch {
    /* ignore malformed marker */
  }
  return null;
}
function writePending(p: PendingRun) {
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — degrade silently */
  }
}
function clearPending() {
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

interface PlayConnection {
  id: string;
  name: string;
  external_id: string;
}

interface QuotaState {
  used: number;
  limit: number; // -1 = unlimited
  remaining: number; // -1 = unlimited
  planName: string;
}

type AnalysisRow = Pick<
  AsoAnalysis,
  "id" | "package_name" | "listing_snapshot" | "aso_score" | "score_breakdown" | "recommendations" | "created_at"
>;

type RunError = {
  kind: "upgrade" | "quota" | "ai" | "not_found" | "scrape" | "generic";
  message: string;
};

const FACTOR_LABELS: Record<keyof AsoScoreBreakdown, string> = {
  title: "Title",
  short_desc: "Short description",
  long_desc: "Long description",
  rating: "Rating",
  assets: "Screenshots",
};

const FACTOR_ORDER: (keyof AsoScoreBreakdown)[] = [
  "title",
  "short_desc",
  "long_desc",
  "rating",
  "assets",
];

export function AsoAnalysisClient() {
  const [connsLoading, setConnsLoading] = useState(true);
  const [connections, setConnections] = useState<PlayConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [competitors, setCompetitors] = useState<[string, string]>(["", ""]);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AnalysisRow | null>(null);
  const [history, setHistory] = useState<AnalysisRow[]>([]);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [error, setError] = useState<RunError | null>(null);

  const selectedConn = connections.find((c) => c.id === selectedId) ?? null;

  // ── Load connected Play Store apps + current ASO quota ──────────────────────
  const loadQuota = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const planRes = await fetch("/api/plan");
      const planData = planRes.ok ? await planRes.json() : {};
      const plan = getPlan(planData.plan ?? "free");
      // Coerce off the literal union (0 | 30 | 100) so a future -1 (unlimited)
      // limit is handled correctly rather than being statically narrowed away.
      const limit: number = plan.limits.aso_analyses_per_period;
      const periodStart = planData.usage_period_start || new Date().toISOString();
      const ownerId = planData.workspace_owner_id || user?.id;
      if (!ownerId) return;
      const periodKey = USAGE_PERIOD.getUserPeriodKey(periodStart);
      const { data: usageRow } = await supabase
        .from("usage")
        .select("aso_analyses_used")
        .eq("user_id", ownerId)
        .eq("period_key", periodKey)
        .maybeSingle();
      const used = (usageRow?.aso_analyses_used as number) ?? 0;
      setQuota({
        used,
        limit,
        remaining: limit === -1 ? -1 : Math.max(0, limit - used),
        planName: plan.name,
      });
    } catch {
      /* non-fatal — quota chip just won't render */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadConnections() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("connections")
          .select("id, name, external_id, type, is_active")
          .eq("type", "play_store")
          .eq("is_active", true);
        if (cancelled) return;
        const conns = (data ?? [])
          .filter((c) => !!c.external_id)
          .map((c) => ({ id: c.id as string, name: c.name as string, external_id: c.external_id as string }));
        setConnections(conns);
        // If a run was in flight when the page reloaded, re-select that app so
        // the resume poll below picks it up. Otherwise auto-select a lone app.
        const pending = readPending();
        const pendingConn = pending ? conns.find((c) => c.external_id === pending.packageName) : null;
        if (pendingConn) setSelectedId(pendingConn.id);
        else if (conns.length === 1) setSelectedId(conns[0].id);
      } finally {
        if (!cancelled) setConnsLoading(false);
      }
    }
    loadConnections();
    loadQuota();
    return () => {
      cancelled = true;
    };
  }, [loadQuota]);

  // When the selected app changes, load its recent stored analyses (most recent
  // first) so the user lands on the latest result with a history dropdown +
  // "Re-run" affordance.
  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(null);
    setHistory([]);
    if (!selectedConn) return;
    async function loadHistory(pkg: string) {
      const supabase = createClient();
      const { data } = await supabase
        .from("aso_analyses")
        .select("id, package_name, listing_snapshot, aso_score, score_breakdown, recommendations, created_at")
        .eq("package_name", pkg)
        .order("created_at", { ascending: false })
        .limit(10);
      if (cancelled || !data || data.length === 0) return;
      setHistory(data as AnalysisRow[]);
      setResult(data[0] as AnalysisRow);
    }
    loadHistory(selectedConn.external_id);
    return () => {
      cancelled = true;
    };
  }, [selectedConn]);

  // Resume after a refresh: if a run was in flight for the selected app, keep
  // showing the "analyzing" state and poll for the newly-inserted analysis row.
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!selectedConn) return;
    const pending = readPending();
    if (!pending || pending.packageName !== selectedConn.external_id) return;
    if (Date.now() - pending.startedAt > PENDING_TTL_MS) {
      clearPending();
      return;
    }

    let cancelled = false;
    setRunning(true);
    setError(null);

    async function poll() {
      if (cancelled) return;
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("aso_analyses")
          .select("id, package_name, listing_snapshot, aso_score, score_breakdown, recommendations, created_at")
          .eq("package_name", pending!.packageName)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        const row = data as AnalysisRow | null;
        // A row whose id differs from the one present at run start IS the new
        // analysis (robust to client/server clock skew).
        if (row && row.id !== pending!.prevLatestId) {
          setResult(row);
          setHistory((prev) => (prev.some((h) => h.id === row.id) ? prev : [row, ...prev].slice(0, 10)));
          clearPending();
          setRunning(false);
          loadQuota();
          window.dispatchEvent(new Event("reviewpilot:usage-updated"));
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      if (cancelled) return;
      if (Date.now() - pending!.startedAt > PENDING_TTL_MS) {
        clearPending();
        setRunning(false);
        setError({ kind: "generic", message: "Your previous analysis didn't finish. Please run it again." });
        return;
      }
      resumeTimer.current = setTimeout(poll, 3000);
    }
    poll();

    return () => {
      cancelled = true;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [selectedConn, loadQuota]);

  const quotaExhausted = quota ? quota.limit !== -1 && quota.remaining <= 0 : false;
  const canRun = !!selectedConn && !running && !quotaExhausted;

  async function runAnalysis(force: boolean) {
    if (!selectedConn) return;
    setRunning(true);
    setError(null);
    // Persist an in-flight marker so a mid-run refresh can resume (see the
    // resume effect above). prevLatestId lets the poll recognise the new row.
    writePending({
      packageName: selectedConn.external_id,
      startedAt: Date.now(),
      prevLatestId: history[0]?.id ?? null,
    });
    try {
      // Trim, drop blanks, dedupe, cap at 2 before sending.
      const comps = Array.from(
        new Set(competitors.map((c) => c.trim()).filter((c) => c.length > 0))
      ).slice(0, 2);
      const res = await fetch("/api/aso/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: selectedConn.id,
          competitors: comps,
          force,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(mapError(res.status, data));
        if (data?.quota) applyQuota(data.quota);
        return;
      }

      const analysis = data.analysis as AnalysisRow;
      setResult(analysis);
      // Prepend the run to history (dedupe in case a cache hit returned an
      // already-listed row), keeping the 10 most recent.
      setHistory((prev) =>
        prev.some((h) => h.id === analysis.id) ? prev : [analysis, ...prev].slice(0, 10)
      );
      if (data.quota) applyQuota(data.quota);
      // Nudge any mounted useUsage consumer (sidebar, Billing) to refetch so the
      // ASO usage metric stays in sync after a fresh run decrements quota.
      if (!data.cached) window.dispatchEvent(new Event("reviewpilot:usage-updated"));
      toast({
        title: data.cached ? "Loaded cached analysis" : "Analysis complete",
        description: data.cached
          ? "Showing your most recent analysis. Use Re-run for a fresh audit."
          : `ASO score: ${data.analysis.aso_score} / 100.`,
      });
    } catch {
      setError({ kind: "generic", message: "Something went wrong. Please try again." });
    } finally {
      // The in-session request resolved (success or error) — drop the marker so
      // a later refresh doesn't falsely resume. (After a refresh mid-run this
      // block never runs in the new page; the resume poll clears it instead.)
      clearPending();
      setRunning(false);
    }
  }

  function applyQuota(q: { used: number; limit: number; remaining: number; planName: string }) {
    setQuota({ used: q.used, limit: q.limit, remaining: q.remaining, planName: q.planName });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (connsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (connections.length === 0) {
    return <NoAppsState />;
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aso-app" className="text-sm font-medium">
              App
            </Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger id="aso-app" className="w-full h-11" aria-label="Select an app to analyze">
                <SelectValue placeholder="Select a connected app" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedConn && (
              <p className="text-[11px] text-muted-foreground font-mono break-all">
                {selectedConn.external_id}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Competitor apps <span className="text-muted-foreground font-normal">(optional, up to 2)</span>
            </Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <Input
                  key={i}
                  value={competitors[i]}
                  onChange={(e) => {
                    const next: [string, string] = [...competitors];
                    next[i] = e.target.value;
                    setCompetitors(next);
                  }}
                  placeholder="com.competitor.app"
                  aria-label={`Competitor app ${i + 1} package name`}
                  className="h-11 font-mono text-xs"
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Feeds the keyword-gap analysis. Paste a package name or Play Store URL.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="gradient"
              size="lg"
              onClick={() => runAnalysis(false)}
              disabled={!canRun}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Run Analysis
                </>
              )}
            </Button>
            {quota && (
              <p
                className={cn(
                  "text-xs font-mono",
                  quotaExhausted ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {quota.limit === -1
                  ? "Unlimited analyses"
                  : `${quota.remaining} of ${quota.limit} left this ${USAGE_PERIOD.label}`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && <ErrorBanner error={error} />}

      {/* Results / running / empty */}
      {running && !result ? (
        <ResultsSkeleton />
      ) : result ? (
        <ResultsView
          result={result}
          history={history}
          onSelect={(a) => setResult(a)}
          onRerun={() => runAnalysis(true)}
          rerunning={running}
        />
      ) : !error ? (
        <EmptyState />
      ) : null}
    </div>
  );
}

function mapError(status: number, data: { error?: string; message?: string }): RunError {
  const message = data?.message || "Something went wrong. Please try again.";
  switch (status) {
    case 403:
      return { kind: "upgrade", message };
    case 429:
      return { kind: "quota", message };
    case 404:
      return { kind: "not_found", message };
    case 502:
      return { kind: "ai", message };
    case 503:
      return { kind: "scrape", message };
    default:
      return { kind: "generic", message };
  }
}

// ── States ─────────────────────────────────────────────────────────────────

function NoAppsState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
          <Smartphone className="h-6 w-6 text-accent" />
        </div>
        <div>
          <p className="font-semibold">No Play Store app connected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect a Play Store app to audit and optimize its listing.
          </p>
        </div>
        <Link
          href="/dashboard/settings/connections"
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          Connect an app
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
          <Rocket className="h-6 w-6 text-accent" />
        </div>
        <div>
          <p className="font-semibold">Run your first analysis</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            We&apos;ll audit your live listing and cross-reference it with your real review keywords,
            aspect sentiment, and tracked issues.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorBanner({ error }: { error: RunError }) {
  const isUpgrade = error.kind === "upgrade";
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        error.kind === "quota" || isUpgrade
          ? "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
          : "border-destructive/30 bg-destructive/5"
      )}
    >
      <TriangleAlert
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          error.kind === "quota" || isUpgrade ? "text-amber-600 dark:text-amber-400" : "text-destructive"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">{error.message}</p>
        {(isUpgrade || error.kind === "quota") && (
          <Link
            href="/dashboard/settings/billing"
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            {isUpgrade ? "Upgrade plan" : "Manage plan"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col items-center gap-5 md:flex-row md:items-start">
            <Skeleton className="h-28 w-28 shrink-0 rounded-full" />
            <div className="w-full space-y-2.5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

// ── Results ──────────────────────────────────────────────────────────────────

function ResultsView({
  result,
  history,
  onSelect,
  onRerun,
  rerunning,
}: {
  result: AnalysisRow;
  history: AnalysisRow[];
  onSelect: (a: AnalysisRow) => void;
  onRerun: () => void;
  rerunning: boolean;
}) {
  const snap = result.listing_snapshot;
  const rec = result.recommendations;
  const breakdown = result.score_breakdown;
  const hasHistory = history.length > 1;

  // Score delta vs the chronologically previous analysis (the next-older entry
  // relative to whichever run is currently displayed). null when there is no
  // older analysis to compare against.
  const currentIdx = history.findIndex((h) => h.id === result.id);
  const previous =
    currentIdx >= 0 && currentIdx + 1 < history.length ? history[currentIdx + 1] : null;
  const scoreDelta = previous ? result.aso_score - previous.aso_score : null;

  // Collapsible analysis body. Auto-expands whenever the displayed analysis
  // changes (fresh run or picking another run from history); the user can
  // collapse to declutter the page while keeping the header summary visible.
  const [expanded, setExpanded] = useState(true);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    setExpanded(true);
  }, [result.id]);

  const scoreTone =
    result.aso_score >= 75
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      : result.aso_score >= 45
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
      : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";

  return (
    <div className="space-y-5">
      {/* Timestamp + history dropdown + collapse + re-run */}
      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-xs text-muted-foreground">Analyzed</span>
          {hasHistory ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="View previous analyses"
                className="inline-flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="truncate">{formatDateTime(result.created_at)}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {history.map((h) => (
                  <DropdownMenuItem
                    key={h.id}
                    onClick={() => onSelect(h)}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{formatDateTimeShort(h.created_at)}</span>
                    <span
                      className={cn(
                        "ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                        h.id === result.id ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {h.aso_score}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="truncate text-xs font-medium text-foreground">
              {formatDateTime(result.created_at)}
            </span>
          )}
          {/* Keep the headline score visible while the body is collapsed. */}
          {!expanded && (
            <span
              className={cn(
                "ml-1 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                scoreTone
              )}
            >
              {result.aso_score}/100
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="aso-analysis-body"
            aria-label={expanded ? "Collapse analysis" : "Expand analysis"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-9"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")} aria-hidden />
          </button>
          <Button
            variant="subtle"
            size="sm"
            onClick={onRerun}
            disabled={rerunning}
            className="min-h-[44px] sm:min-h-0 sm:h-9"
          >
            {rerunning ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Re-run
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="aso-body"
            id="aso-analysis-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="space-y-5">
      {/* Score + breakdown */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col items-center gap-5 md:flex-row md:items-start md:gap-6">
            <ScoreRing score={result.aso_score} delta={scoreDelta} />
            <div className="w-full min-w-0 space-y-2">
              {FACTOR_ORDER.map((key) => (
                <BreakdownRow key={key} label={FACTOR_LABELS[key]} factor={breakdown[key]} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyword opportunities */}
      <KeywordGaps gaps={rec.keyword_gaps} />

      {/* Suggested rewrites */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <h2 className="text-base font-semibold">Suggested rewrites</h2>
        </div>
        <RewriteCard
          label="Title"
          current={snap.title}
          suggested={rec.title}
          max={LIMITS.title}
        />
        <RewriteCard
          label="Short description"
          current={snap.short_description}
          suggested={rec.short_description}
          max={LIMITS.short}
        />
        <LongDescCard current={snap.long_description} sections={rec.long_description} />
        {rec.whats_new ? (
          <RewriteCard
            label="What's new"
            current={null}
            suggested={rec.whats_new}
            max={LIMITS.whats_new}
          />
        ) : null}
      </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreRing({ score, delta }: { score: number; delta?: number | null }) {
  const radius = 50;
  const stroke = 9;
  const c = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;
  const tone = score >= 75 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted-foreground) / 0.18)" strokeWidth={stroke} />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums">{score}</span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">ASO Score</span>
      <ScoreDelta delta={delta} />
    </div>
  );
}

function ScoreDelta({ delta }: { delta?: number | null }) {
  if (delta === null || delta === undefined) return null;
  const up = delta > 0;
  const down = delta < 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
        up
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : down
          ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
          : "bg-muted text-muted-foreground"
      )}
      aria-label={
        up
          ? `Up ${delta} points since previous analysis`
          : down
          ? `Down ${Math.abs(delta)} points since previous analysis`
          : "No change since previous analysis"
      }
    >
      {up ? <ArrowUp className="h-3 w-3" aria-hidden /> : down ? <ArrowDown className="h-3 w-3" aria-hidden /> : null}
      {up ? `+${delta}` : down ? delta : "±0"}
      <span className="font-normal text-[9px] opacity-80">since last</span>
    </span>
  );
}

const STATUS_CHIP: Record<AsoFactorScore["status"], string> = {
  good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};
const STATUS_LABEL: Record<AsoFactorScore["status"], string> = {
  good: "Good",
  warning: "Improve",
  critical: "Critical",
};

function BreakdownRow({ label, factor }: { label: string; factor: AsoFactorScore }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-card/40 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {factor.score}/{factor.max}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground break-words">{factor.detail}</p>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
          STATUS_CHIP[factor.status]
        )}
      >
        {STATUS_LABEL[factor.status]}
      </span>
    </div>
  );
}

const PRIORITY_CHIP: Record<AsoKeywordGap["priority"], string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

function KeywordGaps({ gaps }: { gaps: AsoKeywordGap[] }) {
  if (!gaps || gaps.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-accent" />
        <h2 className="text-base font-semibold">Keyword opportunities</h2>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {gaps.map((g, i) => (
          <div key={`${g.keyword}-${i}`} className="rounded-xl border border-border/60 bg-card/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium break-all">{g.keyword}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", PRIORITY_CHIP[g.priority])}>
                {g.priority}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {g.source}
              </span>
            </div>
            {g.rationale && <p className="mt-1 text-xs text-muted-foreground break-words">{g.rationale}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Couldn't copy", description: "Copy is unavailable in this browser." });
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function CharCount({ len, max }: { len: number; max: number }) {
  const over = len > max;
  return (
    <span className={cn("text-[11px] font-mono tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>
      {len} / {max}
    </span>
  );
}

function RewriteCard({
  label,
  current,
  suggested,
  max,
}: {
  label: string;
  current: string | null;
  suggested: string;
  max: number;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">{label}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {current !== null && (
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Current</p>
              <p className="text-sm break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                {current || <span className="text-muted-foreground italic">empty</span>}
              </p>
            </div>
          )}
          <div className={cn("rounded-lg border border-accent/30 bg-accent/[0.04] p-3", current === null && "md:col-span-2")}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-accent">Suggested</p>
              <CharCount len={suggested.length} max={max} />
            </div>
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-sm break-words [overflow-wrap:anywhere] whitespace-pre-wrap">{suggested}</p>
              <CopyButton text={suggested} label={label} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LongDescCard({ current, sections }: { current: string; sections: AsoLongDescriptionSection[] }) {
  const suggestedText = sections.map((s) => `${s.heading}\n${s.body}`).join("\n\n").trim();
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Long description</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Current</p>
            <p className="max-h-64 overflow-y-auto text-sm break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
              {current || <span className="text-muted-foreground italic">empty</span>}
            </p>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/[0.04] p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-accent">Suggested</p>
              <CharCount len={suggestedText.length} max={LIMITS.long} />
            </div>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-2.5">
                {sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No suggestion generated.</p>
                ) : (
                  sections.map((s, i) => (
                    <div key={i}>
                      {s.heading && <p className="text-sm font-semibold break-words [overflow-wrap:anywhere]">{s.heading}</p>}
                      <p className="text-sm break-words [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">
                        {s.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {sections.length > 0 && <CopyButton text={suggestedText} label="Long description" />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
