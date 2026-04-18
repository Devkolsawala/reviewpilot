"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2 } from "lucide-react";
import type { Review } from "@/types/review";

interface BulkReplyModalProps {
 open: boolean;
 onClose: () => void;
 reviews: Review[];
 onComplete?: () => void;
}

export function BulkReplyModal({ open, onClose, reviews, onComplete }: BulkReplyModalProps) {
 const [status, setStatus] = useState<"idle" | "generating" | "publishing" | "done">("idle");
 const [progress, setProgress] = useState(0);

 async function handleBulkReply() {
 setStatus("generating");
 for (let i = 0; i < reviews.length; i++) {
 setProgress(i + 1);
 // Generate reply for each review
 await fetch("/api/ai/generate-reply", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 review: {
 author_name: reviews[i].author_name,
 rating: reviews[i].rating,
 review_text: reviews[i].review_text,
 },
 source: reviews[i].source,
 }),
 });
 await new Promise((r) => setTimeout(r, 300));
 }
 setStatus("done");
 onComplete?.();
 }

 return (
 <Dialog open={open} onOpenChange={onClose}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Bot className="h-5 w-5 text-accent" />
 Bulk Reply
 </DialogTitle>
 <DialogDescription>
 Generate AI replies for {reviews.length} selected reviews.
 </DialogDescription>
 </DialogHeader>

 <div className="py-4">
 {status === "idle" && (
 <div className="text-center">
 <p className="text-sm text-muted-foreground mb-4">
 This will generate AI replies for all {reviews.length} pending reviews.
 You can review and edit each reply before publishing.
 </p>
 <div className="flex flex-wrap gap-1 justify-center">
 {reviews.slice(0, 5).map((r) => (
 <Badge key={r.id} variant="secondary" className="text-xs">
 {r.author_name}
 </Badge>
 ))}
 {reviews.length > 5 && (
 <Badge variant="secondary" className="text-xs">
 +{reviews.length - 5} more
 </Badge>
 )}
 </div>
 </div>
 )}

 {(status === "generating" || status === "publishing") && (
 <div className="text-center">
 <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
 <p className="text-sm font-medium">
 {status === "generating" ? "Generating replies" : "Publishing replies"}...
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 {progress}/{reviews.length} completed
 </p>
 <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
 <div
 className="h-full bg-accent rounded-full transition-all"
 style={{ width: `${(progress / reviews.length) * 100}%` }}
 />
 </div>
 </div>
 )}

 {status === "done" && (
 <div className="text-center">
 <div className="h-12 w-12 rounded-full bg-accent/10 dark:bg-accent/10 flex items-center justify-center mx-auto mb-4">
 <Send className="h-6 w-6 text-accent" />
 </div>
 <p className="text-sm font-medium">All replies generated!</p>
 <p className="text-xs text-muted-foreground mt-1">
 {reviews.length} replies are ready for review in your inbox.
 </p>
 </div>
 )}
 </div>

 <DialogFooter>
 {status === "idle" && (
 <>
 <Button variant="outline" onClick={onClose}>
 Cancel
 </Button>
 <Button onClick={handleBulkReply}>
 <Bot className="mr-2 h-4 w-4" />
 Generate All Replies
 </Button>
 </>
 )}
 {status === "done" && (
 <Button onClick={onClose}>Done</Button>
 )}
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
