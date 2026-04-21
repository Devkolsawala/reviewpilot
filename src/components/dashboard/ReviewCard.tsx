"use client";

import { Star, Globe, Smartphone, MessageCircle, Zap } from "lucide-react";

const WHATSAPP_GREEN = "#25D366";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import type { Review } from "@/types/review";

interface ReviewCardProps {
 review: Review;
 selected?: boolean;
 onClick?: () => void;
 compact?: boolean;
}

// Different color per first letter for avatar variety
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

// Per-star rating colors
function starColor(rating: number) {
 if (rating <= 1) return "fill-red-500 text-red-500";
 if (rating === 2) return "fill-orange-500 text-orange-500";
 if (rating === 3) return "fill-amber-500 text-amber-500";
 if (rating === 4) return "fill-lime-500 text-lime-500";
 return "fill-emerald-500 text-emerald-500";
}

const statusColor: Record<string, string> = {
 pending: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
 drafted: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
 approved: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
 published: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
 failed: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

const statusDot: Record<string, string> = {
 pending: "bg-orange-500",
 drafted: "bg-blue-500",
 published: "bg-green-500",
 failed: "bg-red-500",
};

export function ReviewCard({ review, selected, onClick, compact }: ReviewCardProps) {
 const initials = review.author_name
 .split(" ")
 .map((n) => n[0])
 .join("")
 .toUpperCase()
 .slice(0, 2);

 const firstLetter = review.author_name[0]?.toUpperCase() || "A";
 const avatarGradient = AVATAR_COLORS[firstLetter] || "from-[#6366f1] via-[#8b5cf6] to-[#d946ef]";

 return (
 <button
 onClick={onClick}
 className={cn(
 "w-full text-left p-4 border-b transition-all duration-150 group",
 "hover:bg-secondary/50 hover:shadow-md hover:scale-[1.01] hover:z-10 relative",
 selected && "bg-accent/10 dark:bg-accent/10 border-l-[3px] border-l-accent pl-[13px]",
 !selected && "border-l-[3px] border-l-transparent",
 !review.is_read && !selected && "bg-background"
 )}
 >
 <div className="flex items-start gap-3">
 <div
 className={cn(
 "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shrink-0",
 avatarGradient
 )}
 >
 {initials}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <span className={cn("text-sm truncate", !review.is_read ? "font-semibold" : "font-medium")}>
 {review.author_name}
 {review.source === "whatsapp" && review.author_id && (
 <span className="ml-1 font-normal text-xs text-muted-foreground font-mono">
 ({review.author_id})
 </span>
 )}
 </span>
 <div className="flex items-center gap-1.5 shrink-0">
 <span className={cn("h-2 w-2 rounded-full", statusDot[review.reply_status])} />
 <span className="text-[10px] text-muted-foreground whitespace-nowrap">
 {review.reply_status === "published" && review.reply_published_at
 ? `Replied ${timeAgo(review.reply_published_at)}`
 : timeAgo(review.review_created_at)}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-2 mt-1">
 {review.source === "whatsapp" || review.rating == null ? (
 <span className="text-[10px] text-muted-foreground">—</span>
 ) : (
 <div className="flex gap-0.5">
 {[1, 2, 3, 4, 5].map((i) => (
 <Star
 key={i}
 className={cn(
 "h-3 w-3",
 i <= (review.rating ?? 0) ? starColor(review.rating ?? 0) : "text-muted-foreground/20"
 )}
 />
 ))}
 </div>
 )}
 {review.source === "play_store" ? (
 <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
 <Smartphone className="h-2.5 w-2.5" /> Play Store
 </span>
 ) : review.source === "whatsapp" ? (
 <span
 className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[10px] font-medium text-white"
 style={{ backgroundColor: WHATSAPP_GREEN }}
 >
 <MessageCircle className="h-2.5 w-2.5" /> WhatsApp
 </span>
 ) : (
 <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
 <Globe className="h-2.5 w-2.5" /> Google
 </span>
 )}
 {review.source === "whatsapp" && review.skip_auto_reply && (
 <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
 Non-text
 </Badge>
 )}
 {!compact && (
 <Badge
 variant="secondary"
 className={cn("text-[10px] px-1.5 py-0 capitalize", statusColor[review.reply_status])}
 >
 {review.reply_status}
 </Badge>
 )}
 {review.is_auto_replied && (
 <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 dark:bg-accent/10 px-1.5 py-0 text-[10px] font-medium text-accent dark:text-accent">
 <Zap className="h-2.5 w-2.5" /> Auto
 </span>
 )}
 </div>
 <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
 {review.review_text}
 </p>
 </div>
 </div>
 </button>
 );
}
