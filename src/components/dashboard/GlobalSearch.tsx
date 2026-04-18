"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, MessageSquare, BarChart3, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_REVIEWS } from "@/lib/mock-data";

interface SearchResult {
  type: "review" | "page";
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  rating?: number;
}

const PAGES: SearchResult[] = [
  { type: "page", title: "Review Inbox", subtitle: "Manage and reply to reviews", href: "/dashboard/inbox", icon: <MessageSquare className="h-4 w-4" /> },
  { type: "page", title: "Analytics", subtitle: "View rating trends and insights", href: "/dashboard/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { type: "page", title: "Settings", subtitle: "Configure your account", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" /> },
  { type: "page", title: "AI Configuration", subtitle: "Set up AI reply preferences", href: "/dashboard/settings/ai-config", icon: <Settings className="h-4 w-4" /> },
  { type: "page", title: "Connections", subtitle: "Connect review sources", href: "/dashboard/settings/connections", icon: <Settings className="h-4 w-4" /> },
  { type: "page", title: "Billing", subtitle: "Manage your subscription", href: "/dashboard/settings/billing", icon: <Settings className="h-4 w-4" /> },
];

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const setOpen = onOpenChange;

  const results: SearchResult[] = query.trim()
    ? [
        ...PAGES.filter(
          (p) =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.subtitle.toLowerCase().includes(query.toLowerCase())
        ),
        ...MOCK_REVIEWS.filter(
          (r) =>
            r.author_name.toLowerCase().includes(query.toLowerCase()) ||
            r.review_text.toLowerCase().includes(query.toLowerCase())
        )
          .slice(0, 5)
          .map((r) => ({
            type: "review" as const,
            title: r.author_name,
            subtitle: r.review_text.slice(0, 80) + "...",
            href: "/dashboard/inbox",
            icon: <Star className={cn("h-4 w-4", r.rating >= 4 ? "text-accent" : r.rating <= 2 ? "text-destructive" : "text-amber-500")} />,
            rating: r.rating,
          })),
      ]
    : PAGES.slice(0, 4);

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
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

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
              placeholder="Search reviews, pages…"
              className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No results found</p>
            ) : (
              results.map((result, i) => (
                <button
                  key={`${result.type}-${result.title}-${i}`}
                  onClick={() => navigate(result.href)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    activeIdx === i ? "bg-accent/10" : "hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "rounded-lg p-1.5 ring-1 ring-border/60",
                    result.type === "review" ? "bg-amber-500/10" : "bg-muted/40",
                    activeIdx === i && "ring-accent/40"
                  )}>
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  {result.rating && (
                    <span className="font-mono text-xs font-medium text-muted-foreground">{result.rating}★</span>
                  )}
                </button>
              ))
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
