"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  GitCompareArrows,
  Loader2,
  Smartphone,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCcw,
  Lock,
  TriangleAlert,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { usePlan } from "@/hooks/usePlan";
import type { VersionVerdict } from "@/types/database";

// ── Types mirroring the GET /api/version-impact response ────────────────────────
interface SentimentSplit {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
}
interface VersionMetrics {
  versionName: string;
  versionCode: number | null;
  count: number;
  avgRating: number | null;
  sentiment: SentimentSplit;
  firstSeen: string | null;
  lastSeen: string | null;
  lowSample: boolean;
}
interface ThemeDelta {
  theme: string;
  countA: number;
  countB: number;
  delta: number;
  changePct: number | null;
  direction: "up" | "down";
}
interface VersionComparison {
  versionA: VersionMetrics;
  versionB: VersionMetrics;
  ratingDelta: number | null;
  countDelta: number;
  sentimentDelta: { positivePct: number; neutralPct: number; negativePct: number };
  themeDeltas: ThemeDelta[];
}
interface ImpactResponse {
  connection: { id: string; name: string; type: string };
  versions: VersionMetrics[];
  comparison: VersionComparison | null;
  hasVersionedReviews: boolean;
  totalPlayStoreReviews: number;
  versionedReviews: number;
}

interface PlayConnection {
  id: string;
  name: string;
  external_id: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function VersionImpactClient() {
  const { can, isLoading: planLoading } = usePlan();
  const canAi = can("version_impact_ai");

  const [connsLoading, setConnsLoading] = useState(true);
  const [connections, setConnections] = useState<PlayConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ImpactResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The version pair currently being compared (drives the picker + verdict).
  const [versionAName, setVersionAName] = useState<string>("");
  const [versionBName, setVersionBName] = useState<string>("");

  // ── Load connected Play Store apps ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadConnections() {
      try {
        const supabase = createClient();
        const { data: rows } = await supabase
          .from("connections")
          .select("id, name, external_id, type, is_active")
          .eq("type", "play_store")
          .eq("is_active", true);
        if (cancelled) return;
        const conns = (rows ?? [])
          .filter((c) => !!c.external_id)
          .map((c) => ({ id: c.id as string, name: c.name as string, external_id: c.external_id as string }));
        setConnections(conns);
        if (conns.length === 1) setSelectedId(conns[0].id);
      } finally {
        if (!cancelled) setConnsLoading(false);
      }
    }
    loadConnections();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Fetch deterministic data for a connection (optionally a specific pair) ──
  const load = useCallback(async (connId: string, vA?: string, vB?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ connectionId: connId });
      if (vA && vB) {
        params.set("versionA", vA);
        params.set("versionB", vB);
      }
      const res = await fetch(`/api/version-impact?${params.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || "Couldn't load version data.");
        setData(null);
        return;
      }
      const payload = json as ImpactResponse;
      setData(payload);
      // Sync the picker to whatever pair the server resolved.
      if (payload.comparison) {
        setVersionAName(payload.comparison.versionA.versionName);
        setVersionBName(payload.comparison.versionB.versionName);
      } else if (payload.versions.length === 1) {
        setVersionAName(payload.versions[0].versionName);
        setVersionBName("");
      }
    } catch {
      setError("Something went wrong loading version data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load whenever the selected app changes.
  useEffect(() => {
    if (!selectedId) {
      setData(null);
      return;
    }
    load(selectedId);
  }, [selectedId, load]);

  // Re-compare when the user picks a different pair.
  function changePair(nextA: string, nextB: string) {
    if (!selectedId || !nextA || !nextB || nextA === nextB) return;
    setVersionAName(nextA);
    setVersionBName(nextB);
    load(selectedId, nextA, nextB);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (connsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (connections.length === 0) {
    return <NoAppsState />;
  }

  const comparison = data?.comparison ?? null;
  const versions = data?.versions ?? [];

  return (
    <div className="space-y-5">
      {/* App selector */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vi-app" className="text-sm font-medium">
              App
            </Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger id="vi-app" className="w-full h-11" aria-label="Select an app">
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
            <p className="text-[11px] text-muted-foreground inline-flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden />
              Only Play Store reviews carry version data. WhatsApp and Google Business
              reviews aren&apos;t included.
            </p>
          </div>

          {/* Version pair picker */}
          {versions.length >= 2 && versionAName && versionBName && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Baseline (older)</Label>
                <Select value={versionAName} onValueChange={(v) => changePair(v, versionBName)}>
                  <SelectTrigger className="h-11" aria-label="Baseline version">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.versionName} value={v.versionName} disabled={v.versionName === versionBName}>
                        v{v.versionName} · {v.count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Compare (newer)</Label>
                <Select value={versionBName} onValueChange={(v) => changePair(versionAName, v)}>
                  <SelectTrigger className="h-11" aria-label="Comparison version">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.versionName} value={v.versionName} disabled={v.versionName === versionAName}>
                        v{v.versionName} · {v.count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm font-medium break-words">{error}</p>
        </div>
      )}

      {loading ? (
        <ResultsSkeleton />
      ) : !data ? null : !data.hasVersionedReviews ? (
        <NoVersionsState />
      ) : (
        <>
          {comparison ? (
            <>
              <ComparisonHeader cmp={comparison} />
              <ThemeDeltaList deltas={comparison.themeDeltas} />
              <VerdictPanel
                canAi={canAi}
                planLoading={planLoading}
                connectionId={selectedId}
                versionA={comparison.versionA.versionName}
                versionB={comparison.versionB.versionName}
              />
            </>
          ) : (
            <SingleVersionNote />
          )}
          <VersionTable versions={versions} />
          {data.totalPlayStoreReviews > data.versionedReviews && (
            <p className="text-[11px] text-muted-foreground text-center">
              {data.totalPlayStoreReviews - data.versionedReviews} of{" "}
              {data.totalPlayStoreReviews} Play Store reviews had no reported version and
              were excluded.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Comparison header ──────────────────────────────────────────────────────────

function ComparisonHeader({ cmp }: { cmp: VersionComparison }) {
  const rd = cmp.ratingDelta;
  // Rating up = good (emerald); down = bad (red).
  const tone = rd === null ? "muted" : rd > 0 ? "up" : rd < 0 ? "down" : "flat";
  const toneClasses =
    tone === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            v{cmp.versionA.versionName} → v{cmp.versionB.versionName}
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
          {/* Hero rating delta */}
          <div className="flex shrink-0 items-center gap-3">
            <div className={cn("flex items-center gap-1", toneClasses)}>
              {tone === "up" ? (
                <ArrowUp className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden />
              ) : tone === "down" ? (
                <ArrowDown className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden />
              ) : (
                <Minus className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden />
              )}
              <span className="text-4xl sm:text-5xl font-semibold tabular-nums">
                {rd === null ? "—" : `${rd > 0 ? "+" : ""}${rd.toFixed(1)}`}
              </span>
            </div>
            <div className="text-xs text-muted-foreground leading-tight">
              <span className="text-amber-500">★</span> rating
              <br />
              change
            </div>
          </div>

          {/* Sub-stats */}
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
            <SubStat
              label="Reviews"
              value={`${cmp.countDelta >= 0 ? "+" : ""}${cmp.countDelta}`}
              sub={`${cmp.versionA.count} → ${cmp.versionB.count}`}
            />
            <SubStat
              label="Negative %"
              value={`${cmp.sentimentDelta.negativePct >= 0 ? "+" : ""}${cmp.sentimentDelta.negativePct}pt`}
              sub={`${cmp.versionA.sentiment.negativePct}% → ${cmp.versionB.sentiment.negativePct}%`}
              danger={cmp.sentimentDelta.negativePct > 0}
              good={cmp.sentimentDelta.negativePct < 0}
            />
            <SubStat
              label="Positive %"
              value={`${cmp.sentimentDelta.positivePct >= 0 ? "+" : ""}${cmp.sentimentDelta.positivePct}pt`}
              sub={`${cmp.versionA.sentiment.positivePct}% → ${cmp.versionB.sentiment.positivePct}%`}
              good={cmp.sentimentDelta.positivePct > 0}
              danger={cmp.sentimentDelta.positivePct < 0}
            />
          </div>
        </div>

        {(cmp.versionA.lowSample || cmp.versionB.lowSample) && (
          <p className="mt-4 inline-flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
            <TriangleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
            Low sample on{" "}
            {[cmp.versionA, cmp.versionB]
              .filter((v) => v.lowSample)
              .map((v) => `v${v.versionName}`)
              .join(" & ")}{" "}
            — treat this comparison as a weak signal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SubStat({
  label,
  value,
  sub,
  danger,
  good,
}: {
  label: string;
  value: string;
  sub: string;
  danger?: boolean;
  good?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/40 px-3 py-2.5">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums",
          good ? "text-emerald-600 dark:text-emerald-400" : danger ? "text-red-600 dark:text-red-400" : "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground tabular-nums">{sub}</p>
    </div>
  );
}

// ── Theme deltas ────────────────────────────────────────────────────────────────

function ThemeDeltaList({ deltas }: { deltas: ThemeDelta[] }) {
  if (!deltas || deltas.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-5">
          <SectionTitle>Theme changes</SectionTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            No measurable theme movement between these versions.
          </p>
        </CardContent>
      </Card>
    );
  }
  // Risers (more complaints) are bad → red/up; fallers good → green/down.
  const risers = deltas.filter((d) => d.direction === "up");
  const fallers = deltas.filter((d) => d.direction === "down");
  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-4">
        <SectionTitle>Theme changes</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <ThemeColumn title="Rose" emptyText="Nothing rose" deltas={risers} rising />
          <ThemeColumn title="Fell" emptyText="Nothing fell" deltas={fallers} rising={false} />
        </div>
      </CardContent>
    </Card>
  );
}

function ThemeColumn({
  title,
  emptyText,
  deltas,
  rising,
}: {
  title: string;
  emptyText: string;
  deltas: ThemeDelta[];
  rising: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {rising ? (
          <TrendingUp className="h-3.5 w-3.5 text-red-500" aria-hidden />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
        )}
        {title}
      </div>
      {deltas.length === 0 ? (
        <p className="text-xs text-muted-foreground/70 italic">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {deltas.map((d) => (
            <li
              key={d.theme}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium capitalize">{d.theme}</span>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {d.countA}→{d.countB}
              </span>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  rising
                    ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                )}
              >
                {d.changePct === null
                  ? rising
                    ? "new"
                    : "gone"
                  : `${d.changePct > 0 ? "+" : ""}${d.changePct}%`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Per-version table ────────────────────────────────────────────────────────

function VersionTable({ versions }: { versions: VersionMetrics[] }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <SectionTitle>All versions</SectionTitle>
        {/* Scroll contained inside this wrapper so the page never overflows at 320px. */}
        <div className="mt-3 -mx-1 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="px-2 py-2 font-medium">Version</th>
                <th className="px-2 py-2 font-medium text-right">Reviews</th>
                <th className="px-2 py-2 font-medium text-right">Avg ★</th>
                <th className="px-2 py-2 font-medium">Sentiment</th>
                <th className="px-2 py-2 font-medium whitespace-nowrap">Date range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {versions.map((v) => (
                <tr key={v.versionName} className="hover:bg-muted/30">
                  <td className="px-2 py-2.5">
                    <span className="font-medium">v{v.versionName}</span>
                    {v.lowSample && (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        low sample
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{v.count}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">
                    {v.avgRating === null ? "—" : v.avgRating.toFixed(1)}
                  </td>
                  <td className="px-2 py-2.5">
                    <SentimentBar s={v.sentiment} />
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-[11px] text-muted-foreground tabular-nums">
                    {formatDate(v.firstSeen)} – {formatDate(v.lastSeen)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SentimentBar({ s }: { s: SentimentSplit }) {
  if (s.total === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-2 w-24 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className="bg-emerald-500" style={{ width: `${s.positivePct}%` }} />
        <span className="bg-slate-400" style={{ width: `${s.neutralPct}%` }} />
        <span className="bg-rose-500" style={{ width: `${s.negativePct}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">
        {s.positivePct}/{s.neutralPct}/{s.negativePct}
      </span>
    </div>
  );
}

// ── AI verdict panel ────────────────────────────────────────────────────────

function VerdictPanel({
  canAi,
  planLoading,
  connectionId,
  versionA,
  versionB,
}: {
  canAi: boolean;
  planLoading: boolean;
  connectionId: string;
  versionA: string;
  versionB: string;
}) {
  const [verdict, setVerdict] = useState<VersionVerdict | null>(null);
  const [meta, setMeta] = useState<{ cached: boolean; fallback: boolean; createdAt: string | null }>(
    { cached: false, fallback: false, createdAt: null }
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Auto-load a CACHED verdict on mount / pair change — never triggers AI.
  useEffect(() => {
    if (!canAi || !connectionId || !versionA || !versionB) return;
    let cancelled = false;
    setVerdict(null);
    setErr(null);
    (async () => {
      try {
        const res = await fetch("/api/version-impact/verdict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId, versionA, versionB, cacheOnly: true }),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        if (json.verdict) {
          setVerdict(json.verdict);
          setMeta({ cached: true, fallback: false, createdAt: json.createdAt ?? null });
        }
      } catch {
        /* silent — the button is still available */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canAi, connectionId, versionA, versionB]);

  async function generate(force: boolean) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/version-impact/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, versionA, versionB, force }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.message || "Couldn't generate a verdict. Please try again.");
        return;
      }
      if (json.verdict) {
        setVerdict(json.verdict);
        setMeta({ cached: !!json.cached, fallback: !!json.fallback, createdAt: json.createdAt ?? null });
      }
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Locked teaser for Free/Starter — same blur + CTA visual as UpgradeGate.
  if (!planLoading && !canAi) {
    return (
      <div className="relative">
        <div className="opacity-30 pointer-events-none blur-[2px]">
          <Card>
            <CardContent className="p-4 sm:p-5 space-y-2">
              <SectionTitle>AI verdict</SectionTitle>
              <p className="text-sm font-medium">
                v{versionB} dropped your rating and tripled crash complaints.
              </p>
              <p className="text-sm text-muted-foreground">
                The newer release introduced a regression that reviewers are flagging across
                multiple themes. Negative sentiment rose sharply versus the prior build.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border bg-white p-5 text-center shadow-lg dark:bg-gray-900 sm:p-6">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <p className="mb-1 text-base font-semibold sm:text-lg">AI verdict is a Growth feature</p>
            <p className="mb-4 text-sm text-muted-foreground">
              The comparison and theme deltas above are free. Upgrade to add a plain-English
              diagnosis of each release.
            </p>
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90 sm:w-auto"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle>
            <Sparkles className="h-4 w-4 text-accent" />
            AI verdict
          </SectionTitle>
          {verdict && (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => generate(true)}
              disabled={loading}
              className="min-h-[44px] sm:min-h-0 sm:h-9"
            >
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />}
              Refresh
            </Button>
          )}
        </div>

        {err && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm break-words">{err}</p>
          </div>
        )}

        {!verdict ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Generate a plain-English diagnosis of what v{versionB} did versus v{versionA},
              grounded in the deltas above.
            </p>
            <Button
              variant="gradient"
              size="lg"
              onClick={() => generate(false)}
              disabled={loading || planLoading}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI verdict
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-base font-semibold leading-snug break-words">{verdict.verdict}</p>
            <p className="text-sm text-muted-foreground break-words leading-relaxed">{verdict.diagnosis}</p>
            {verdict.action && (
              <div className="rounded-lg border border-accent/30 bg-accent/[0.04] px-3 py-2.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-accent">Recommended action</p>
                <p className="mt-0.5 text-sm break-words">{verdict.action}</p>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {meta.fallback
                ? "Generated locally (AI was unavailable)."
                : meta.cached && meta.createdAt
                ? `Cached ${new Date(meta.createdAt).toLocaleDateString()}`
                : "Just generated."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Shared bits + empty states ───────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="flex items-center gap-2 text-base font-semibold">{children}</h2>;
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

function SingleVersionNote() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
          <GitCompareArrows className="h-6 w-6 text-accent" />
        </div>
        <div>
          <p className="font-semibold">Need at least two releases to compare</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            We&apos;ve only seen reviews for one app version so far. Once a new release
            starts collecting reviews, you&apos;ll see the impact comparison here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function NoVersionsState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
          <GitCompareArrows className="h-6 w-6 text-accent" />
        </div>
        <div>
          <p className="font-semibold">No versioned reviews yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Version data comes from the Play Store Reviews API. Once your synced reviews
            carry version info, releases will appear here to compare.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

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
            Connect a Play Store app to see how each release affects your rating and reviews.
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
