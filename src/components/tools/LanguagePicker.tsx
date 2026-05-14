"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Languages, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  LANGUAGES,
  LANGUAGE_BY_CODE,
  type LanguageOption,
} from "@/lib/tools/languages";

interface LanguagePickerProps {
  value: string | null;
  onChange: (code: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function LanguagePicker({
  value,
  onChange,
  disabled,
  loading,
}: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const selected: LanguageOption | undefined = value
    ? LANGUAGE_BY_CODE[value]
    : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    return {
      indian: filtered.filter((l) => l.group === "indian"),
      global: filtered.filter((l) => l.group === "global"),
    };
  }, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus search shortly after popover opens.
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const flat = filtered;
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = flat[activeIndex];
      if (pick) {
        onChange(pick.code);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const triggerLabel = selected ? (
    <>
      <span className="text-base leading-none">{selected.flag}</span>
      <span>{selected.name}</span>
    </>
  ) : (
    <>
      <Languages className="h-3.5 w-3.5" />
      <span>{loading ? "Translating…" : "Translate"}</span>
    </>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="subtle"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
        >
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[320px] p-0 sm:w-[360px]"
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search 24 languages…"
            aria-label="Search languages"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-[280px] overflow-y-auto sm:max-h-[340px]">
          {flat.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No languages match &quot;{query}&quot;
            </p>
          ) : (
            <>
              {grouped.indian.length > 0 && (
                <Group
                  heading="Indian languages"
                  options={grouped.indian}
                  flat={flat}
                  activeIndex={activeIndex}
                  selectedCode={value}
                  onPick={(code) => {
                    onChange(code);
                    setOpen(false);
                  }}
                />
              )}
              {grouped.global.length > 0 && (
                <Group
                  heading="Global languages"
                  options={grouped.global}
                  flat={flat}
                  activeIndex={activeIndex}
                  selectedCode={value}
                  onPick={(code) => {
                    onChange(code);
                    setOpen(false);
                  }}
                />
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Group({
  heading,
  options,
  flat,
  activeIndex,
  selectedCode,
  onPick,
}: {
  heading: string;
  options: LanguageOption[];
  flat: LanguageOption[];
  activeIndex: number;
  selectedCode: string | null;
  onPick: (code: string) => void;
}) {
  return (
    <div className="py-1">
      <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {heading}
      </div>
      {options.map((opt) => {
        const flatIdx = flat.indexOf(opt);
        const isActive = flatIdx === activeIndex;
        const isSelected = selectedCode === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onMouseEnter={() => {
              /* arrow nav drives activeIndex; mouse hover relies on css */
            }}
            onClick={() => onPick(opt.code)}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
              isActive
                ? "bg-accent/15 text-foreground"
                : "text-foreground hover:bg-accent/10"
            )}
          >
            <span className="text-base leading-none">{opt.flag}</span>
            <span className="flex-1 truncate font-medium">{opt.name}</span>
            <span className="text-xs text-muted-foreground">
              {opt.nativeName}
            </span>
            {isSelected && (
              <Check className="h-3.5 w-3.5 text-foreground/70" />
            )}
          </button>
        );
      })}
    </div>
  );
}
