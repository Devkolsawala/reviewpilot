"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TourResetButton } from "@/components/dashboard/ProductTour";
import { ContactSupportDialog } from "@/components/dashboard/ContactSupportDialog";
import {
  Link2,
  Bot,
  MessageSquare,
  Megaphone,
  ChevronDown,
  Play,
  CheckCircle2,
  Lightbulb,
  Zap,
  HelpCircle,
  ExternalLink,
  BookOpen,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  number: number;
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  steps: string[];
  tip: string;
  comingSoon?: boolean;
};

const STEPS: Step[] = [
  {
    number: 1,
    id: "connect",
    icon: Link2,
    title: "Connect Your Review Source",
    description:
      "Link your Google Business Profile or Google Play Store app to start pulling in reviews automatically.",
    steps: [
      "Go to Settings → Connections in the sidebar",
      "Click 'Add Connection' and choose Google Business Profile or Play Store",
      "Authorize ReviewPilot to read reviews (read-only access)",
      "Your reviews will sync within a few minutes",
    ],
    tip: "You can connect multiple sources — one GBP location and one Play Store app on the Free plan.",
  },
  {
    number: 2,
    id: "configure-ai",
    icon: Bot,
    title: "Configure Your AI Profile",
    description:
      "Teach the AI about your business so replies sound like they came from your team, not a robot.",
    steps: [
      "Go to Settings → AI Configuration",
      "Describe your business in 2–3 sentences",
      "Add your key services, product highlights, and any common issues",
      "Set your preferred reply tone (Friendly, Professional, Apologetic, Casual)",
    ],
    tip: "The more context you provide, the better the AI replies. Be specific about your services and what makes you different.",
  },
  {
    number: 3,
    id: "reply",
    icon: MessageSquare,
    title: "Reply to Reviews",
    description:
      "Use the Review Inbox to view, generate, and publish AI-powered replies to your reviews.",
    steps: [
      "Open the Review Inbox from the sidebar",
      "Click any review to open the detail panel",
      "Choose a tone and click 'Generate Reply'",
      "Edit the reply if needed, then click 'Publish' to post it live",
    ],
    tip: "Use J/K keyboard shortcuts to navigate reviews quickly. Press R to generate a reply without clicking.",
  },
  {
    number: 4,
    id: "campaigns",
    icon: Megaphone,
    title: "Collect More Reviews",
    description:
      "Send SMS or email campaigns to your customers to proactively generate new positive reviews.",
    steps: [
      "Go to Campaigns in the sidebar",
      "Click 'New Campaign' and choose SMS or Email",
      "Upload your customer contact list (CSV)",
      "Customize your review request message and send",
    ],
    tip: "Send campaigns within 24–48 hours of a customer interaction for the best response rates.",
    comingSoon: true,
  },
];

const FAQS = [
  {
    id: "faq-context",
    question: "How does the AI know about my business?",
    answer:
      "The AI uses the context you provide in Settings → AI Configuration. When you describe your business, services, and tone preferences, the AI incorporates this into every reply it generates. The more detail you provide, the more personalized and accurate the replies will be.",
  },
  {
    id: "faq-auto",
    question: "Are replies published automatically?",
    answer:
      "No — you always stay in control. ReviewPilot generates a suggested reply, but you review and edit it before clicking Publish. Nothing goes live without your explicit approval. You can also save a draft to come back to later.",
  },
  {
    id: "faq-edit",
    question: "Can I edit AI replies before publishing?",
    answer:
      "Absolutely. The reply appears in a text editor where you can make any changes you want. Think of the AI as a first draft — you refine it to match your voice exactly before publishing.",
  },
  {
    id: "faq-multi",
    question: "Can I manage multiple apps or locations?",
    answer:
      "Yes. You can connect multiple sources. The Free plan supports 1 GBP location and 1 Play Store app. Upgrading to Pro or Agency unlocks unlimited connections so you can manage all your locations and apps from one dashboard.",
  },
  {
    id: "faq-platforms",
    question: "What platforms are supported?",
    answer:
      "Currently ReviewPilot supports Google Business Profile (for local businesses) and Google Play Store (for app developers). We're actively working on App Store (iOS) and Yelp integrations — stay tuned.",
  },
  {
    id: "faq-limits",
    question: "How many AI replies do I get per month?",
    answer:
      "The Free plan includes 30 AI replies per week. The Pro plan ($49/mo) includes 500 replies, and the Agency plan ($149/mo) includes unlimited replies. Replies reset on your billing date each month.",
  },
  {
    id: "faq-security",
    question: "Is my data secure?",
    answer:
      "Yes. ReviewPilot uses read-only OAuth access to your review platforms — we never store your passwords. Review data is encrypted at rest and in transit. We never sell or share your data with third parties.",
  },
];

function FAQItem({ question, answer, highlight }: { question: string; answer: string; highlight?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border rounded-xl overflow-hidden transition-all duration-200", open && "shadow-sm border-accent/30")}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="font-medium text-sm pr-4">
          {highlight ? <Highlighted text={question} query={highlight} /> : question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96" : "max-h-0"
        )}
      >
        <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t pt-3">
          {highlight ? <Highlighted text={answer} query={highlight} /> : answer}
        </p>
      </div>
    </div>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const q = query.trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/20 text-foreground rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function matchesQuery(haystack: string, q: string) {
  if (!q.trim()) return true;
  return haystack.toLowerCase().includes(q.trim().toLowerCase());
}

export default function DocsPage() {
  const [query, setQuery] = useState("");

  const filteredSteps = useMemo(() => {
    if (!query.trim()) return STEPS;
    return STEPS.filter((s) =>
      matchesQuery(
        [s.title, s.description, s.tip, ...s.steps].join(" | "),
        query
      )
    );
  }, [query]);

  const filteredFaqs = useMemo(() => {
    if (!query.trim()) return FAQS;
    return FAQS.filter((f) => matchesQuery(`${f.question} ${f.answer}`, query));
  }, [query]);

  // Active step tracking via IntersectionObserver for the sticky TOC
  const [activeStepId, setActiveStepId] = useState<string | null>(filteredSteps[0]?.id ?? null);
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Reset active when filtered list changes
    setActiveStepId(filteredSteps[0]?.id ?? null);
  }, [filteredSteps]);

  useEffect(() => {
    if (filteredSteps.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top among intersecting ones
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.getAttribute("data-step-id");
          if (id) setActiveStepId(id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    for (const s of filteredSteps) {
      const el = stepRefs.current[s.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [filteredSteps]);

  const totalMatches = filteredSteps.length + filteredFaqs.length;

  return (
    <PageTransition>
      <div className="grid gap-10 lg:grid-cols-[1fr_220px] lg:gap-12 pb-12">
        <div className="min-w-0 max-w-3xl space-y-10">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <BookOpen className="h-5 w-5 text-accent" />
                <Badge variant="secondary" className="text-xs">Help Center</Badge>
              </div>
              <h1 className="font-sans text-2xl sm:text-3xl font-semibold tracking-tight">
                Getting Started
                <span className="text-accent">.</span>
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm max-w-lg">
                Everything you need to get ReviewPilot up and running in under 10 minutes.
              </p>
            </div>
            <TourResetButton />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the guide & FAQs…"
              className="pl-9 pr-10 h-10"
              aria-label="Search documentation"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {query.trim() && (
              <p className="mt-2 text-[11px] font-mono text-muted-foreground">
                {totalMatches === 0
                  ? "No matches in this guide — try a different keyword."
                  : `${totalMatches} match${totalMatches === 1 ? "" : "es"} for "${query.trim()}"`}
              </p>
            )}
          </div>

          {/* Getting Started Steps */}
          {filteredSteps.length > 0 && (
            <div>
              <h2 className="font-sans tracking-tight text-xl font-semibold mb-5 flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Quick Start Guide
              </h2>
              <div className="space-y-4">
                {filteredSteps.map((step) => (
                  <div
                    key={step.id}
                    id={step.id}
                    data-step-id={step.id}
                    ref={(el) => { stepRefs.current[step.id] = el; }}
                    className="scroll-mt-20"
                  >
                    <Card className={cn("overflow-hidden", step.comingSoon && "opacity-95")}>
                      <CardContent className="p-5">
                        <div className={cn("flex items-start gap-4", step.comingSoon && "opacity-60")}>
                          {/* Gradient number badge */}
                          <div className="relative shrink-0">
                            <div
                              aria-hidden
                              className="absolute inset-0 -m-1 rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.25),rgba(217,70,239,0.25))] blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            />
                            <div className="relative h-11 w-11 rounded-full bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] ring-4 ring-card flex items-center justify-center text-white font-sans font-semibold text-sm shadow-[0_0_18px_-6px_rgba(139,92,246,0.6)]">
                              {step.number}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent/80">
                                Step {step.number}
                              </span>
                              <step.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                            </div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-sans font-semibold tracking-tight text-base">
                                <Highlighted text={step.title} query={query} />
                              </h3>
                              {step.comingSoon && (
                                <span className="inline-flex items-center rounded-full bg-violet-500/15 dark:bg-violet-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              <Highlighted text={step.description} query={query} />
                            </p>

                            {/* Checklist with check bullets */}
                            <ul className="space-y-2">
                              {step.steps.map((s, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm">
                                  <CheckCircle2
                                    className="h-4 w-4 shrink-0 text-accent/70 mt-0.5"
                                    aria-hidden
                                  />
                                  <span className="text-foreground/90">
                                    <Highlighted text={s} query={query} />
                                  </span>
                                </li>
                              ))}
                            </ul>

                            {/* Tip — accent-tinted info card */}
                            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-accent/20 bg-accent/5 px-3.5 py-2.5">
                              <Lightbulb className="h-3.5 w-3.5 shrink-0 text-accent mt-0.5" aria-hidden />
                              <p className="text-xs text-foreground/80 leading-relaxed">
                                <span className="font-medium text-accent">Tip:</span>{" "}
                                <Highlighted text={step.tip} query={query} />
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when nothing matches */}
          {query.trim() && totalMatches === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-2xl bg-secondary/60 p-4 mb-3 ring-1 ring-border/60">
                <Search className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium mb-1">No results in the guide</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Try a different keyword, or reach out — our support team typically responds within a few hours.
              </p>
            </div>
          )}

          {/* Video Tutorial */}
          {!query.trim() && (
            <a
              href="https://youtu.be/WXVq7twjiVw"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              aria-label="Watch the full ReviewPilot walkthrough on YouTube"
            >
              <Card className="overflow-hidden border transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-2xl">
                <CardContent className="p-0">
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://img.youtube.com/vi/WXVq7twjiVw/maxresdefault.jpg"
                      alt="ReviewPilot walkthrough video thumbnail"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = "true";
                          img.src = "https://img.youtube.com/vi/WXVq7twjiVw/hqdefault.jpg";
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30 transition-colors duration-300 group-hover:from-black/70" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/25">
                        <Play className="h-7 w-7 text-white ml-1 fill-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <p className="text-sm font-medium drop-shadow">Watch the full ReviewPilot walkthrough</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          )}

          {/* Keyboard Shortcuts Quick Reference */}
          {!query.trim() && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Keyboard Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { keys: ["⌘", "K"], label: "Open global search" },
                    { keys: ["["], label: "Collapse / expand sidebar" },
                    { keys: ["J"], label: "Next review" },
                    { keys: ["K"], label: "Previous review" },
                    { keys: ["R"], label: "Generate AI reply" },
                    { keys: ["⌘", "↵"], label: "Publish reply" },
                    { keys: ["?"], label: "Show all shortcuts" },
                    { keys: ["Esc"], label: "Close modal / cancel" },
                  ].map(({ keys, label }) => (
                    <div key={label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <div className="flex items-center gap-1">
                        {keys.map((k) => (
                          <kbd
                            key={k}
                            className="inline-flex items-center justify-center rounded bg-background border shadow-sm px-1.5 py-0.5 text-[11px] font-mono font-medium min-w-[22px]"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAQ */}
          {filteredFaqs.length > 0 && (
            <div id="faq" className="scroll-mt-20">
              <h2 className="font-sans tracking-tight text-xl font-semibold mb-5 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-accent" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {filteredFaqs.map((faq) => (
                  <FAQItem
                    key={faq.id}
                    question={faq.question}
                    answer={faq.answer}
                    highlight={query.trim() ? query : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Still need help */}
          <Card className="bg-[linear-gradient(135deg,rgba(99,102,241,0.08),rgba(217,70,239,0.08))] border-accent/30">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div>
                <h3 className="font-sans font-semibold tracking-tight mb-1">Still have questions?</h3>
                <p className="text-sm text-muted-foreground">
                  Our support team typically responds within a few hours.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <ContactSupportDialog
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Contact Support
                    </Button>
                  }
                />
                <Button size="sm" variant="gradient" className="gap-2" asChild>
                  <a href="/dashboard/settings/connections">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connect a Source
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky right-rail TOC — lg+ only */}
        <aside className="hidden lg:block">
          <nav
            aria-label="On this page"
            className="sticky top-20 space-y-1"
          >
            <p className="px-2 mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
              On this page
            </p>
            {STEPS.map((s) => {
              const active = activeStepId === s.id;
              const isVisible = filteredSteps.some((f) => f.id === s.id);
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(s.id);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                      setActiveStepId(s.id);
                    }
                  }}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                    active
                      ? "bg-accent/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    !isVisible && "opacity-40 pointer-events-none"
                  )}
                  aria-current={active ? "true" : undefined}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 h-3 w-[2px] rounded-full transition-opacity",
                      "bg-[linear-gradient(180deg,#6366f1,#8b5cf6,#d946ef)]",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums w-3">
                    {s.number}
                  </span>
                  <span className="truncate">{s.title}</span>
                </a>
              );
            })}
            {filteredFaqs.length > 0 && (
              <>
                <div className="my-2 border-t border-border/60" />
                <a
                  href="#faq"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("faq")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40"
                >
                  <HelpCircle className="h-3 w-3" />
                  FAQ
                </a>
              </>
            )}
          </nav>
        </aside>
      </div>
    </PageTransition>
  );
}
