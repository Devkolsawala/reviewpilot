import { Check, Minus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLANS as P,
  getDigestCcLimit,
  getWhatsAppConnectionLimit,
} from "@/lib/plans";

// Columns are fixed: Free | Starter | Growth | Agency (Enterprise excluded).
const COLUMNS = [
  { key: "free", name: "Free" },
  { key: "starter", name: "Starter" },
  { key: "growth", name: "Growth" },
  { key: "agency", name: "Agency" },
] as const;

type Cell = boolean | string | number;

type Row = { label: string; cells: [Cell, Cell, Cell, Cell] };
type Section = { title: string; rows: Row[] };

const cap = (n: number) => (n === -1 ? "Unlimited" : n.toLocaleString());
// 0 analyses / 0 CC == feature not included → render as absent ("—").
const countOrNone = (n: number): Cell => (n <= 0 ? false : n.toLocaleString());

// Source-of-truth: every value below is read from src/lib/plans.ts.
// Within each section, rows that DIFFER across plans come first; rows that are
// identical across all four plans come last.
const SECTIONS: Section[] = [
  {
    title: "Reviews & Inbox",
    rows: [
      {
        label: "Apps & locations",
        cells: [
          P.free.limits.connections,
          P.starter.limits.connections,
          P.growth.limits.connections,
          P.agency.limits.connections,
        ],
      },
      {
        label: "Reviews stored",
        cells: [
          cap(P.free.limits.reviews_stored),
          cap(P.starter.limits.reviews_stored),
          cap(P.growth.limits.reviews_stored),
          cap(P.agency.limits.reviews_stored),
        ],
      },
      {
        label: "Auto-reply to new reviews",
        cells: [
          P.free.features.auto_reply,
          P.starter.features.auto_reply,
          P.growth.features.auto_reply,
          P.agency.features.auto_reply,
        ],
      },
      {
        label: "Bulk reply",
        cells: [
          P.free.features.inbox_bulk_reply,
          P.starter.features.inbox_bulk_reply,
          P.growth.features.inbox_bulk_reply,
          P.agency.features.inbox_bulk_reply,
        ],
      },
      {
        label: "Unified inbox + AI reply",
        cells: [
          P.free.features.inbox_ai_reply,
          P.starter.features.inbox_ai_reply,
          P.growth.features.inbox_ai_reply,
          P.agency.features.inbox_ai_reply,
        ],
      },
      {
        label: "WhatsApp Business automation",
        cells: [true, true, true, true],
      },
    ],
  },
  {
    title: "AI & Automation",
    rows: [
      {
        label: "AI replies / week",
        cells: [
          cap(P.free.limits.ai_replies_per_period),
          cap(P.starter.limits.ai_replies_per_period),
          cap(P.growth.limits.ai_replies_per_period),
          cap(P.agency.limits.ai_replies_per_period),
        ],
      },
      {
        // Free sees a teaser; Starter+ unlock the full drill-down (gated by auto_reply).
        label: "Issue Tracker (full drill-down)",
        cells: [
          P.free.features.auto_reply,
          P.starter.features.auto_reply,
          P.growth.features.auto_reply,
          P.agency.features.auto_reply,
        ],
      },
    ],
  },
  {
    title: "Analytics & Insights",
    rows: [
      {
        label: "Advanced analytics",
        cells: [
          P.free.features.analytics_advanced,
          P.starter.features.analytics_advanced,
          P.growth.features.analytics_advanced,
          P.agency.features.analytics_advanced,
        ],
      },
      {
        label: "Sentiment analysis",
        cells: [
          P.free.features.sentiment_analysis,
          P.starter.features.sentiment_analysis,
          P.growth.features.sentiment_analysis,
          P.agency.features.sentiment_analysis,
        ],
      },
      {
        label: "Version Impact AI verdict",
        cells: [
          P.free.features.version_impact_ai,
          P.starter.features.version_impact_ai,
          P.growth.features.version_impact_ai,
          P.agency.features.version_impact_ai,
        ],
      },
      {
        label: "ASO Analysis (analyses / period)",
        cells: [
          countOrNone(P.free.limits.aso_analyses_per_period),
          countOrNone(P.starter.limits.aso_analyses_per_period),
          countOrNone(P.growth.limits.aso_analyses_per_period),
          countOrNone(P.agency.limits.aso_analyses_per_period),
        ],
      },
      {
        label: "Basic analytics",
        cells: [
          P.free.features.analytics_basic,
          P.starter.features.analytics_basic,
          P.growth.features.analytics_basic,
          P.agency.features.analytics_basic,
        ],
      },
      {
        label: "Version Impact Analyzer",
        cells: [true, true, true, true],
      },
    ],
  },
  {
    title: "Team & Collaboration",
    rows: [
      {
        label: "Team seats",
        cells: [
          P.free.limits.team_members,
          P.starter.limits.team_members,
          P.growth.limits.team_members,
          P.agency.limits.team_members,
        ],
      },
    ],
  },
  {
    title: "Integrations",
    rows: [
      {
        label: "WhatsApp connections",
        cells: [
          getWhatsAppConnectionLimit("free"),
          getWhatsAppConnectionLimit("starter"),
          getWhatsAppConnectionLimit("growth"),
          getWhatsAppConnectionLimit("agency"),
        ],
      },
      {
        label: "Review sync",
        cells: ["Every 2h", "Every 2h", "Every 2h", "Every 2h"],
      },
    ],
  },
  {
    title: "Support & Reporting",
    rows: [
      {
        label: "Priority support",
        cells: [
          P.free.features.priority_support,
          P.starter.features.priority_support,
          P.growth.features.priority_support,
          P.agency.features.priority_support,
        ],
      },
      {
        label: "Digest email CC recipients",
        cells: [
          countOrNone(getDigestCcLimit("free")),
          countOrNone(getDigestCcLimit("starter")),
          countOrNone(getDigestCcLimit("growth")),
          countOrNone(getDigestCcLimit("agency")),
        ],
      },
      {
        label: "Daily digest email",
        cells: [true, true, true, true],
      },
    ],
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <>
        <Check className="mx-auto h-4 w-4 text-accent" aria-hidden />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" aria-hidden />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="tabular-nums text-foreground/90">{value}</span>;
}

export function PricingComparison() {
  return (
    <div className="mx-auto mt-24 max-w-5xl px-0">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Compare every feature
        </p>
        <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Every plan, side by side
        </h2>
      </div>

      {/* Mobile (below sm): no side-scroll. One card per plan, each listing its
          feature values. Avoids the 640px min-width that pans the page and the
          sticky-column overlap that breaks on real phones. */}
      <div className="mt-12 space-y-4 sm:hidden">
        {COLUMNS.map((col, colIndex) => (
          <details
            key={col.key}
            open
            className={cn(
              "group overflow-hidden rounded-2xl border bg-card",
              col.key === "growth" ? "border-accent/40" : "border-border/60",
            )}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span
                className={cn(
                  "text-base font-semibold tracking-tight",
                  col.key === "growth" && "text-accent",
                )}
              >
                {col.name}
              </span>
              <ChevronDown
                className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="border-t border-border/50 px-4 pb-2 pt-1">
              {SECTIONS.map((section) => (
                <div key={section.title} className="py-2">
                  <p className="py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                    {section.title}
                  </p>
                  <dl className="divide-y divide-border/50">
                    {section.rows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-4 py-2.5"
                      >
                        <dt className="text-sm text-foreground/90">
                          {row.label}
                        </dt>
                        <dd className="shrink-0 text-right text-sm">
                          <CellValue value={row.cells[colIndex]} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {/* Desktop (sm and up): semantic comparison table — unchanged. */}
      <div
        className="mt-12 hidden overflow-x-auto rounded-2xl border border-border/60 sm:block"
        role="region"
        aria-label="Plan feature comparison"
        tabIndex={0}
      >
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">
            Feature comparison across Free, Starter, Growth and Agency plans
          </caption>
          <thead>
            <tr className="sticky top-0 z-10 bg-card/95 backdrop-blur">
              <th
                scope="col"
                className="sticky left-0 z-20 bg-card/95 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur"
              >
                Features
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "px-4 py-4 text-center text-sm font-semibold tracking-tight",
                    c.key === "growth" && "text-accent",
                  )}
                >
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((section) => (
              <SectionRows key={section.title} section={section} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Roadmap note — SMS campaigns exist as a gate in code but are not live. */}
      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        On the roadmap: SMS campaigns
        <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          Coming soon
        </span>
      </p>
    </div>
  );
}

function SectionRows({ section }: { section: Section }) {
  return (
    <>
      <tr>
        <th
          scope="colgroup"
          colSpan={COLUMNS.length + 1}
          className="sticky left-0 bg-muted/40 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/70"
        >
          {section.title}
        </th>
      </tr>
      {section.rows.map((row) => (
        <tr key={row.label} className="border-t border-border/50">
          <th
            scope="row"
            className="sticky left-0 z-10 bg-background/95 px-4 py-3 text-left text-sm font-normal text-foreground/90 backdrop-blur"
          >
            {row.label}
          </th>
          {row.cells.map((cell, i) => (
            <td key={COLUMNS[i].key} className="px-4 py-3 text-center">
              <CellValue value={cell} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
