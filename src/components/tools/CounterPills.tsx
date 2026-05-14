"use client";

import { useMemo } from "react";
import { Link2, Phone, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  countChars,
  countWords,
  countEmojis,
  countSentences,
  detectUrls,
  detectPhones,
  detectGenericPhrases,
} from "@/lib/tools/textStats";

interface CounterPillsProps {
  text: string;
  max?: number;
}

const MAX_DEFAULT = 350;
const AMBER_AT = 316;

export function CounterPills({ text, max = MAX_DEFAULT }: CounterPillsProps) {
  const stats = useMemo(() => {
    const chars = countChars(text);
    return {
      chars,
      words: countWords(text),
      emojis: countEmojis(text),
      sentences: countSentences(text),
      hasUrl: detectUrls(text),
      hasPhone: detectPhones(text),
      generic: detectGenericPhrases(text),
    };
  }, [text]);

  const charColor =
    stats.chars > max
      ? "border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-300"
      : stats.chars >= AMBER_AT
        ? "border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

  const charLabel =
    stats.chars > max
      ? `${stats.chars} / ${max} · ${stats.chars - max} over`
      : `${stats.chars} / ${max}`;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        aria-live="polite"
        className="mt-2 flex flex-wrap items-center justify-end gap-1.5"
      >
        <Badge
          variant="outline"
          className={cn("font-mono text-[11px] tabular-nums", charColor)}
        >
          {charLabel}
        </Badge>
        <Badge
          variant="outline"
          className="border-border/60 bg-background/60 font-mono text-[11px] tabular-nums text-muted-foreground"
        >
          {stats.words} words
        </Badge>
        {stats.emojis > 0 && (
          <Badge
            variant="outline"
            className="border-border/60 bg-background/60 font-mono text-[11px] tabular-nums text-muted-foreground"
          >
            {stats.emojis} {stats.emojis === 1 ? "emoji" : "emojis"}
          </Badge>
        )}
        <Badge
          variant="outline"
          className="border-border/60 bg-background/60 font-mono text-[11px] tabular-nums text-muted-foreground"
        >
          {stats.sentences} {stats.sentences === 1 ? "sentence" : "sentences"}
        </Badge>

        {stats.hasUrl && (
          <WarningPill
            icon={<Link2 className="h-3 w-3" />}
            label="URL detected"
            tip="Play Store strips clickable URLs from developer replies. Consider mentioning your support email or in-app help instead."
          />
        )}
        {stats.hasPhone && (
          <WarningPill
            icon={<Phone className="h-3 w-3" />}
            label="Phone number detected"
            tip="Phone numbers can look like spam in replies. Direct users to your in-app support flow."
          />
        )}
        {stats.generic.count >= 3 && (
          <WarningPill
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Generic phrasing"
            tip="Generic replies hurt your reply rate's effect on ranking. Try mentioning a specific detail from the review."
          />
        )}
      </div>
    </TooltipProvider>
  );
}

function WarningPill({
  icon,
  label,
  tip,
}: {
  icon: React.ReactNode;
  label: string;
  tip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="gap-1 border-amber-400/40 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-300"
        >
          {icon}
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px]">{tip}</TooltipContent>
    </Tooltip>
  );
}
