"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

interface UsageLimitModalProps {
 open: boolean;
 onClose: () => void;
 limitType?: "ai_replies" | "sms" | "connections";
 planName?: string;
 limit?: number;
 resetDate?: string;
 periodLabel?: string;
}

export function UsageLimitModal({
 open,
 onClose,
 limitType = "ai_replies",
 planName = "Free",
 limit,
 resetDate,
 periodLabel = "week",
}: UsageLimitModalProps) {
 const router = useRouter();

 if (!open) return null;

 const titles: Record<string, string> = {
 ai_replies: "AI Reply Limit Reached",
 sms: "SMS Limit Reached",
 connections: "Connection Limit Reached",
 };

 const bodies: Record<string, string> = {
 ai_replies: `You've used all ${limit ?? "your"} AI replies on your ${planName} plan this ${periodLabel}.`,
 sms: `You've reached your SMS limit on your ${planName} plan this ${periodLabel}.`,
 connections: `Your ${planName} plan allows ${limit ?? "a limited number of"} active connection(s).`,
 };

 const resetLabel = resetDate
 ? new Date(resetDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
 : null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 {/* Backdrop */}
 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

 {/* Modal */}
 <div className="relative z-10 bg-card border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
 <div className="flex flex-col items-center text-center gap-4">
 <div className="rounded-full bg-orange-100 dark:bg-orange-950/30 p-3">
 <AlertTriangle className="h-6 w-6 text-orange-500" />
 </div>

 <div>
 <h2 className="font-sans text- font-semibold tracking-tight">{titles[limitType]}</h2>
 <p className="text-sm text-muted-foreground mt-1">{bodies[limitType]}</p>
 </div>

 {resetLabel && limitType !== "connections" && (
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
 <RefreshCw className="h-3 w-3" />
 Resets on {resetLabel}
 </div>
 )}

 <div className="flex flex-col gap-2 w-full pt-1">
 <Button
 className="w-full"
 onClick={() => {
 onClose();
 router.push("/dashboard/settings/billing");
 }}
 >
 Upgrade Plan
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
 Close
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
}
