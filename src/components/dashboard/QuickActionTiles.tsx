"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickActionTile {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Tailwind color hint for the icon square (default: accent). */
  tone?: "accent" | "purple" | "blue" | "amber" | "emerald";
  /** Optional small badge in the top-right of the tile. */
  badge?: { label: string; tone: "amber" | "accent" | "muted" };
}

const TONE_SQUARE: Record<NonNullable<QuickActionTile["tone"]>, string> = {
  accent: "bg-accent/10 text-accent ring-accent/20",
  purple: "bg-purple-50 text-purple-500 ring-purple-500/20 dark:bg-purple-950/30",
  blue: "bg-blue-50 text-blue-500 ring-blue-500/20 dark:bg-blue-950/30",
  amber: "bg-amber-50 text-amber-500 ring-amber-500/20 dark:bg-amber-950/30",
  emerald: "bg-emerald-50 text-emerald-500 ring-emerald-500/20 dark:bg-emerald-950/30",
};

const BADGE_TONE: Record<NonNullable<QuickActionTile["badge"]>["tone"], string> = {
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  accent: "bg-accent/15 text-accent",
  muted: "bg-muted/60 text-muted-foreground",
};

export function QuickActionTiles({ tiles }: { tiles: QuickActionTile[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tiles.map((tile) => {
        const tone = tile.tone ?? "accent";
        return (
          <Link
            key={tile.label}
            href={tile.href}
            className={cn(
              "group relative overflow-hidden rounded-xl p-[1px] transition-all duration-200",
              // Gradient border on hover
              "bg-border/60 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.5),rgba(217,70,239,0.5))]",
              "hover:-translate-y-px"
            )}
          >
            <div className="relative flex h-full flex-col gap-2 rounded-[11px] bg-card p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset transition-transform group-hover:scale-105",
                    TONE_SQUARE[tone]
                  )}
                  aria-hidden
                >
                  <tile.icon className="h-4 w-4" />
                </div>
                {tile.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      BADGE_TONE[tile.badge.tone]
                    )}
                  >
                    {tile.badge.label}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  {tile.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                  {tile.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
