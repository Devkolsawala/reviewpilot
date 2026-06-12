"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Star,
  MessageSquare,
  BarChart3,
  Settings,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "review" | "issue" | "page";
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  rating?: number | null;
  highlight?: boolean; // highlight the query inside title/subtitle
}

interface ApiReviewHit {
  id: string;
  excerpt: string;
  author: string;
  rating: number | null;
  connectionName: string | null;
  createdAt: string;
}

interface ApiIssueHit {
  id: string;
  title: string;
  status: string;
  reviewCount: number;
}

const PAGES: SearchResult[] = [
  { type: "page", title: "Review Inbox", subtitle: "Manage and reply to reviews", href: "/dashboard/inbox", icon: <MessageSquare className="h-4 w-4" /> },
  { type: "page", title: "Analytics", subtitle: "View rating trends and insights", href: "/dashboard/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { type: "page", title: "Settings", subtitle: "Configure your account", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" /> },
  { type: "page", title: "AI Configuration", subtitle: "Set up AI reply preferences", href: "/dashboard/settings/ai-config", icon: <Settings className="h-4 w-4" /> },
  { type: "page", title: "Connections", subtitle: "Connect review sources", href: "/dashboard/settings/connections", icon: <Settings className="h-4 w-4" /> },
  { type: "page", title: "Billing", subtitle: "Manage your subscription", href: "/dashboard/settings/billing", icon: <Settings className="h-4 w-4" /> },
];

const DEBOUNCE_MS = 250;

// Wrap each case-insensitive occurrence of `query` in an accent-toned span.
function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let pos = 0;
  let idx = lower.indexOf(ql, pos);
  while (idx !== -1) {
    if (idx > pos) parts.push(text.slice(pos, idx));
    parts.push(
      <span key={idx} className="text-accent font-semibold">
        {text.slice(idx, idx + q.length)}
      </span>
    );
    pos = idx + q.length;
    idx = lower.indexOf(ql, pos);
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [reviewHits, setReviewHits] = useState<SearchResult[]>([]);
  const [issueHits, setIssueHits] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const setOpen = onOpenChange;

  const trimmed = query.trim();

  // Debounced server search for reviews + issues. Pages stay client-side.
  useEffect(() => {
    abortRef.current?.abort();
    if (trimmed.length < 2) {
      setReviewHits([]);
      setIssueHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=10`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setReviewHits([]);
          setIssueHits([]);
          return;
        }
        const data = (await res.json()) as {
          reviews?: ApiReviewHit[];
          issues?: ApiIssueHit[];
        };
        setReviewHits(
          (data.reviews ?? []).map((r) => ({
            type: "review" as const,
            title: r.author,
            subtitle: `${r.excerpt}${r.connectionName ? ` · ${r.connectionName}` : ""}`,
            href: `/dashboard/inbox?reviewId=${r.id}`,
            icon: (
              <Star
                className={cn(
                  "h-4 w-4",
                  r.rating != null && r.rating >= 4
                    ? "text-accent"
                    : r.rating != null && r.rating <= 2
                    ? "text-destructive"
                    : "text-amber-500"
                )}
              />
            ),
            rating: r.rating,
            highlight: true,
          }))
        );
        setIssueHits(
          (data.issues ?? []).map((i) => ({
            type: "issue" as const,
            title: i.title,
            subtitle: `${i.status === "active" ? "Active" : i.status === "fixed" ? "Fixed" : "Dismissed"} · ${i.reviewCount} linked review${i.reviewCount === 1 ? "" : "s"}`,
            href: `/dashboard/issues?issueId=${i.id}`,
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            highlight: true,
          }))
        );
      } catch {
        // Aborted or network error — keep whatever we had; nothing to action.
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [trimmed]);

  const pageHits: SearchResult[] = trimmed
    ? PAGES.filter(
        (p) =>
          p.title.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(trimmed.toLowerCase())
      )
    : PAGES.slice(0, 4);

  // Flat list drives keyboard nav; groups drive rendering.
  const groups: { label: string; items: SearchResult[] }[] = trimmed
    ? [
        { label: "Pages", items: pageHits },
        { label: "Reviews", items: reviewHits },
        { label: "Issues", items: issueHits },
      ].filter((g) => g.items.length > 0)
    : [{ label: "Pages", items: pageHits }];
  const results: SearchResult[] = groups.flatMap((g) => g.items);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    },
    [open, onOpenChange]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setReviewHits([]);
      setIssueHits([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keep the active row in range when results shrink (e.g. async hits land).
  useEffect(() => {
    setActiveIdx((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      navigate(results[activeIdx].href);
    }
  }

  if (!open) return null;

  const showSkeleton = searching && reviewHits.length === 0 && issueHits.length === 0;
  const noResults =
    trimmed.length > 0 && !searching && results.length === 0;

  // Running index across groups so keyboard nav maps onto rendered rows.
  let runningIdx = -1;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div className="relative mx-auto mt-[12vh] w-full max-w-xl px-4">
        <div className="relative rounded-2xl border border-border/60 bg-card/95 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Gradient edge glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--ring)/0.4),transparent)]"
          />

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-border/60">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
              onKeyDown={handleInputKey}
              placeholder="Search reviews, issues, pages…"
              className="flex-1 min-w-0 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 -mr-2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {noResults ? (
              <p className="py-8 px-4 text-center text-sm text-muted-foreground break-words">
                No results for &ldquo;{trimmed}&rdquo;
              </p>
            ) : (
              <>
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.label}
                    </p>
                    {group.items.map((result) => {
                      runningIdx++;
                      const i = runningIdx;
                      return (
                        <button
                          key={`${result.type}-${result.href}-${i}`}
                          onClick={() => navigate(result.href)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={cn(
                            "flex w-full min-h-[44px] items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            activeIdx === i ? "bg-accent/10" : "hover:bg-muted/40"
                          )}
                        >
                          <div className={cn(
                            "rounded-lg p-1.5 ring-1 ring-border/60 shrink-0",
                            result.type === "review"
                              ? "bg-amber-500/10"
                              : result.type === "issue"
                              ? "bg-destructive/10"
                              : "bg-muted/40",
                            activeIdx === i && "ring-accent/40"
                          )}>
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.highlight ? (
                                <Highlighted text={result.title} query={trimmed} />
                              ) : (
                                result.title
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.highlight ? (
                                <Highlighted text={result.subtitle} query={trimmed} />
                              ) : (
                                result.subtitle
                              )}
                            </p>
                          </div>
                          {result.rating != null && (
                            <span className="font-mono text-xs font-medium text-muted-foreground shrink-0">{result.rating}★</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {showSkeleton && (
                  <div className="px-4 py-2 space-y-2" aria-label="Searching…">
                    {[0, 1, 2].map((n) => (
                      <div key={n} className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-muted/50 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-1/3 rounded bg-muted/50 animate-pulse" />
                          <div className="h-2.5 w-2/3 rounded bg-muted/40 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 border-t border-border/60 bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 rounded bg-card border border-border/60 font-mono text-[10px]">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 rounded bg-card border border-border/60 font-mono text-[10px]">↵</kbd> open</span>
            <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 rounded bg-card border border-border/60 font-mono text-[10px]">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden sm:flex items-center gap-2 h-9 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm text-muted-foreground hover:bg-muted/50 hover:border-accent/30 transition-colors w-64"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 text-left text-xs">Search…</span>
      <kbd className="pointer-events-none inline-flex items-center gap-0.5 rounded border border-border/60 bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        <span className="text-[11px]">⌘</span>K
      </kbd>
    </button>
  );
}
