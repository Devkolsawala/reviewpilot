"use client";

import { cn } from "@/lib/utils";
import { PLATFORM_META, type ReplyPlatform } from "@/lib/tools/replyPresets";

interface PlatformToggleProps {
  value: ReplyPlatform;
  onChange: (next: ReplyPlatform) => void;
  disabled?: boolean;
}

const ORDER: ReplyPlatform[] = ["play-store", "gbp", "other"];

export function PlatformToggle({
  value,
  onChange,
  disabled,
}: PlatformToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Review platform"
      className="inline-flex flex-wrap gap-1 rounded-full border border-border/60 bg-background/60 p-1 backdrop-blur-sm"
    >
      {ORDER.map((p) => {
        const meta = PLATFORM_META[p];
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(p)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              disabled && "opacity-50"
            )}
          >
            <span aria-hidden>{meta.icon}</span>
            <span>{meta.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-mono tabular-nums",
                active
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {meta.charLimit}
            </span>
          </button>
        );
      })}
    </div>
  );
}
