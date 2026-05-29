"use client";

import { Check, Minus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { m, MotionProvider } from "@/components/motion/primitives";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  REVIEWPILOT,
  COMPETITORS,
  COMPARISON_ROW_ORDER,
  featureById,
  type CellState,
  type Competitor,
} from "@/lib/marketing/features";

type ComparisonTableProps = {
  /** If provided, only competitors whose name is in this list render (plus ReviewPilot). */
  competitorFilter?: string[];
  /** Optional override for the section eyebrow/heading copy. */
  heading?: React.ReactNode;
  eyebrow?: string;
  subhead?: string;
};

export function ComparisonTable({
  competitorFilter,
  heading,
  eyebrow = "The honest comparison",
  subhead = "Monthly starting price. Features available on entry-tier plans only.",
}: ComparisonTableProps) {
  const competitors = competitorFilter
    ? COMPETITORS.filter((c) => competitorFilter.includes(c.name))
    : COMPETITORS;
  const columns: Competitor[] = [REVIEWPILOT, ...competitors];

  return (
    <MotionProvider>
      <TooltipProvider delayDuration={150}>
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {eyebrow}
              </p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
                {heading ?? (
                  <>
                    Better coverage at a{" "}
                    <span className="text-gradient-brand">
                      fraction of the price
                    </span>
                    .
                  </>
                )}
              </h2>
              <p className="mt-4 text-sm text-muted-foreground">{subhead}</p>
            </div>

            {/* Single responsive table — table-scoped horizontal scroll on
                narrow viewports, leftmost feature column stays sticky. */}
            <div className="mt-12 overflow-x-auto rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                <caption className="sr-only">
                  Feature comparison between ReviewPilot and competitors
                </caption>
                <colgroup>
                  <col className="w-[34%] min-w-[180px]" />
                  {columns.map((c) => (
                    <col key={c.name} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm text-left align-bottom px-4 py-5 font-medium text-[11px] uppercase tracking-wider text-muted-foreground"
                    >
                      Feature
                    </th>
                    {columns.map((c) => (
                      <th
                        key={c.name}
                        scope="col"
                        className={cn(
                          "px-3 py-5 align-bottom text-center",
                          c.highlight && "bg-accent/[0.06]",
                        )}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={cn(
                              "font-sans font-semibold text-sm whitespace-normal break-words",
                              c.highlight
                                ? "text-foreground"
                                : "text-foreground/70",
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
                              c.highlight
                                ? "text-accent"
                                : "text-muted-foreground",
                            )}
                          >
                            {c.priceLabel}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROW_ORDER.map((featureId, rowIdx) => {
                    const feature = featureById(featureId);
                    if (!feature) return null;
                    return (
                      <m.tr
                        key={featureId}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: rowIdx * 0.04, duration: 0.35 }}
                      >
                        <th
                          scope="row"
                          className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm border-t border-border/60 px-4 py-4 text-left font-normal text-muted-foreground align-middle"
                        >
                          {feature.shortLabel}
                        </th>
                        {columns.map((c) => (
                          <td
                            key={c.name}
                            className={cn(
                              "border-t border-border/60 px-3 py-4 text-center align-middle",
                              c.highlight && "bg-accent/[0.06]",
                            )}
                          >
                            <CellMark
                              state={c.features[featureId] ?? "no"}
                              highlight={c.highlight}
                            />
                          </td>
                        ))}
                      </m.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </TooltipProvider>
    </MotionProvider>
  );
}

function CellMark({
  state,
  highlight,
}: {
  state: CellState;
  highlight?: boolean;
}) {
  if (state === "yes") {
    return (
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full",
          highlight
            ? "bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-white"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        )}
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">Included</span>
      </span>
    );
  }

  if (state === "no") {
    return (
      <>
        <Minus
          className="mx-auto h-4 w-4 text-muted-foreground/40"
          aria-hidden="true"
        />
        <span className="sr-only">Not available</span>
      </>
    );
  }

  if (state === "partial") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-500/40 text-amber-600 dark:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Limited support</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Limited support — see details</TooltipContent>
      </Tooltip>
    );
  }

  // soon
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <Clock className="h-3 w-3" aria-hidden="true" />
          Soon
        </button>
      </TooltipTrigger>
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  );
}
