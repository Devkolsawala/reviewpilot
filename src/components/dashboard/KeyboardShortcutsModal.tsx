"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Shortcut {
  keys: string[];
  label: string;
  group: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { group: "Navigation", keys: ["⌘", "K"], label: "Open global search" },
  { group: "Navigation", keys: ["J"], label: "Next review in list" },
  { group: "Navigation", keys: ["K"], label: "Previous review in list" },
  { group: "Navigation", keys: ["Esc"], label: "Close modal / deselect" },
  // Review actions
  { group: "Review Actions", keys: ["R"], label: "Generate AI reply" },
  { group: "Review Actions", keys: ["⌘", "↵"], label: "Publish reply" },
  // App
  { group: "App", keys: ["?"], label: "Show keyboard shortcuts" },
  { group: "App", keys: ["⌘", "/"], label: "Show keyboard shortcuts" },
];

const GROUPS = SHORTCUTS.reduce<string[]>((acc, s) => {
  if (!acc.includes(s.group)) acc.push(s.group);
  return acc;
}, []);

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "?" || (e.key === "/" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-md"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div>
            <h2 className="font-sans text-base font-semibold tracking-tight">Keyboard shortcuts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Move faster without touching the mouse</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {GROUPS.map((group) => (
            <div key={group}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 px-1">
                {group}
              </p>
              <div className="space-y-1">
                {SHORTCUTS.filter((s) => s.group === group).map((shortcut) => (
                  <div
                    key={shortcut.label + shortcut.keys.join("")}
                    className="flex items-center justify-between rounded-lg hover:bg-muted/40 px-3 py-2 transition-colors"
                  >
                    <span className="text-sm text-foreground/85">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          <kbd className="inline-flex items-center justify-center rounded bg-muted/60 border border-border/60 px-1.5 py-0.5 text-[11px] font-mono font-medium min-w-[22px] text-foreground">
                            {k}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-[10px] text-muted-foreground/60">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/60 bg-muted/20 text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-card border border-border/60 text-[10px] font-mono">Esc</kbd> or{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-card border border-border/60 text-[10px] font-mono">?</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

// Standalone trigger — can be used in Sidebar footer
export function ShortcutsHintButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors w-full px-3 py-1.5"
    >
      Press{" "}
      <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[10px] font-mono">?</kbd>{" "}
      for shortcuts
    </button>
  );
}
