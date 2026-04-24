"use client";

import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { m, MotionProvider } from "@/components/motion/primitives";

type FeatureKey =
  | "ai_replies"
  | "google_business"
  | "play_store"
  | "sms_campaigns"
  | "analytics"
  | "indian_languages";

type Competitor = {
  name: string;
  price: string;
  highlight?: boolean;
  features: Record<FeatureKey, boolean>;
};

const FEATURE_LABELS: Record<FeatureKey, string> = {
  ai_replies: "AI auto-replies",
  google_business: "Google Business Profile",
  play_store: "Play Store reviews",
  sms_campaigns: "SMS collection",
  analytics: "Sentiment analytics",
  indian_languages: "8 Indian languages",
};

const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as FeatureKey[];

const COMPETITORS: Competitor[] = [
  {
    name: "ReviewPilot",
    price: "₹1,500",
    highlight: true,
    features: {
      ai_replies: true,
      google_business: true,
      play_store: true,
      sms_campaigns: true,
      analytics: true,
      indian_languages: true,
    },
  },
  {
    name: "Birdeye",
    price: "₹25,000",
    features: {
      ai_replies: true,
      google_business: true,
      play_store: false,
      sms_campaigns: true,
      analytics: true,
      indian_languages: false,
    },
  },
  {
    name: "Podium",
    price: "₹20,000",
    features: {
      ai_replies: false,
      google_business: true,
      play_store: false,
      sms_campaigns: true,
      analytics: true,
      indian_languages: false,
    },
  },
  {
    name: "AppFollow",
    price: "₹15,000",
    features: {
      ai_replies: true,
      google_business: false,
      play_store: true,
      sms_campaigns: false,
      analytics: true,
      indian_languages: false,
    },
  },
];

export function ComparisonTable() {
  return (
    <MotionProvider>
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              The honest comparison
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
              Better coverage at a{" "}
              <span className="text-gradient-brand">fraction of the price</span>.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Monthly starting price. Features available on entry-tier plans only.
            </p>
          </div>

          {/* Desktop: full comparison table */}
          <div className="hidden md:block mt-12">
            <DesktopTable />
          </div>

          {/* Mobile: stacked cards */}
          <div className="md:hidden mt-10 space-y-4">
            {COMPETITORS.map((c, idx) => (
              <MobileCard key={c.name} competitor={c} index={idx} />
            ))}
          </div>
        </div>
      </section>
    </MotionProvider>
  );
}

function DesktopTable() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          <col className="w-[28%]" />
          {COMPETITORS.map((c) => (
            <col key={c.name} className="w-[18%]" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="text-left align-bottom px-4 py-5 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">
              Feature
            </th>
            {COMPETITORS.map((c) => (
              <th
                key={c.name}
                className={cn(
                  "px-3 py-5 align-bottom text-center",
                  c.highlight && "bg-accent/[0.06]",
                )}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "font-sans font-semibold text-sm whitespace-normal break-words",
                      c.highlight ? "text-foreground" : "text-foreground/70",
                    )}
                  >
                    {c.name}
                  </span>
                  {c.highlight && (
                    <span className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-2 py-0.5 text-[10px] font-medium text-white whitespace-nowrap">
                      Best value
                    </span>
                  )}
                  <span
                    className={cn(
                      "font-mono text-[11px] whitespace-nowrap",
                      c.highlight ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    from {c.price}/mo
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_KEYS.map((key, rowIdx) => (
            <m.tr
              key={key}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: rowIdx * 0.05, duration: 0.35 }}
            >
              <td className="border-t border-border/60 px-4 py-4 text-muted-foreground align-middle">
                {FEATURE_LABELS[key]}
              </td>
              {COMPETITORS.map((c) => (
                <td
                  key={c.name}
                  className={cn(
                    "border-t border-border/60 px-3 py-4 text-center align-middle",
                    c.highlight && "bg-accent/[0.06]",
                  )}
                >
                  {c.features[key] ? (
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full",
                        c.highlight
                          ? "bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-white"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                  )}
                </td>
              ))}
            </m.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileCard({
  competitor,
  index,
}: {
  competitor: Competitor;
  index: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={cn(
        "rounded-2xl border bg-card/60 backdrop-blur-sm p-5",
        competitor.highlight
          ? "border-accent/40 bg-[linear-gradient(180deg,rgba(99,102,241,0.06),rgba(217,70,239,0.03))] shadow-[0_0_32px_-12px_hsl(var(--ring)/0.4)]"
          : "border-border/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans text-base font-semibold tracking-tight">
            {competitor.name}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            from {competitor.price}/mo
          </p>
        </div>
        {competitor.highlight && (
          <span className="shrink-0 inline-flex items-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-2 py-0.5 text-[10px] font-medium text-white whitespace-nowrap">
            Best value
          </span>
        )}
      </div>
      <ul className="mt-4 space-y-2.5 border-t border-border/60 pt-4">
        {FEATURE_KEYS.map((key) => (
          <li
            key={key}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-foreground/85 break-words min-w-0">
              {FEATURE_LABELS[key]}
            </span>
            {competitor.features[key] ? (
              <span
                className={cn(
                  "shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full",
                  competitor.highlight
                    ? "bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-white"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                )}
              >
                <Check className="h-3 w-3" />
              </span>
            ) : (
              <Minus className="shrink-0 h-4 w-4 text-muted-foreground/40" />
            )}
          </li>
        ))}
      </ul>
    </m.div>
  );
}
