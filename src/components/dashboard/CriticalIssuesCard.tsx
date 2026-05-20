"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import type { AnalyticsRange, CriticalIssue } from "@/hooks/useAnalytics";

interface CriticalIssuesCardProps {
  issues: CriticalIssue[];
  loading?: boolean;
  /**
   * Current analytics page range. Drives the dynamic copy ("today" /
   * "in the last N days"). Defaults to "7d" if omitted so older call
   * sites stay backward-compatible.
   */
  range?: AnalyticsRange;
}

const RANGE_PHRASE: Record<AnalyticsRange, { trail: string; bare: string }> = {
  "1d": { trail: "today", bare: "today" },
  "7d": { trail: "in the last 7 days", bare: "in the last 7 days" },
  "30d": { trail: "in the last 30 days", bare: "in the last 30 days" },
  "90d": { trail: "in the last 90 days", bare: "in the last 90 days" },
};

const SOURCE_LABEL: Record<string, string> = {
  google_business: "GBP",
  play_store: "Play Store",
  whatsapp: "WhatsApp",
};

function truncate(text: string, max = 120): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function CriticalIssuesCard({
  issues,
  loading,
  range = "7d",
}: CriticalIssuesCardProps) {
  const phrase = RANGE_PHRASE[range] ?? RANGE_PHRASE["7d"];
  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="h-10 rounded-md bg-muted/40 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Empty state — reassurance variant (green/teal). Less visual weight.
  if (issues.length === 0) {
    return (
      <Card className="border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/15 dark:to-teal-950/10">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="rounded-lg p-1.5 bg-emerald-100 dark:bg-emerald-950/40 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              All Clear
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70">
              No critical issues flagged {phrase.bare}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-rose-300/70 dark:border-rose-900/50 bg-gradient-to-r from-rose-50/70 to-red-50/50 dark:from-rose-950/20 dark:to-red-950/15">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg p-1.5 bg-rose-100 dark:bg-rose-950/40">
            <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
              Critical Issues
            </p>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-300/70">
              {range === "1d"
                ? "Reviews flagged as urgent today"
                : `Reviews flagged as urgent ${phrase.trail}`}
            </p>
          </div>
          <span className="rounded-full bg-rose-600 text-white text-[10px] font-semibold px-2 py-0.5 tabular-nums">
            {issues.length}
          </span>
        </div>

        <ul className="divide-y divide-rose-200/60 dark:divide-rose-900/40">
          {issues.map((iss) => {
            const ratingLabel = iss.rating != null ? `${iss.rating}★` : null;
            const sourceLabel = iss.source
              ? SOURCE_LABEL[iss.source] ?? iss.source
              : null;
            return (
              <li key={iss.id || iss.created_at}>
                <Link
                  href={iss.id ? `/dashboard/inbox?reviewId=${encodeURIComponent(iss.id)}` : "/dashboard/inbox"}
                  // Mobile: full vertical stack (preview → metadata → CTA).
                  // Desktop: preview+metadata flex left, CTA right.
                  className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2.5 hover:bg-rose-100/40 dark:hover:bg-rose-950/20 transition-colors rounded-md px-1 -mx-1"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/90 line-clamp-2">
                      {truncate(iss.text)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      {ratingLabel && (
                        <span className="font-mono tabular-nums">
                          {ratingLabel}
                        </span>
                      )}
                      <span aria-hidden>•</span>
                      <span className="font-medium text-foreground/80">
                        {iss.author_name}
                      </span>
                      {sourceLabel && (
                        <>
                          <span aria-hidden>•</span>
                          <span className="rounded bg-background/70 dark:bg-background/40 px-1.5 py-0.5 font-medium">
                            {sourceLabel}
                          </span>
                        </>
                      )}
                      <span aria-hidden>•</span>
                      <span>{timeAgo(iss.created_at)}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-300",
                      "opacity-80 group-hover:opacity-100 transition-opacity",
                      // Mobile: own row (no shrink-0, left-aligned by parent column flow).
                      // Desktop: pinned right, doesn't shrink.
                      "self-start sm:self-auto sm:shrink-0"
                    )}
                  >
                    Open in Inbox
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
