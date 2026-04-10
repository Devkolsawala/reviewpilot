"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronDown,
  Sparkles,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUsage } from "@/hooks/useUsage";
import { useTeamRole } from "@/hooks/useTeamRole";
import { USAGE_PERIOD } from "@/lib/plans";

const MOCK_OVERRIDES_PREFIX = "reviewpilot_mock_overrides";
const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

type ReviewOverride = { reply_status?: string };

async function computePendingCount(): Promise<number> {
  if (IS_MOCK) {
    // Get user ID so we read the correct per-user overrides key
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
    void STAR_MAP_LOCAL; void psIds; // used implicitly via mockPlayReviews
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

const MAIN_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Review Inbox", href: "/dashboard/inbox", icon: Inbox },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "Help & Docs", href: "/dashboard/docs", icon: BookOpen },
];

const SETTINGS_NAV = [
  { label: "General", href: "/dashboard/settings", icon: Settings },
  { label: "Connections", href: "/dashboard/settings/connections", icon: Link2 },
  { label: "AI Configuration", href: "/dashboard/settings/ai-config", icon: Bot },
  { label: "Team", href: "/dashboard/settings/team", icon: Users },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
];

export function Sidebar({ collapsed, mobile }: { collapsed?: boolean; mobile?: boolean }) {
  const pathname = usePathname();
  const pendingCount = usePendingReviewCount();
  const { plan, totalAiUsed, aiLimit, isAiUnlimited, aiPercent, isLoading: usageLoading } = useUsage();
  const { isOwner } = useTeamRole();
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith("/dashboard/settings")
  );

  // Non-owners (admin / read-only) cannot access Connections or Billing
  const visibleSettingsNav = SETTINGS_NAV.filter((item) => {
    if (!isOwner && item.href === "/dashboard/settings/connections") return false;
    if (!isOwner && item.href === "/dashboard/settings/billing") return false;
    return true;
  });

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card h-full transition-all duration-200 ease-out",
        !mobile && "hidden lg:flex h-screen sticky top-0",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white font-heading font-bold text-sm shrink-0 shadow-sm">
          RP
        </div>
        {!collapsed && (
          <span className="font-heading text-lg font-bold tracking-tight">
            ReviewPilot
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {MAIN_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {/* Active left accent bar */}
              {active && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-teal-500" />
              )}
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-teal-600 dark:text-teal-400")} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/dashboard/inbox" && pendingCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                  {item.href === "/dashboard/campaigns" && (
                    <span className="flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  )}
                </>
              )}
              {collapsed && item.href === "/dashboard/inbox" && pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="pt-3 pb-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Settings
            </p>
          )}
          {collapsed && <div className="border-t mx-2" />}
        </div>

        {/* Settings section */}
        {collapsed ? (
          <Link
            href="/dashboard/settings"
            title="Settings"
            className={cn(
              "flex items-center justify-center rounded-lg p-2.5 transition-colors",
              pathname.startsWith("/dashboard/settings")
                ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Settings className="h-[18px] w-[18px]" />
          </Link>
        ) : (
          <>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-150"
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
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
                        active
                          ? "text-teal-700 font-medium dark:text-teal-300"
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
      </nav>

      {/* Keyboard shortcuts hint */}
      {!collapsed && (
        <div className="px-4 pb-2">
          <button
            onClick={() => {
              // Dispatch a synthetic "?" keydown to trigger the global modal
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
            }}
            className="flex items-center gap-2 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors w-full px-3 py-1.5"
          >
            <HelpCircle className="h-3 w-3" />
            Press <kbd className="px-1 py-0.5 rounded bg-secondary text-[10px] font-mono">?</kbd> for shortcuts
          </button>
        </div>
      )}

      {/* Plan badge footer */}
      <div className="border-t p-3">
        {collapsed ? (
          <Link
            href="/dashboard/settings/billing"
            className="flex items-center justify-center rounded-lg p-2 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30"
            title="Upgrade Plan"
          >
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </Link>
        ) : (
          <div className="rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                {usageLoading ? "…" : `${plan.name} Plan`}
              </span>
            </div>
            {!usageLoading && (
              <>
                <div className="w-full bg-teal-200/50 dark:bg-teal-900/50 rounded-full h-1.5 mb-2">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      aiPercent > 90 ? "bg-red-500" : aiPercent > 70 ? "bg-amber-500" : "bg-teal-500"
                    )}
                    style={{ width: isAiUnlimited ? "5%" : `${aiPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-teal-700/70 dark:text-teal-400/70 mb-1">
                  {isAiUnlimited
                    ? "Unlimited AI replies"
                    : `${totalAiUsed}/${aiLimit} AI replies this ${USAGE_PERIOD.label}`}
                </p>
                {!isAiUnlimited && (
                  <p className="text-[10px] text-teal-700/50 dark:text-teal-400/50 mb-2">
                    {(() => {
                      const resetDate = USAGE_PERIOD.getResetDate();
                      const msUntilReset = resetDate.getTime() - Date.now();
                      if (msUntilReset < 60 * 60 * 1000) {
                        const mins = Math.max(1, Math.ceil(msUntilReset / 60000));
                        return `Resets in ${mins} min`;
                      }
                      if (msUntilReset < 24 * 60 * 60 * 1000) {
                        const hrs = Math.ceil(msUntilReset / 3600000);
                        return `Resets in ${hrs}h`;
                      }
                      return `Resets ${resetDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
                    })()}
                  </p>
                )}
              </>
            )}
            <Link
              href="/dashboard/settings/billing"
              className="block text-center text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-lg py-1.5 transition-all shadow-sm"
            >
              {plan.name === "Free" ? "Upgrade Plan" : "Manage Plan"}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
