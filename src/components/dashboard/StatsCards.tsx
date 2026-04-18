"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare, Clock, TrendingUp, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
 totalReviews: number;
 avgRating: number;
 responseRate: number;
 pendingCount: number;
}

export function StatsCards({ totalReviews, avgRating, responseRate, pendingCount }: StatsCardsProps) {
 return (
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 {/* Total Reviews */}
 <Card className="relative overflow-hidden">
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
 <div className="rounded-lg p-2 bg-accent/10 dark:bg-accent/10">
 <MessageSquare className="h-4 w-4 text-accent" />
 </div>
 </div>
 <div className="flex items-end gap-2">
 <AnimatedCounter value={totalReviews} className="text-3xl font-bold font-sans tracking-tight" />
 <span className="flex items-center text-xs font-medium text-green-600 mb-1">
 <ArrowUpRight className="h-3 w-3" /> 12%
 </span>
 </div>
 <p className="mt-1.5 text-xs text-muted-foreground">Last 30 days</p>
 {/* Mini sparkline */}
 <div className="flex items-end gap-[3px] mt-3 h-8">
 {[4, 6, 5, 8, 7, 9, 6, 8, 10, 7, 9, 11].map((v, i) => (
 <div
 key={i}
 className="flex-1 rounded-sm bg-accent/10 dark:bg-accent/10"
 style={{ height: `${(v / 11) * 100}%` }}
 />
 ))}
 </div>
 </CardContent>
 </Card>

 {/* Average Rating */}
 <Card className="relative overflow-hidden">
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
 <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
 <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
 </div>
 </div>
 <div className="flex items-end gap-2">
 <AnimatedCounter value={avgRating} decimals={1} className="text-3xl font-bold font-sans tracking-tight" />
 <div className="flex gap-0.5 mb-1.5">
 {[1, 2, 3, 4, 5].map((s) => (
 <Star
 key={s}
 className={cn(
 "h-3 w-3",
 s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
 )}
 />
 ))}
 </div>
 </div>
 <div className="flex items-center gap-1 mt-1.5">
 <span className="flex items-center text-xs font-medium text-green-600">
 <ArrowUpRight className="h-3 w-3" /> 0.3
 </span>
 <span className="text-xs text-muted-foreground">vs last month</span>
 </div>
 </CardContent>
 </Card>

 {/* Response Rate */}
 <Card className="relative overflow-hidden">
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
 <div className="rounded-lg p-2 bg-green-50 dark:bg-green-950/30">
 <TrendingUp className="h-4 w-4 text-green-500" />
 </div>
 </div>
 <div className="flex items-center gap-4">
 <ProgressRing value={responseRate} size={52} strokeWidth={5} />
 <div>
 <AnimatedCounter value={responseRate} suffix="%" className="text-3xl font-bold font-sans tracking-tight" />
 <p className="text-xs text-muted-foreground mt-0.5">Industry avg: 25%</p>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Pending Replies */}
 <Card className="relative overflow-hidden">
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <p className="text-sm font-medium text-muted-foreground">Awaiting Reply</p>
 <div className={cn(
 "rounded-lg p-2",
 pendingCount > 0
 ? "bg-orange-50 dark:bg-orange-950/30"
 : "bg-green-50 dark:bg-green-950/30"
 )}>
 {pendingCount > 0 ? (
 <Clock className="h-4 w-4 text-orange-500" />
 ) : (
 <CheckCircle2 className="h-4 w-4 text-green-500" />
 )}
 </div>
 </div>
 <div className="flex items-end gap-2">
 <AnimatedCounter value={pendingCount} className="text-3xl font-bold font-sans tracking-tight" />
 {pendingCount > 0 && (
 <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-400 mb-1">
 Needs attention
 </span>
 )}
 {pendingCount === 0 && (
 <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-950/40 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 mb-1">
 All caught up!
 </span>
 )}
 </div>
 <p className="mt-1.5 text-xs text-muted-foreground">
 {pendingCount > 0 ? "Reply to keep your response rate high" : "Great job keeping up!"}
 </p>
 </CardContent>
 </Card>
 </div>
 );
}
