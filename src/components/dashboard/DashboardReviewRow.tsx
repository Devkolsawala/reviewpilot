"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Smartphone,
  Globe,
  MessageCircle,
  MoreHorizontal,
  ExternalLink,
  Reply,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, timeAgo } from "@/lib/utils";
import type { Review } from "@/types/review";

const WHATSAPP_GREEN = "#25D366";

// First-letter avatar palette (kept consistent with ReviewCard for visual continuity)
const AVATAR_COLORS: Record<string, string> = {
  A: "from-rose-400 to-rose-500",
  B: "from-orange-400 to-orange-500",
  C: "from-amber-400 to-amber-500",
  D: "from-emerald-400 to-emerald-500",
  E: "from-[#6366f1] via-[#8b5cf6] to-[#d946ef]",
  F: "from-cyan-400 to-cyan-500",
  G: "from-sky-400 to-sky-500",
  H: "from-blue-400 to-blue-500",
  I: "from-indigo-400 to-indigo-500",
  J: "from-violet-400 to-violet-500",
  K: "from-purple-400 to-purple-500",
  L: "from-fuchsia-400 to-fuchsia-500",
  M: "from-pink-400 to-pink-500",
  N: "from-rose-400 to-rose-500",
  O: "from-orange-400 to-orange-500",
  P: "from-[#6366f1] via-[#8b5cf6] to-[#d946ef]",
  Q: "from-blue-400 to-blue-500",
  R: "from-indigo-400 to-indigo-500",
  S: "from-emerald-400 to-emerald-500",
  T: "from-amber-400 to-amber-500",
  U: "from-cyan-400 to-cyan-500",
  V: "from-sky-400 to-sky-500",
  W: "from-violet-400 to-violet-500",
  X: "from-purple-400 to-purple-500",
  Y: "from-fuchsia-400 to-fuchsia-500",
  Z: "from-pink-400 to-pink-500",
};

// Star color scales with sentiment: 1★ rose → 2★ orange → 3★ amber → 4★ lime → 5★ emerald
function starColor(rating: number) {
  if (rating <= 1) return "fill-rose-500 text-rose-500";
  if (rating === 2) return "fill-orange-500 text-orange-500";
  if (rating === 3) return "fill-amber-500 text-amber-500";
  if (rating === 4) return "fill-lime-500 text-lime-500";
  return "fill-emerald-500 text-emerald-500";
}

const STATUS_STYLES: Record<
  string,
  { dot: string; chip: string; label: string }
> = {
  pending: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-amber-500/20",
    label: "Pending",
  },
  drafted: {
    dot: "bg-blue-500",
    chip: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ring-blue-500/20",
    label: "Drafted",
  },
  published: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-emerald-500/20",
    label: "Published",
  },
  failed: {
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 ring-rose-500/20",
    label: "Failed",
  },
};

function SourceBadge({ source }: { source: Review["source"] }) {
  if (source === "play_store") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Smartphone className="h-2.5 w-2.5" />
        Play Store
      </span>
    );
  }
  if (source === "whatsapp") {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
        style={{ backgroundColor: WHATSAPP_GREEN }}
      >
        <MessageCircle className="h-2.5 w-2.5" /> WhatsApp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Globe className="h-2.5 w-2.5" />
      Google
    </span>
  );
}

export function DashboardReviewRow({ review }: { review: Review }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials =
    review.author_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  const firstLetter = review.author_name[0]?.toUpperCase() || "A";
  const avatarGradient = AVATAR_COLORS[firstLetter] || "from-[#6366f1] via-[#8b5cf6] to-[#d946ef]";
  const status = STATUS_STYLES[review.reply_status] ?? STATUS_STYLES.pending;
  const isPublished = review.reply_status === "published";

  function openInInbox() {
    router.push(`/dashboard/inbox?review=${encodeURIComponent(review.id)}`);
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openInInbox}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openInInbox();
        }
      }}
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3 border-b border-border/60 cursor-pointer transition-colors",
        "hover:bg-muted/40 focus-visible:bg-muted/40 outline-none last:border-b-0"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[11px] font-bold",
          avatarGradient
        )}
        aria-hidden
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{review.author_name}</span>
          <SourceBadge source={review.source} />
          {review.source !== "whatsapp" && review.rating != null && (
            <div className="flex gap-0.5 shrink-0" aria-label={`${review.rating} stars`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i <= (review.rating ?? 0)
                      ? starColor(review.rating ?? 0)
                      : "text-muted-foreground/20"
                  )}
                  aria-hidden
                />
              ))}
            </div>
          )}
        </div>
        {review.review_text && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1 leading-snug">
            {review.review_text}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
            status.chip
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {isPublished && review.reply_published_at
            ? `Replied ${timeAgo(review.reply_published_at)}`
            : status.label}
        </span>
        <span className="text-[10px] text-muted-foreground/70 font-mono tabular-nums hidden md:inline">
          {timeAgo(review.review_created_at)}
        </span>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 transition-all",
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-muted/60 hover:text-foreground",
                menuOpen && "opacity-100 bg-muted/60 text-foreground"
              )}
              aria-label="Review actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/60">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openInInbox();
              }}
            >
              <Reply className="mr-2 h-4 w-4" />
              {isPublished ? "View reply" : "Reply"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/inbox?review=${encodeURIComponent(review.id)}`);
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Inbox
            </DropdownMenuItem>
            {!isPublished && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openInInbox();
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark as read
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
