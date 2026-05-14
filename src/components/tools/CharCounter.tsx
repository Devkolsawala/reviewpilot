"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Scissors,
  Languages,
  Copy,
  Check,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MAX = 350;
const AMBER_AT = 316;

type Tone = "Friendly" | "Professional" | "Apologetic" | "Confident";
const TONES: Tone[] = ["Friendly", "Professional", "Apologetic", "Confident"];

type TemplateKey =
  | "thanks"
  | "apology"
  | "bug"
  | "feature"
  | "blank";

const TEMPLATES: Record<TemplateKey, { label: string; body: string }> = {
  thanks: {
    label: "Thank you (5★)",
    body: "Thanks so much for the 5-star review! It really means a lot to our small team. We're glad the app is working well for you — please reach out at support if there's ever anything we can improve. Onwards!",
  },
  apology: {
    label: "Apology (1–2★)",
    body: "We're really sorry the experience didn't meet expectations — that's on us, and we want to make it right. Could you email support@yourapp.com with a quick description of what happened? We'll look into it personally and follow up with a fix.",
  },
  bug: {
    label: "Bug acknowledgement",
    body: "Thanks for flagging this — we've reproduced the issue and it's now in the next patch. If you can share your device model and Android version at support@yourapp.com, we'll prioritise it and send a heads up the moment the fix ships.",
  },
  feature: {
    label: "Feature request",
    body: "Appreciate the suggestion — that one comes up a lot and it's on the roadmap for the next two releases. We'll update this thread once it ships. In the meantime, anything else you'd like to see? We read every reply.",
  },
  blank: {
    label: "Blank",
    body: "",
  },
};

type AiKind = "polish" | "shorten" | "translate";
interface AiResult {
  id: string;
  kind: AiKind;
  label: string;
  text: string;
  charCount: number;
}

type Lang = "en" | "hi" | "hinglish";
const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  hi: "Hindi",
  hinglish: "Hinglish",
};

export function CharCounter() {
  const [text, setText] = useState(TEMPLATES.thanks.body);
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>("thanks");
  const [tone, setTone] = useState<Tone>("Professional");

  // debounced display count
  const [displayCount, setDisplayCount] = useState(text.length);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDisplayCount(text.length), 100);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text]);

  const [results, setResults] = useState<AiResult[]>([]);
  const [loading, setLoading] = useState<AiKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const tooLong = text.length > MAX;

  const counter = useMemo(() => {
    if (displayCount > MAX) {
      return {
        text: `${displayCount} / ${MAX} · ${displayCount - MAX} over`,
        color: "text-red-600 dark:text-red-400",
      };
    }
    if (displayCount >= AMBER_AT) {
      return {
        text: `${displayCount} / ${MAX}`,
        color: "text-amber-600 dark:text-amber-400",
      };
    }
    return {
      text: `${displayCount} / ${MAX}`,
      color: "text-emerald-600 dark:text-emerald-400",
    };
  }, [displayCount]);

  const handleTemplate = useCallback(
    (key: TemplateKey) => {
      if (key === activeTemplate) return;
      const incoming = TEMPLATES[key].body;
      if (
        text.trim() &&
        text !== TEMPLATES[activeTemplate].body &&
        !window.confirm(
          "Replace your current text with the template? Your changes will be lost."
        )
      ) {
        return;
      }
      setText(incoming);
      setActiveTemplate(key);
    },
    [activeTemplate, text]
  );

  const callApi = useCallback(
    async (kind: AiKind, body: Record<string, unknown>, label: string) => {
      setLoading(kind);
      setError(null);
      try {
        const res = await fetch(`/api/tools/${endpointFor(kind)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.message || "Something went wrong. Try again.");
          return;
        }
        setResults((prev) => {
          const next: AiResult = {
            id: `${kind}-${Date.now()}`,
            kind,
            label,
            text: data.result as string,
            charCount: data.charCount as number,
          };
          // keep latest 3
          return [next, ...prev].slice(0, 3);
        });
      } catch {
        setError("Network error. Try again.");
      } finally {
        setLoading(null);
      }
    },
    []
  );

  const handlePolish = () =>
    callApi("polish", { text, tone }, `Polished · ${tone}`);
  const handleShorten = () =>
    callApi("shorten", { text }, "Shortened to ≤350");
  const handleTranslate = (lang: Lang) =>
    callApi(
      "translate",
      { text, targetLang: lang },
      `Translated · ${LANG_LABELS[lang]}`
    );

  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      /* clipboard denied — silent */
    }
  };

  const handleUse = (value: string) => {
    setText(value);
    setActiveTemplate("blank");
  };

  const handleRegenerate = () => {
    const last = results[0];
    if (!last) return;
    if (last.kind === "polish") handlePolish();
    else if (last.kind === "shorten") handleShorten();
    else if (last.kind === "translate") {
      const lang = last.label.split("·")[1]?.trim().toLowerCase() as
        | "english"
        | "hindi"
        | "hinglish";
      const map: Record<string, Lang> = {
        english: "en",
        hindi: "hi",
        hinglish: "hinglish",
      };
      handleTranslate(map[lang] || "en");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm sm:p-7">
        {/* subtle gradient halo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-12 h-24 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(139,92,246,0.18),transparent_70%)]"
        />

        {/* Template tabs */}
        <Tabs
          value={activeTemplate}
          onValueChange={(v) => handleTemplate(v as TemplateKey)}
        >
          <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-transparent p-0">
            {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => (
              <TabsTrigger
                key={k}
                value={k}
                className={cn(
                  "rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all",
                  "data-[state=active]:border-transparent data-[state=active]:bg-[linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)] data-[state=active]:text-white data-[state=active]:shadow-sm"
                )}
              >
                {TEMPLATES[k].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Tone selector */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Tone
          </span>
          <div className="flex flex-wrap gap-1">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  tone === t
                    ? "border-transparent bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-white"
                    : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative mt-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            autoFocus
            placeholder="Paste or write your Play Store reply here…"
            aria-label="Play Store reply"
            className={cn(
              "min-h-[180px] resize-y rounded-xl border-border/60 bg-background/70 p-4 text-[15px] leading-relaxed transition-colors focus-visible:border-accent/50",
              tooLong && "border-red-400/60 focus-visible:border-red-500/60"
            )}
          />
          <div
            aria-live="polite"
            className={cn(
              "mt-2 flex items-center justify-end font-mono text-xs tabular-nums",
              counter.color
            )}
          >
            {counter.text}
          </div>
        </div>

        {/* Action row */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={handlePolish}
            disabled={loading !== null || text.trim().length < 5}
            variant="gradient"
            size="sm"
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {loading === "polish" ? "Polishing…" : "Polish with AI"}
          </Button>

          <Button
            onClick={handleShorten}
            disabled={loading !== null || !tooLong}
            variant="subtle"
            size="sm"
            className="gap-1.5"
            title={tooLong ? "" : "Only available when reply is over 350 chars"}
          >
            <Scissors className="h-3.5 w-3.5" />
            {loading === "shorten" ? "Shortening…" : "Shorten to fit"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="subtle"
                size="sm"
                disabled={loading !== null || text.trim().length < 5}
                className="gap-1.5"
              >
                <Languages className="h-3.5 w-3.5" />
                {loading === "translate" ? "Translating…" : "Translate"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleTranslate("en")}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTranslate("hi")}>
                Hindi (हिंदी)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTranslate("hinglish")}>
                Hinglish (Roman script)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {results.length > 0 && (
            <Button
              onClick={handleRegenerate}
              disabled={loading !== null}
              variant="ghost"
              size="sm"
              className="ml-auto gap-1.5 text-muted-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </div>

      {/* AI output history */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-sans text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
            AI versions
          </h2>
          {results.map((r) => {
            const over = r.charCount > MAX;
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur-sm sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className="gap-1 border-transparent bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-white"
                  >
                    <Wand2 className="h-3 w-3" />
                    {r.label}
                  </Badge>
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      over
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {r.charCount} / {MAX}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                  {r.text}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleCopy(r.id, r.text)}
                    size="sm"
                    variant="subtle"
                    className="gap-1.5"
                  >
                    {copiedId === r.id ? (
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
                    onClick={() => handleUse(r.text)}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Use this
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function endpointFor(kind: AiKind): string {
  if (kind === "polish") return "polish-reply";
  if (kind === "shorten") return "shorten-reply";
  return "translate-reply";
}
