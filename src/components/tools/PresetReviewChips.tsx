"use client";

import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRESETS_BY_PLATFORM,
  type ReplyPlatform,
  type ReplyPreset,
} from "@/lib/tools/replyPresets";

interface PresetReviewChipsProps {
  platform: ReplyPlatform;
  activeId: string | null;
  onPick: (preset: ReplyPreset) => void;
  onClear: () => void;
}

export function PresetReviewChips({
  platform,
  activeId,
  onPick,
  onClear,
}: PresetReviewChipsProps) {
  const presets = PRESETS_BY_PLATFORM[platform];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-accent/50 bg-accent/10 text-foreground"
                : "border-border/60 bg-background/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
            )}
          >
            <span className="font-mono text-amber-500" aria-hidden>
              {"★".repeat(p.suggestedRating)}
            </span>
            <span>{p.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onClear}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
          activeId === "custom"
            ? "border-accent/50 bg-accent/10 text-foreground"
            : "border-border/60 bg-background/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
        )}
      >
        <PenLine className="h-3 w-3" aria-hidden />
        Write your own
      </button>
    </div>
  );
}
