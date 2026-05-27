"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface AppVersion {
  name: string;
  code: number | null;
  count: number;
}

interface AppVersionsResponse {
  versions: AppVersion[];
  unknownCount: number;
  totalCount: number;
}

interface AppVersionFilterProps {
  /** Active connection id (null = all of the user's active connections). */
  connectionId: string | null;
  /** Currently selected version name, or null when no specific version is selected. */
  appVersion: string | null;
  /** When true, "Unknown" is selected (mutually exclusive with appVersion). */
  appVersionUnknown: boolean;
  /** Called when the user picks a version or "All Versions". */
  onChange: (next: { appVersion: string | null; appVersionUnknown: boolean }) => void;
  /** Mock-mode flag — when true, derive options from in-memory mock reviews instead of calling the API. */
  isMock?: boolean;
  /** When isMock=true, the caller passes the in-memory rows used to derive {versions, unknownCount, totalCount} client-side. */
  mockRows?: Array<{ source: string; app_version_name?: string | null; app_version_code?: number | null }>;
}

// Structured help content shown in the (?) popover. Mirrors the "info chip"
// pattern used by Stripe, Linear, Vercel — heading + paragraph + bullets,
// not a single wall of text, so it scans cleanly on every viewport.

function deriveFromMockRows(
  rows: AppVersionFilterProps["mockRows"]
): AppVersionsResponse {
  const playRows = (rows ?? []).filter((r) => r.source === "play_store");
  const byName = new Map<string, { code: number | null; count: number }>();
  let unknownCount = 0;
  for (const r of playRows) {
    const name = r.app_version_name ?? null;
    const code = typeof r.app_version_code === "number" ? r.app_version_code : null;
    if (name === null || name === undefined) {
      unknownCount++;
      continue;
    }
    const existing = byName.get(name);
    if (!existing) byName.set(name, { code, count: 1 });
    else {
      existing.count++;
      if (code !== null && (existing.code === null || code > existing.code)) {
        existing.code = code;
      }
    }
  }
  const versions = Array.from(byName.entries())
    .map(([name, v]) => ({ name, code: v.code, count: v.count }))
    .sort((a, b) => {
      const ca = a.code;
      const cb = b.code;
      if (ca === null && cb === null) return b.count - a.count;
      if (ca === null) return 1;
      if (cb === null) return -1;
      if (ca !== cb) return cb - ca;
      return b.count - a.count;
    });
  return { versions, unknownCount, totalCount: playRows.length };
}

export function AppVersionFilter({
  connectionId,
  appVersion,
  appVersionUnknown,
  onChange,
  isMock = false,
  mockRows,
}: AppVersionFilterProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<AppVersionsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    if (isMock) {
      setData(deriveFromMockRows(mockRows));
      return;
    }
    setLoading(true);
    try {
      const qs = connectionId ? `?connectionId=${encodeURIComponent(connectionId)}` : "";
      const res = await fetch(`/api/reviews/app-versions${qs}`);
      if (!res.ok) {
        setData({ versions: [], unknownCount: 0, totalCount: 0 });
        return;
      }
      const json = (await res.json()) as AppVersionsResponse;
      setData(json);
    } catch {
      setData({ versions: [], unknownCount: 0, totalCount: 0 });
    } finally {
      setLoading(false);
    }
  }, [connectionId, isMock, mockRows]);

  // Load once on mount and whenever the connection scope changes. In mock
  // mode this re-derives synchronously when the caller's row set changes.
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const triggerLabel =
    appVersionUnknown
      ? "Version not reported"
      : appVersion
      ? `v${appVersion}`
      : "All Versions";

  const isFilterActive = appVersionUnknown || !!appVersion;

  const empty =
    !loading && data && data.versions.length === 0 && data.unknownCount === 0;

  function pickVersion(name: string) {
    onChange({ appVersion: name, appVersionUnknown: false });
    setOpen(false);
  }
  function pickUnknown() {
    onChange({ appVersion: null, appVersionUnknown: true });
    setOpen(false);
  }
  function pickAll() {
    onChange({ appVersion: null, appVersionUnknown: false });
    setOpen(false);
  }

  return (
    <div className="inline-flex items-center gap-1 max-w-full min-w-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Filter by app version"
            aria-expanded={open}
            disabled={empty || undefined}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 ring-1 ring-inset min-w-0",
              // Cap trigger width at small viewports but never let it overflow
              // its container. Truncate the label with an ellipsis when long.
              "max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[260px]",
              isFilterActive
                ? "bg-accent/15 text-accent ring-accent/40"
                : "bg-transparent text-muted-foreground ring-border/60 hover:text-foreground hover:bg-muted/40 hover:ring-border",
              empty && "opacity-60 cursor-not-allowed"
            )}
          >
            <span className="truncate min-w-0">{triggerLabel}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          collisionPadding={12}
          // Always at least 220px wide so counts + names stay readable, even
          // when the trigger button is narrower (e.g. on a 320px viewport).
          // Caps at calc(100vw - 24px) so it never overflows the screen.
          className="p-0 w-[min(calc(100vw-24px),280px)] sm:w-[260px]"
          role="listbox"
          aria-label="App version options"
        >
          {loading ? (
            <div className="p-2 space-y-1">
              <div className="h-9 rounded-sm bg-muted/40 animate-pulse" />
              <div className="h-9 rounded-sm bg-muted/40 animate-pulse" />
              <div className="h-9 rounded-sm bg-muted/40 animate-pulse" />
            </div>
          ) : empty ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              No versions yet — sync some reviews first
            </div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto py-1">
              {data?.versions.map((v) => {
                const selected = !appVersionUnknown && appVersion === v.name;
                return (
                  <button
                    key={v.name}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pickVersion(v.name)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2 min-h-[44px] md:min-h-0 md:py-1.5 text-sm transition-colors",
                      selected
                        ? "bg-accent/15 text-accent"
                        : "hover:bg-muted/40 text-foreground"
                    )}
                  >
                    <span className="truncate min-w-0 flex-1 text-left">v{v.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">
                      {v.count}
                    </span>
                  </button>
                );
              })}

              {data && data.unknownCount > 0 && (
                <>
                  <div className="my-1 border-t border-border/60" />
                  <button
                    type="button"
                    role="option"
                    aria-selected={appVersionUnknown}
                    onClick={pickUnknown}
                    title="Google's API did not return version metadata for these reviews. This is normal for web-submitted reviews and certain device configurations."
                    className={cn(
                      "w-full flex flex-col items-stretch gap-0.5 px-3 py-2 min-h-[44px] md:min-h-0 md:py-1.5 text-sm transition-colors text-left",
                      appVersionUnknown
                        ? "bg-accent/15 text-accent"
                        : "hover:bg-muted/40 text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate min-w-0 flex-1 text-left">Version not reported</span>
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">
                        {data.unknownCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      Google didn&apos;t send a version for these
                    </span>
                  </button>
                </>
              )}

              <div className="my-1 border-t border-border/60" />
              <button
                type="button"
                role="option"
                aria-selected={!isFilterActive}
                onClick={pickAll}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2 min-h-[44px] md:min-h-0 md:py-1.5 text-sm transition-colors",
                  !isFilterActive
                    ? "bg-accent/15 text-accent"
                    : "hover:bg-muted/40 text-foreground"
                )}
              >
                <span>All Versions</span>
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="About the version filter"
            // Larger tap target on touch devices (44px square) while
            // visually rendering as a small icon — standard pro pattern.
            className={cn(
              "shrink-0 inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground transition-colors",
              // Touch-comfortable 32px target on mobile, compact 20px on desktop.
              "h-8 w-8 sm:h-5 sm:w-5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            )}
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="p-0 w-[min(calc(100vw-24px),320px)] sm:w-[320px]"
          role="dialog"
          aria-label="About the version filter"
        >
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold leading-tight">About app version</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Filters reviews by the app version installed when the user wrote them. Data comes directly from the Play Store Reviews API.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-foreground/90">Why some reviews say &ldquo;Version not reported&rdquo;</p>
              <ul className="space-y-1 text-[11px] text-muted-foreground leading-relaxed list-disc pl-4">
                <li>The review was submitted via the Play Store <strong className="font-medium text-foreground/80">web client</strong> (no app installed, so no version).</li>
                <li>The reviewer&apos;s device <strong className="font-medium text-foreground/80">did not report version telemetry</strong> to Google.</li>
                <li>The review is <strong className="font-medium text-foreground/80">older than the API&apos;s ~7-day / 4096-review window</strong> and was already in your inbox before we started tracking versions.</li>
              </ul>
            </div>

            <div className="rounded-md bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground leading-relaxed">
              <strong className="font-medium text-foreground/80">This is a Google API limitation</strong> — not a sync bug. Re-syncing will not recover version data Google never sent in the first place.
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
