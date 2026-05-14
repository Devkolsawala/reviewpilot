"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ReviewAnalysis {
  ratingGuess: number;
  type: string;
  sentiment: string;
  summary: string;
}

interface ReviewContextInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (next: string) => void;
}

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  bug: { emoji: "🐞", label: "Bug report" },
  feature: { emoji: "💡", label: "Feature request" },
  praise: { emoji: "💛", label: "Praise" },
  complaint: { emoji: "⚠️", label: "Complaint" },
  mixed: { emoji: "🤔", label: "Mixed feedback" },
};

export function ReviewContextInput({
  open,
  onOpenChange,
  value,
  onChange,
}: ReviewContextInputProps) {
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnalyzedRef = useRef<string>("");

  // Debounced auto-analysis
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 10) {
      setAnalysis(null);
      return;
    }
    if (trimmed === lastAnalyzedRef.current) return;

    debounceRef.current = setTimeout(async () => {
      setAnalyzing(true);
      try {
        const res = await fetch("/api/tools/analyze-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });
        const data = await res.json();
        if (res.ok && data && typeof data.ratingGuess === "number") {
          setAnalysis(data as ReviewAnalysis);
          lastAnalyzedRef.current = trimmed;
        } else {
          setAnalysis(null);
        }
      } catch {
        setAnalysis(null);
      } finally {
        setAnalyzing(false);
      }
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/70 bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors",
          "hover:border-accent/50 hover:text-foreground"
        )}
      >
        <Plus className="h-3 w-3" />
        Paste the original review for smarter AI replies
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Original review (optional)
        </span>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Collapse review context"
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Paste the customer's Play Store review here (optional)…"
        aria-label="Original review text"
        className="resize-y rounded-lg border-border/60 bg-background/60 p-3 text-[14px] leading-relaxed"
      />

      <div className="mt-2 min-h-[24px]">
        {value.trim().length < 10 ? (
          <p className="text-xs text-muted-foreground">
            We&apos;ll detect rating intent, review type, and sentiment.
          </p>
        ) : analyzing && !analysis ? (
          <p className="text-xs text-muted-foreground">Analyzing…</p>
        ) : analysis ? (
          <Chips analysis={analysis} />
        ) : (
          <p className="text-xs text-muted-foreground">
            Couldn&apos;t classify this review — replies will still use the
            text as context.
          </p>
        )}
      </div>
    </div>
  );
}

function Chips({ analysis }: { analysis: ReviewAnalysis }) {
  const typeMeta = TYPE_META[analysis.type] ?? {
    emoji: "•",
    label: analysis.type,
  };

  const ratingColor =
    analysis.ratingGuess <= 2
      ? "border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-300"
      : analysis.ratingGuess === 3
        ? "border-border/60 bg-background/60 text-muted-foreground"
        : "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

  const sentColor =
    analysis.sentiment === "negative"
      ? "border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-300"
      : analysis.sentiment === "positive"
        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : "border-border/60 bg-background/60 text-muted-foreground";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className={cn("gap-1", ratingColor)}>
        ⭐ Likely {analysis.ratingGuess}-star
      </Badge>
      <Badge
        variant="outline"
        className="gap-1 border-border/60 bg-background/60 text-foreground/80"
      >
        <span>{typeMeta.emoji}</span>
        {typeMeta.label}
      </Badge>
      <Badge variant="outline" className={cn("gap-1", sentColor)}>
        Sentiment:{" "}
        {analysis.sentiment.charAt(0).toUpperCase() +
          analysis.sentiment.slice(1)}
      </Badge>
      {analysis.summary && (
        <span className="ml-1 text-[11px] text-muted-foreground">
          &ldquo;{analysis.summary}&rdquo;
        </span>
      )}
    </div>
  );
}
