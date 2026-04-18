"use client";

import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { m, MotionProvider } from "@/components/motion/primitives";

const COMPETITORS = [
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
      white_label: true,
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
      white_label: true,
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
      white_label: false,
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
      white_label: false,
      indian_languages: false,
    },
  },
];

const FEATURE_LABELS: Record<string, string> = {
  ai_replies: "AI auto-replies",
  google_business: "Google Business Profile",
  play_store: "Play Store reviews",
  sms_campaigns: "SMS collection",
  analytics: "Sentiment analytics",
  white_label: "White-label",
  indian_languages: "8 Indian languages",
};

export function ComparisonTable() {
  return (
    <MotionProvider>
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              The honest comparison
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
              Better coverage at a{" "}
              <span className="text-gradient-brand">fraction of the price</span>.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Monthly starting price. Features available on entry-tier plans only.
            </p>
          </div>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-background text-left pb-3 pl-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Feature
                  </th>
                  {COMPETITORS.map((c) => (
                    <th
                      key={c.name}
                      className={cn(
                        "pb-3 px-4 text-center",
                        c.highlight &&
                          "relative before:absolute before:inset-x-2 before:-top-3 before:bottom-0 before:-z-10 before:rounded-t-xl before:bg-[linear-gradient(180deg,rgba(99,102,241,0.12),transparent)] before:border before:border-accent/30 before:border-b-0",
                      )}
                    >
                      <div
                        className={cn(
                          "font-sans font-semibold",
                          c.highlight ? "text-foreground" : "text-foreground/70",
                        )}
                      >
                        {c.name}
                        {c.highlight && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] px-2 py-0.5 text-[10px] font-medium text-white">
                            Best value
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "mt-1 font-mono text-xs",
                          c.highlight ? "text-accent" : "text-muted-foreground",
                        )}
                      >
                        from {c.price}/mo
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(FEATURE_LABELS).map(([key, label], rowIdx) => (
                  <m.tr
                    key={key}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: rowIdx * 0.05, duration: 0.35 }}
                  >
                    <td className="sticky left-0 bg-background border-t border-border/60 py-4 pl-2 text-muted-foreground">
                      {label}
                    </td>
                    {COMPETITORS.map((c) => (
                      <td
                        key={c.name}
                        className={cn(
                          "border-t border-border/60 py-4 px-4 text-center",
                          c.highlight &&
                            "relative before:absolute before:inset-x-2 before:inset-y-0 before:-z-10 before:bg-[linear-gradient(180deg,rgba(99,102,241,0.04),rgba(99,102,241,0.04))] before:border-x before:border-accent/30",
                        )}
                      >
                        {c.features[key as keyof typeof c.features] ? (
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
                <tr>
                  <td className="py-4" />
                  {COMPETITORS.map((c) => (
                    <td
                      key={c.name}
                      className={cn(
                        "border-t border-border/60",
                        c.highlight &&
                          "relative before:absolute before:inset-x-2 before:top-0 before:bottom-[-12px] before:-z-10 before:rounded-b-xl before:bg-[linear-gradient(0deg,rgba(99,102,241,0.04),transparent)] before:border before:border-accent/30 before:border-t-0",
                      )}
                    />
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </MotionProvider>
  );
}
