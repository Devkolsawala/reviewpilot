"use client";

import { Check, Copy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MotionProvider, m } from "@/components/motion/primitives";

export interface Variation {
  text: string;
  charCount: number;
}

const MAX = 350;

interface VariationCardsProps {
  variations: Variation[];
  actionLabel: string; // e.g. "Polished · Professional tone"
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onUse: (v: Variation) => void;
}

export function VariationCards({
  variations,
  actionLabel,
  copiedKey,
  onCopy,
  onUse,
}: VariationCardsProps) {
  if (variations.length === 0) return null;

  return (
    <MotionProvider>
      <div className="space-y-3">
        <h2 className="font-sans text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
          AI versions
        </h2>
        <div
          className={cn(
            "grid gap-3",
            variations.length === 1
              ? "grid-cols-1"
              : variations.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 lg:grid-cols-3"
          )}
        >
          {variations.map((v, i) => {
            const key = `${i}-${v.charCount}`;
            const over = v.charCount > MAX;
            return (
              <m.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  ease: "easeOut",
                  delay: i * 0.05,
                }}
                className={cn(
                  "group relative flex flex-col rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur-sm transition-shadow",
                  "hover:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_8px_24px_-12px_rgba(139,92,246,0.45)]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant="secondary"
                      className="w-fit gap-1 border-transparent bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-white"
                    >
                      <Wand2 className="h-3 w-3" />
                      Option {i + 1}
                    </Badge>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {actionLabel}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      over
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {v.charCount} / {MAX}
                  </span>
                </div>

                <p className="mt-3 flex-1 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                  {v.text}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => onCopy(key, v.text)}
                    size="sm"
                    variant="subtle"
                    className="gap-1.5"
                  >
                    {copiedKey === key ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => onUse(v)}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Use this
                  </Button>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </MotionProvider>
  );
}
