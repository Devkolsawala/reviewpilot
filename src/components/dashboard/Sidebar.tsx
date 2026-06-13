"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Megaphone,
  Settings,
  Link2,
  Bot,
  Users,
  CreditCard,
  Bell,
  ChevronDown,
  Sparkles,
  HelpCircle,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  Rocket,
  GitCompareArrows,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { FeedbackDialog } from "@/components/dashboard/FeedbackDialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUsage } from "@/hooks/useUsage";
import { useTeamRole } from "@/hooks/useTeamRole";
import { usePlan } from "@/hooks/usePlan";

const MOCK_OVERRIDES_PREFIX = "reviewpilot_mock_overrides";
const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

type ReviewOverride = { reply_status?: string };

async function computePendingCount(): Promise<number> {
  if (IS_MOCK) {
    let userId = "anon";
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? "anon";
    } catch { /* stay anonymous */ }
    const mockKey = `${MOCK_OVERRIDES_PREFIX}_${userId}`;

    const [{ mockPlayReviews }, { mockGBPReviews }] = await Promise.all([
      import("@/lib/mock/mock-reviews"),
      import("@/lib/mock/mock-gbp-reviews"),
    ]);
    let overrides: Record<string, ReviewOverride> = {};
    try {
      const s = typeof window !== "undefined" && window.localStorage.getItem(mockKey);
      overrides = s ? JSON.parse(s) : {};
    } catch { /* ignore */ }

    const STAR_MAP_LOCAL = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const;
    const gbpIds = mockGBPReviews.map((_: unknown, i: number) => `gbp-mock-${i}`);
    const gbpDefaults = mockGBPReviews.map((g: { reviewReply?: unknown }, i: number) => ({
      id: gbpIds[i],
      reply_status: g.reviewReply ? "published" : "pending",
    }));
    const psIds = mockPlayReviews.map((r: { id: string }) => r.id);
    const all: { id: string; reply_status: string }[] = [
      ...mockPlayReviews.map((r: { id: string; reply_status: string }) => ({ id: r.id, reply_status: r.reply_status })),
      ...gbpDefaults,
    ];
    void STAR_MAP_LOCAL; void psIds;
    return all.filter((r) => {
      const override = overrides[r.id] as ReviewOverride | undefined;
      const status = override?.reply_status ?? r.reply_status;
      return status === "pending";
    }).length;
  }

  const supabase = createClient();
  const { count: pending } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("reply_status", "pending");
  return pending ?? 0;
}

function usePendingReviewCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const n = await computePendingCount();
      if (!cancelled) setCount(n);
    }
    refresh();

    function handleAutoReplyComplete() { refresh(); }
    window.addEventListener("reviewpilot:auto-reply-complete", handleAutoReplyComplete);
    return () => {
      cancelled = true;
      window.removeEventListener("reviewpilot:auto-reply-complete", handleAutoReplyComplete);
    };
  }, []);

  return count;
}

function useActiveIssueCount() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (IS_MOCK) return; // No issues in mock mode
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/issues?status=active");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCount((data.issues ?? []).length);
      } catch {
        /* ignore */
      }
    }
    refresh();

    // Refresh when:
    // - the user dismisses / marks-fixed / reopens an issue (issues page or
    //   ActiveIssues card fires this)
    // - a sync/reply cycle just completed (cron classifier may have created
    //   new clusters)
    function handleChange() {
      refresh();
    }
    window.addEventListener("reviewpilot:issues-changed", handleChange);
    window.addEventListener("reviewpilot:auto-reply-complete", handleChange);
    return () => {
      cancelled = true;
      window.removeEventListener("reviewpilot:issues-changed", handleChange);
      window.removeEventListener("reviewpilot:auto-reply-complete", handleChange);
    };
    // Re-run on pathname change too — covers the case where the user
    // navigates to the issues page after editing data elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return count;
}

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; badge?: string };

const WORKSPACE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inbox", href: "/dashboard/inbox", icon: Inbox },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "AI Issue Tracker", href: "/dashboard/issues", icon: AlertTriangle },
  // ASO Analysis is plan-gated (Growth/Agency). It is shown with NO badge to
  // users who have access and hidden entirely from free/starter — see the
  // plan filter in the component body. To instead surface it as an upsell
  // "locked teaser" for non-access users later, drop the filter and give this
  // item `badge: "Growth+"` only when !canAso (the generic badge renderer in
  // NavRow already handles rendering it). UpgradeGate (page) + API 403 remain
  // the real access controls regardless.
  { label: "ASO Analysis", href: "/dashboard/aso", icon: Rocket },
  // Version Impact is visible to ALL plans (the comparison + theme deltas are
  // free). Unlike ASO, its row is NOT plan-filtered below — only the AI verdict
  // panel inside the page is gated to Growth/Agency.
  { label: "Version Impact", href: "/dashboard/version-impact", icon: GitCompareArrows },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
];

const RESOURCES_NAV: NavItem[] = [
  { label: "Help & Docs", href: "/dashboard/docs", icon: BookOpen },
];

const SETTINGS_NAV: NavItem[] = [
  { label: "General", href: "/dashboard/settings", icon: Settings },
  { label: "Connections", href: "/dashboard/settings/connections", icon: Link2 },
  { label: "AI Configuration", href: "/dashboard/settings/ai-config", icon: Bot },
  { label: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
  { label: "Team", href: "/dashboard/settings/team", icon: Users },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
];

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

export function Sidebar({
  collapsed,
  mobile,
  onToggleCollapsed,
}: {
  collapsed?: boolean;
  mobile?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const pendingCount = usePendingReviewCount();
  const issueCount = useActiveIssueCount();
  const { plan, totalAiUsed, aiLimit, isAiUnlimited, aiPercent, resetDate, periodLabel, isLoading: usageLoading } = useUsage();
  const { isOwner, canManageConnections, canEditAIConfig } = useTeamRole();
  const { can } = usePlan();
  const reduceMotion = useReducedMotion();

  // Plan-gated workspace items. ASO Analysis is hidden from free/starter (and
  // during plan load, where `can` defaults to false) and shown badge-free to
  // Growth/Agency — same `can("aso_analysis")` check the page's UpgradeGate uses.
  const visibleWorkspaceNav = WORKSPACE_NAV.filter((item) =>
    item.href === "/dashboard/aso" ? can("aso_analysis") : true
  );
  // On mobile (in a Sheet), always render the fully-expanded layout.
  const isCollapsed = !mobile && !!collapsed;
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith("/dashboard/settings")
  );
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const visibleSettingsNav = SETTINGS_NAV.filter((item) => {
    if (item.href === "/dashboard/settings/connections" && !canManageConnections) return false;
    if (item.href === "/dashboard/settings/ai-config" && !canEditAIConfig) return false;
    if (item.href === "/dashboard/settings/notifications" && !canEditAIConfig) return false;
    if (item.href === "/dashboard/settings/billing" && !isOwner) return false;
    return true;
  });

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  // Compute days-until-reset for the plan card
  const msUntilReset = resetDate.getTime() - Date.now();
  const resetText = (() => {
    if (msUntilReset < 60 * 60 * 1000) {
      const mins = Math.max(1, Math.ceil(msUntilReset / 60000));
      return `Resets in ${mins} min`;
    }
    if (msUntilReset < 24 * 60 * 60 * 1000) {
      const hrs = Math.ceil(msUntilReset / 3600000);
      return `Resets in ${hrs}h`;
    }
    const days = Math.ceil(msUntilReset / (24 * 60 * 60 * 1000));
    return `Resets in ${days} day${days === 1 ? "" : "s"}`;
  })();

  // Width target for framer animation. Mobile sheet keeps width:auto.
  const targetWidth = mobile ? undefined : isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  function NavRow({ item, showBadge = false }: { item: NavItem; showBadge?: boolean }) {
    const active = isActive(item.href);
    const linkClasses = cn(
      "group relative flex items-center rounded-lg text-sm transition-colors duration-150",
      isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
      active
        ? "bg-accent/40 text-foreground font-semibold"
        : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
    );
    const inner = (
      <Link href={item.href} className={linkClasses} aria-current={active ? "page" : undefined}>
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[linear-gradient(180deg,#6366f1,#8b5cf6,#d946ef)]"
          />
        )}
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0",
            active && "text-accent"
          )}
          aria-hidden
        />
        {!isCollapsed && (
          <>
            <motion.span
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.15, delay: reduceMotion ? 0 : 0.1 }}
              className="flex-1 truncate"
            >
              {item.label}
            </motion.span>
            {showBadge && item.href === "/dashboard/inbox" && pendingCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent/15 px-1.5 text-[10px] font-semibold text-accent ring-1 ring-accent/30">
                {pendingCount}
              </span>
            )}
            {showBadge && item.href === "/dashboard/issues" && issueCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
                {issueCount}
              </span>
            )}
            {showBadge && item.href === "/dashboard/campaigns" && (
              <span className="flex items-center rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                Soon
              </span>
            )}
            {showBadge && item.badge && (
              <span className="flex items-center rounded-full bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-accent ring-1 ring-accent/30">
                {item.badge}
              </span>
            )}
          </>
        )}
        {isCollapsed && showBadge && item.href === "/dashboard/inbox" && pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-accent-foreground">
            {pendingCount}
          </span>
        )}
        {isCollapsed && showBadge && item.href === "/dashboard/issues" && issueCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-semibold text-white">
            {issueCount}
          </span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium text-xs">
            {item.label}
            {item.href === "/dashboard/inbox" && pendingCount > 0 && (
              <span className="ml-1.5 text-accent">· {pendingCount}</span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }
    return inner;
  }

  function SectionLabel({ children }: { children: React.ReactNode }) {
    if (isCollapsed) {
      return <div className="my-2 mx-2 border-t border-border/60" />;
    }
    return (
      <p className="px-3 pt-3 pb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
        {children}
      </p>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={targetWidth !== undefined ? { width: targetWidth } : undefined}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
      style={mobile ? { width: "100%" } : undefined}
      className={cn(
        "flex flex-col border-r border-border/60 bg-card/60 backdrop-blur-sm h-full",
        !mobile && "hidden lg:flex h-screen sticky top-0"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-border/60",
        isCollapsed ? "justify-center px-2" : "gap-2.5 px-4"
      )}>
        <img
          src="/favicon.svg"
          alt="ReviewPilot logo"
          className="h-9 w-9 shrink-0"
          aria-hidden="true"
        />
        {!isCollapsed && (
          <span className="font-sans text-[15px] font-semibold tracking-tight">
            ReviewPilot
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className={cn(
        "flex-1 overflow-y-auto py-3 space-y-0.5",
        isCollapsed ? "px-2" : "px-3"
      )}>
        <SectionLabel>Workspace</SectionLabel>
        {visibleWorkspaceNav.map((item) => (
          <NavRow key={item.href} item={item} showBadge />
        ))}

        <SectionLabel>Resources</SectionLabel>
        {RESOURCES_NAV.map((item) => (
          <NavRow key={item.href} item={item} />
        ))}

        <SectionLabel>Settings</SectionLabel>
        {isCollapsed ? (
          <CollapsedSettingsFlyout
            items={visibleSettingsNav}
            pathname={pathname}
            isActive={isActive}
          />
        ) : (
          <>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                pathname.startsWith("/dashboard/settings")
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
              )}
              aria-expanded={settingsOpen}
            >
              <Settings className="h-[18px] w-[18px]" />
              <span className="flex-1 text-left">Settings</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  settingsOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-out",
                settingsOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="ml-4 pl-3 border-l border-border/60 space-y-0.5 py-1">
                {visibleSettingsNav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                        active
                          ? "text-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Feedback — opens FeedbackDialog. Lives in the Settings section as a first-class nav item. */}
        {isCollapsed ? (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                aria-label="Feedback"
                className="group relative flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent/20 hover:text-foreground transition-colors duration-150"
              >
                <MessageSquare className="h-[18px] w-[18px] shrink-0" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium text-xs">
              Feedback
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/20 hover:text-foreground transition-colors duration-150"
          >
            <MessageSquare className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <span className="flex-1 truncate text-left">Feedback</span>
          </button>
        )}
      </nav>

      {/* Plan footer */}
      <div className="border-t border-border/60">
        <div className={cn(isCollapsed ? "p-2" : "p-3")}>
          {isCollapsed ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                {isOwner ? (
                  <Link
                    href="/dashboard/settings/billing"
                    className="relative flex items-center justify-center rounded-lg p-2 bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] ring-1 ring-accent/30 hover:brightness-110 transition-all"
                    aria-label="Manage plan"
                  >
                    <CollapsedUsageRing percent={isAiUnlimited ? 5 : aiPercent} />
                  </Link>
                ) : (
                  <div className="relative flex items-center justify-center rounded-lg p-2 bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] ring-1 ring-accent/30">
                    <CollapsedUsageRing percent={isAiUnlimited ? 5 : aiPercent} />
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">
                {isAiUnlimited
                  ? `${plan.name} · Unlimited replies`
                  : `${totalAiUsed}/${aiLimit} replies — Manage plan`}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-[linear-gradient(135deg,rgba(99,102,241,0.08)_0%,rgba(139,92,246,0.05)_50%,rgba(217,70,239,0.08)_100%)] p-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="font-sans text-xs font-semibold tracking-tight">
                  {usageLoading ? "…" : `${plan.name} Plan`}
                </span>
              </div>
              {!usageLoading && (
                <>
                  <div className="w-full bg-muted/50 rounded-full h-1.5 mb-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        aiPercent > 90
                          ? "bg-destructive"
                          : aiPercent > 70
                          ? "bg-amber-500"
                          : "bg-[linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef)]"
                      )}
                      style={{ width: isAiUnlimited ? "5%" : `${Math.min(100, aiPercent)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-0.5 font-mono">
                    {isAiUnlimited
                      ? "Unlimited AI replies"
                      : `${totalAiUsed}/${aiLimit} replies this ${periodLabel}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mb-2 font-mono">
                    {isAiUnlimited ? "Enjoy unlimited" : resetText}
                  </p>
                </>
              )}
              {isOwner ? (
                <Link
                  href="/dashboard/settings/billing"
                  className="block text-center text-xs font-semibold text-white bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] hover:brightness-110 rounded-lg py-1.5 transition-all shadow-[0_0_16px_-4px_hsl(var(--ring)/0.6)]"
                >
                  {plan.name === "Free" ? "Upgrade Plan" : "Manage Plan"}
                </Link>
              ) : (
                <p className="text-center text-[10px] text-muted-foreground/70 mt-1">
                  Only the workspace owner can manage billing.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Mini action row: theme · feedback · shortcuts · collapse */}
        <div className={cn(
          "flex items-center border-t border-border/60",
          isCollapsed ? "flex-col gap-1 px-2 py-2" : "justify-between px-2 py-1.5"
        )}>
          {isCollapsed ? (
            <>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div><ThemeToggle /></div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Toggle theme</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/20 hover:text-foreground transition-colors"
                    aria-label="Keyboard shortcuts"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Keyboard shortcuts</TooltipContent>
              </Tooltip>
              {!mobile && onToggleCollapsed && (
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleCollapsed}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/20 hover:text-foreground transition-colors"
                      aria-label="Expand sidebar"
                    >
                      <PanelLeftOpen className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs flex items-center gap-1.5">
                    Expand sidebar
                    <kbd className="px-1 py-0.5 rounded bg-muted/60 font-mono text-[10px]">[</kbd>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-0.5">
                <ThemeToggle />
                <button
                  onClick={() => {
                    document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/20 hover:text-foreground transition-colors"
                  aria-label="Keyboard shortcuts"
                  title="Keyboard shortcuts (?)"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
              {!mobile && onToggleCollapsed && (
                <button
                  onClick={onToggleCollapsed}
                  className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-[11px] text-muted-foreground/70 hover:bg-accent/20 hover:text-foreground transition-colors"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar ([)"
                >
                  <PanelLeftClose className="h-4 w-4" />
                  <kbd className="px-1 py-0.5 rounded bg-muted/60 font-mono text-[10px]">[</kbd>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </motion.aside>
  );
}

/**
 * Hover-activated flyout for the Settings group when the sidebar is collapsed.
 * Shows all settings sub-items in a portaled popover, so users still get to
 * Billing/Team/AI Config without expanding the rail.
 *
 * Uses a small grace timer on close so the cursor can move from the trigger
 * into the popover without losing focus.
 */
function CollapsedSettingsFlyout({
  items,
  pathname,
  isActive,
}: {
  items: NavItem[];
  pathname: string;
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsActive = pathname.startsWith("/dashboard/settings");

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }
  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }
  function openNow() {
    cancelClose();
    setOpen(true);
  }

  useEffect(() => () => cancelClose(), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Link
          href="/dashboard/settings"
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
          onFocus={openNow}
          onBlur={scheduleClose}
          aria-label="Settings"
          className={cn(
            "group relative flex items-center justify-center rounded-lg px-2 py-2 transition-colors",
            settingsActive
              ? "bg-accent/40 text-foreground"
              : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
          )}
        >
          {settingsActive && (
            <span
              aria-hidden
              className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[linear-gradient(180deg,#6366f1,#8b5cf6,#d946ef)]"
            />
          )}
          <Settings className={cn("h-[18px] w-[18px]", settingsActive && "text-accent")} />
        </Link>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-56 p-1.5 rounded-xl border-border/60 shadow-lg"
      >
        <p className="px-2 pt-1 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
          Settings
        </p>
        <div className="space-y-0.5">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CollapsedUsageRing({ percent }: { percent: number }) {
  const radius = 8;
  const stroke = 2;
  const c = 2 * Math.PI * radius;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 20 20" className="absolute inset-0">
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          stroke="url(#rp-ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 10 10)"
        />
        <defs>
          <linearGradient id="rp-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
      <Sparkles className="h-2.5 w-2.5 text-accent relative z-10" />
    </span>
  );
}
