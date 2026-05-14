"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  History as HistoryIcon,
  Languages,
  Pencil,
  Scissors,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HistoryAction =
  | "polished"
  | "shortened"
  | "translated"
  | "edited";

export interface HistoryEntry {
  id: string;
  action: HistoryAction;
  tone?: string;
  lang?: string;
  text: string;
  charCount: number;
  createdAt: number;
}

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
}

const ICON_BY_ACTION: Record<HistoryAction, React.ReactNode> = {
  polished: <Sparkles className="h-3.5 w-3.5" />,
  shortened: <Scissors className="h-3.5 w-3.5" />,
  translated: <Languages className="h-3.5 w-3.5" />,
  edited: <Pencil className="h-3.5 w-3.5" />,
};

export function HistoryPanel({
  entries,
  onRestore,
  onClear,
}: HistoryPanelProps) {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent/5"
      >
        <span className="flex items-center gap-2 text-foreground/85">
          <HistoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">History</span>
          <span className="text-muted-foreground">
            · {entries.length} {entries.length === 1 ? "version" : "versions"}
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border/60">
          <ul className="divide-y divide-border/40">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="gap-1 border-border/60 bg-background/60 text-[11px]"
                    >
                      {ICON_BY_ACTION[e.action]}
                      {labelFor(e)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-[10px] tabular-nums",
                        e.charCount > 350
                          ? "border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-300"
                          : "border-border/60 bg-background/60 text-muted-foreground"
                      )}
                    >
                      {e.charCount} chars
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {relativeTime(e.createdAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {preview(e.text)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => onRestore(e)}
                  className="shrink-0"
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border/40 px-4 py-2 text-right">
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear history
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function labelFor(e: HistoryEntry): string {
  if (e.action === "polished")
    return e.tone ? `Polished (${e.tone})` : "Polished";
  if (e.action === "shortened") return "Shortened";
  if (e.action === "translated")
    return e.lang ? `Translated to ${e.lang}` : "Translated";
  return "Edited manually";
}

function preview(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > 80 ? flat.slice(0, 80) + "…" : flat;
}

function relativeTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
