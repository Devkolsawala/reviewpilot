"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Star, Check, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "general", label: "General Feedback" },
  { value: "praise", label: "Praise" },
] as const;

type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"];

export function FeedbackDialog({ collapsed }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("general");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  const reset = () => {
    setType("general");
    setRating(0);
    setHoverRating(0);
    setMessage("");
    setStatus("idle");
  };

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      toast({ title: "Too short", description: "Please write at least 10 characters.", variant: "destructive" });
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rating: rating || undefined, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to send feedback", variant: "destructive" });
        setStatus("idle");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 2000);
    } catch {
      toast({ title: "Error", description: "Failed to send feedback. Please try again.", variant: "destructive" });
      setStatus("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {collapsed ? (
          <button
            className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Share Feedback"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        ) : (
          <button className="flex items-center gap-2 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors w-full px-3 py-1.5">
            <MessageSquare className="h-3 w-3" />
            Share Feedback
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="h-12 w-12 rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] ring-1 ring-accent/30 flex items-center justify-center">
              <Check className="h-6 w-6 text-accent" />
            </div>
            <p className="text-sm font-medium">Thank you! We&apos;ve received your feedback.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-sans text-lg font-semibold tracking-tight">Share your feedback about ReviewPilot</DialogTitle>
              <p className="text-sm text-muted-foreground">Help us improve — we read every message</p>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Type selector */}
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                      type === t.value
                        ? "bg-accent/10 border-accent/40 text-accent"
                        : "border-border/60 text-muted-foreground hover:border-accent/30 hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Rating */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">How would you rate ReviewPilot? (optional)</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star === rating ? 0 : star)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5 transition-colors",
                          (hoverRating || rating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <Textarea
                placeholder="Tell us what's on your mind..."
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setMessage(e.target.value);
                }}
                rows={4}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{message.length}/500</span>
                <Button
                  onClick={handleSubmit}
                  disabled={status === "sending" || message.trim().length < 10}
                  variant="gradient"
                  size="sm"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Feedback"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
