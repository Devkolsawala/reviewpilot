"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Scissors, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CounterPills } from "./CounterPills";
import { LanguagePicker } from "./LanguagePicker";
import {
  ReviewContextInput,
} from "./ReviewContextInput";
import { VariationCards, type Variation } from "./VariationCards";
import {
  HistoryPanel,
  type HistoryAction,
  type HistoryEntry,
} from "./HistoryPanel";
import { LANGUAGE_BY_CODE } from "@/lib/tools/languages";
import {
  useToolStorage,
  clearToolStorage,
} from "@/lib/tools/useToolStorage";

const MAX = 350;

type Tone = "Friendly" | "Professional" | "Apologetic" | "Confident";
const TONES: Tone[] = ["Friendly", "Professional", "Apologetic", "Confident"];

type TemplateKey = "thanks" | "apology" | "bug" | "feature" | "blank";

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
  blank: { label: "Blank", body: "" },
};

type AiKind = "polish" | "shorten" | "translate";

interface AiBatch {
  kind: AiKind;
  actionLabel: string;
  variations: Variation[];
  // For "Regenerate"
  contextTone?: Tone;
  contextLang?: string;
}

const HISTORY_LIMIT = 5;

export function CharCounter() {
  // Persisted state
  const [text, setText] = useToolStorage<string>("text", TEMPLATES.thanks.body, 500);
  const [tone, setTone] = useToolStorage<Tone>("tone", "Professional", 0);
  const [lang, setLang] = useToolStorage<string>("lang", "en", 0);
  const [reviewContextOpen, setReviewContextOpen] = useToolStorage<boolean>(
    "reviewContextOpen",
    false,
    0
  );
  const [reviewContextText, setReviewContextText] = useToolStorage<string>(
    "reviewContextText",
    "",
    500
  );
  const [history, setHistory] = useToolStorage<HistoryEntry[]>(
    "history",
    [],
    0
  );

  // If hydrated context text exists, auto-expand the panel.
  useEffect(() => {
    if (reviewContextText.trim().length > 0 && !reviewContextOpen) {
      setReviewContextOpen(true);
    }
    // Run only on mount-equivalent hydration burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local (non-persisted) state
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>("blank");
  const [batch, setBatch] = useState<AiBatch | null>(null);
  const [loading, setLoading] = useState<AiKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const tooLong = text.length > MAX;

  // Debounced manual-edit history capture
  const lastSavedTextRef = useRef<string>(text);
  const editTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (editTimerRef.current) clearTimeout(editTimerRef.current);
    if (text === lastSavedTextRef.current) return;
    editTimerRef.current = setTimeout(() => {
      if (text.trim().length === 0) return;
      if (text === lastSavedTextRef.current) return;
      pushHistory({
        action: "edited",
        text,
        charCount: text.length,
      });
      lastSavedTextRef.current = text;
    }, 3000);
    return () => {
      if (editTimerRef.current) clearTimeout(editTimerRef.current);
    };
    // pushHistory is stable via setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const pushHistory = useCallback(
    (entry: Omit<HistoryEntry, "id" | "createdAt">) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newEntry: HistoryEntry = {
        ...entry,
        id,
        createdAt: Date.now(),
      };
      setHistory([newEntry, ...history].slice(0, HISTORY_LIMIT));
    },
    [history, setHistory]
  );

  const handleTemplate = useCallback(
    (key: TemplateKey) => {
      if (key === activeTemplate) return;
      const incoming = TEMPLATES[key].body;
      if (
        text.trim() &&
        text !== TEMPLATES[activeTemplate]?.body &&
        !window.confirm(
          "Replace your current text with the template? Your changes will be lost."
        )
      ) {
        return;
      }
      setText(incoming);
      lastSavedTextRef.current = incoming;
      setActiveTemplate(key);
    },
    [activeTemplate, text, setText]
  );

  const buildBody = useCallback(
    (extra: Record<string, unknown>) => {
      const body: Record<string, unknown> = { text, ...extra };
      const ctx = reviewContextText.trim();
      if (ctx.length >= 10) body.reviewContext = ctx;
      return body;
    },
    [text, reviewContextText]
  );

  const runAction = useCallback(
    async (kind: AiKind, body: Record<string, unknown>, label: string, ctx: { tone?: Tone; lang?: string } = {}) => {
      setLoading(kind);
      setError(null);
      setCopiedKey(null);
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
        const variations: Variation[] = Array.isArray(data?.results)
          ? data.results
              .map((r: { text?: unknown; charCount?: unknown }) => ({
                text: typeof r.text === "string" ? r.text : "",
                charCount:
                  typeof r.charCount === "number"
                    ? r.charCount
                    : typeof r.text === "string"
                      ? r.text.length
                      : 0,
              }))
              .filter((v: Variation) => v.text.length > 0)
          : [];
        if (variations.length === 0) {
          setError("AI returned no usable variations. Try again.");
          return;
        }
        setBatch({
          kind,
          actionLabel: label,
          variations,
          contextTone: ctx.tone,
          contextLang: ctx.lang,
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
    runAction(
      "polish",
      buildBody({ tone }),
      `Polished · ${tone} tone`,
      { tone }
    );

  const handleShorten = () =>
    runAction("shorten", buildBody({}), "Shortened to ≤350", {});

  const handleTranslate = () => {
    const meta = LANGUAGE_BY_CODE[lang];
    if (!meta) return;
    runAction(
      "translate",
      buildBody({ targetLang: meta.code }),
      `Translated · ${meta.name}`,
      { lang: meta.name }
    );
  };

  const handleRegenerate = () => {
    if (!batch) return;
    if (batch.kind === "polish") handlePolish();
    else if (batch.kind === "shorten") handleShorten();
    else if (batch.kind === "translate") handleTranslate();
  };

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard denied */
    }
  };

  const handleUseVariation = (v: Variation) => {
    setText(v.text);
    lastSavedTextRef.current = v.text;
    setActiveTemplate("blank");
    if (!batch) return;
    pushHistory({
      action:
        batch.kind === "polish"
          ? "polished"
          : batch.kind === "shorten"
            ? "shortened"
            : "translated",
      tone: batch.contextTone,
      lang: batch.contextLang,
      text: v.text,
      charCount: v.charCount,
    });
  };

  const handleRestoreHistory = (entry: HistoryEntry) => {
    setText(entry.text);
    lastSavedTextRef.current = entry.text;
    setActiveTemplate("blank");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearHistory = () => {
    if (history.length === 0) return;
    if (window.confirm("Clear all history entries?")) setHistory([]);
  };

  const handleResetTool = () => {
    if (
      !window.confirm("Clear textarea, history, and all settings?")
    )
      return;
    clearToolStorage();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Tool card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-12 h-24 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(139,92,246,0.18),transparent_70%)]"
        />

        {/* Review context (above templates) */}
        <div className="mb-4">
          <ReviewContextInput
            open={reviewContextOpen}
            onOpenChange={setReviewContextOpen}
            value={reviewContextText}
            onChange={setReviewContextText}
          />
        </div>

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
            placeholder="Paste or write your Play Store reply here…"
            aria-label="Play Store reply"
            className={cn(
              "min-h-[180px] resize-y rounded-xl border-border/60 bg-background/70 p-4 text-[15px] leading-relaxed transition-colors focus-visible:border-accent/50",
              tooLong && "border-red-400/60 focus-visible:border-red-500/60"
            )}
          />
          <CounterPills text={text} max={MAX} />
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

          <LanguagePicker
            value={lang}
            onChange={(code) => {
              setLang(code);
              // Auto-run translate when language picked while there's text
              if (text.trim().length >= 5 && !loading) {
                const meta = LANGUAGE_BY_CODE[code];
                if (meta) {
                  runAction(
                    "translate",
                    buildBody({ targetLang: meta.code }),
                    `Translated · ${meta.name}`,
                    { lang: meta.name }
                  );
                }
              }
            }}
            disabled={loading !== null || text.trim().length < 5}
            loading={loading === "translate"}
          />

          {batch && (
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

      {/* Variation cards */}
      {batch && (
        <VariationCards
          variations={batch.variations}
          actionLabel={batch.actionLabel}
          copiedKey={copiedKey}
          onCopy={handleCopy}
          onUse={handleUseVariation}
        />
      )}

      {/* History */}
      <HistoryPanel
        entries={history}
        onRestore={handleRestoreHistory}
        onClear={handleClearHistory}
      />

      {/* Hard reset */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleResetTool}
          className="text-[11px] text-muted-foreground/70 underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
        >
          Reset tool
        </button>
      </div>
    </div>
  );
}

// Note: kept for parity with Phase 1 / future telemetry hooks.
export type { HistoryAction };

function endpointFor(kind: AiKind): string {
  if (kind === "polish") return "polish-reply";
  if (kind === "shorten") return "shorten-reply";
  return "translate-reply";
}
