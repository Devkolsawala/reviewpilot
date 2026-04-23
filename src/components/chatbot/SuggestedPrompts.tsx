"use client";

export const SUGGESTED_PROMPTS = [
  "What does ReviewPilot do?",
  "Pricing plans",
  "How do I get started?",
  "Supported platforms",
];

export function SuggestedPrompts({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_PROMPTS.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 dark:hover:bg-brand-950/40 dark:hover:text-brand-200"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
