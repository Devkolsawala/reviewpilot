"use client";

/**
 * TopBar notification bell — real feed backed by /api/notifications.
 *
 * Desktop (≥640px): dropdown panel. Mobile (<640px): full-width bottom sheet
 * with ≥44px touch targets. Unread count polls a count-only endpoint every
 * 60s; the list itself is fetched lazily on open with cursor pagination.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  Gauge,
  Mail,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COUNT_POLL_MS = 60_000;
const PAGE_SIZE = 20;

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  review_id: string | null;
  read_at: string | null;
  created_at: string;
};

const TYPE_STYLES: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  negative_review: { icon: Star, color: "text-red-500", bg: "bg-red-500/10" },
  recovery: { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  issue_created: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  sync_failure: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
  quota_warning: { icon: Gauge, color: "text-amber-500", bg: "bg-amber-500/10" },
  digest_sent: { icon: Mail, color: "text-accent", bg: "bg-accent/10" },
};

function typeStyle(type: string) {
  return TYPE_STYLES[type] ?? { icon: Bell, color: "text-muted-foreground", bg: "bg-muted/40" };
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadedOnce = useRef(false);

  // Tailwind sm breakpoint — below it the dropdown becomes a bottom sheet.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Cheap unread-count poll.
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/notifications?countOnly=true", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnreadCount(data.unreadCount ?? 0);
      } catch {
        /* silent — badge just stays stale until the next tick */
      }
    }
    poll();
    const id = setInterval(poll, COUNT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const loadPage = useCallback(async (cursor: string | null) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/notifications?${params}`, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    return (await res.json()) as {
      notifications: NotificationRow[];
      nextCursor: string | null;
      unreadCount: number;
    };
  }, []);

  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadPage(null);
      setItems(data.notifications);
      setNextCursor(data.nextCursor);
      setUnreadCount(data.unreadCount);
      loadedOnce.current = true;
    } catch {
      /* keep whatever we had */
    } finally {
      setLoading(false);
    }
  }, [loadPage]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await loadPage(nextCursor);
      setItems((prev) => [...prev, ...data.notifications]);
      setNextCursor(data.nextCursor);
    } catch {
      /* leave the button enabled for a retry */
    } finally {
      setLoadingMore(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) refreshList();
  }

  async function markRead(ids: string[]) {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    } catch {
      /* optimistic UI already updated; next poll corrects drift */
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      /* next poll corrects drift */
    }
  }

  function handleItemClick(n: NotificationRow) {
    if (!n.read_at) {
      setItems((prev) =>
        prev.map((it) => (it.id === n.id ? { ...it, read_at: new Date().toISOString() } : it))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      void markRead([n.id]);
    }
    setOpen(false);
    router.push(n.href || "/dashboard/inbox");
  }

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9"
      aria-label="Notifications"
      onClick={isMobile ? () => handleOpenChange(true) : undefined}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-accent-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );

  const header = (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="font-sans text-sm font-semibold tracking-tight">Notifications</span>
      {unreadCount > 0 && (
        <button
          onClick={markAllRead}
          className="flex min-h-[44px] items-center gap-1 px-1 text-[11px] text-accent hover:underline sm:min-h-[32px]"
        >
          <Check className="h-3 w-3" /> Mark all read
        </button>
      )}
    </div>
  );

  const emptyState = (
    <div className="py-8 px-3 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted/40">
        <Bell className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <p className="text-xs font-medium text-foreground/80">No notifications yet</p>
      <p className="mt-1 text-[11px] text-muted-foreground/70">
        We&apos;ll let you know about new reviews and AI activity here.
      </p>
    </div>
  );

  const list = (
    <>
      {loading && !loadedOnce.current ? (
        <div className="py-8 text-center text-xs text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        emptyState
      ) : (
        <div className="max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain">
          {items.map((n) => {
            const style = typeStyle(n.type);
            const Icon = style.icon;
            const unread = !n.read_at;
            return (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className="flex w-full min-h-[44px] items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
              >
                <div className={cn("mt-0.5 shrink-0 rounded-lg p-1.5", style.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", style.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-xs leading-snug",
                      unread ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground/80">
                      {n.body}
                    </p>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {relativeTime(n.created_at)}
                  </span>
                </div>
                {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </button>
            );
          })}
          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full min-h-[44px] py-2.5 text-center text-[11px] font-medium text-accent hover:bg-muted/40 disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="rounded-t-xl border-border/60 p-0 pb-[env(safe-area-inset-bottom)]">
            <SheetTitle className="sr-only">Notifications</SheetTitle>
            {/* pr-10 keeps the header clear of the sheet's built-in close X */}
            <div className="pt-2 pr-10">{header}</div>
            <div className="border-t border-border/60">{list}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl border-border/60 p-0">
        <div className="pt-1">{header}</div>
        <DropdownMenuSeparator className="my-0 bg-border/60" />
        {list}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
