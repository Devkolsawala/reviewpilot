"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Menu,
  LogOut,
  Settings,
  User,
  Check,
  ChevronsUpDown,
  Store,
  Globe,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlobalSearch, SearchTrigger } from "@/components/dashboard/GlobalSearch";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { usePlan } from "@/hooks/usePlan";
import { useConnections } from "@/hooks/useConnection";
import type { Connection, ConnectionType } from "@/types/connection";

const SOURCE_LABEL: Record<ConnectionType, string> = {
  google_business: "Google Business",
  play_store: "Play Store",
  whatsapp: "WhatsApp",
};

function sourceIcon(type: ConnectionType) {
  if (type === "play_store") return Store;
  if (type === "whatsapp") return MessageCircle;
  return Globe;
}

// Pathname → breadcrumb segments. Caps depth at 4 to stay compact.
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  inbox: "Inbox",
  analytics: "Analytics",
  aso: "ASO Analysis",
  campaigns: "Campaigns",
  docs: "Help & Docs",
  settings: "Settings",
  connections: "Connections",
  "ai-config": "AI Configuration",
  notifications: "Notifications",
  team: "Team",
  billing: "Billing",
  "accept-invite": "Accept Invite",
};

function buildCrumbs(pathname: string) {
  const segs = pathname.split("/").filter(Boolean);
  // Always anchor at /dashboard
  const crumbs: { label: string; href: string }[] = [];
  let acc = "";
  for (const seg of segs) {
    acc += `/${seg}`;
    if (seg === "dashboard") {
      crumbs.push({ label: "Dashboard", href: "/dashboard" });
      continue;
    }
    const label = SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    crumbs.push({ label, href: acc });
  }
  return crumbs;
}

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { plan } = usePlan();
  const { connections } = useConnections();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null }>({ full_name: null, email: null });

  const crumbs = useMemo(() => buildCrumbs(pathname || "/dashboard"), [pathname]);

  // Active source — picks the first non-WhatsApp review source for display.
  const reviewSources: Connection[] = useMemo(
    () => connections.filter((c) => c.type === "play_store" || c.type === "google_business"),
    [connections]
  );
  const activeSource = reviewSources[0];

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setProfile({ full_name: data?.full_name ?? null, email: user.email ?? null });
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/70 backdrop-blur-xl px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Workspace/source switcher — hidden on small screens */}
          {activeSource && (
            <div className="hidden sm:block">
              <WorkspaceSwitcher
                sources={reviewSources}
                active={activeSource}
              />
            </div>
          )}

          {/* Breadcrumbs — hidden on small screens to keep the bar tidy */}
          {crumbs.length > 0 && (
            <Breadcrumb className="hidden md:block min-w-0">
              <BreadcrumbList>
                {crumbs.map((c, i) => {
                  const last = i === crumbs.length - 1;
                  return (
                    <span key={c.href} className="inline-flex items-center gap-1.5">
                      {i > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {last ? (
                          <BreadcrumbPage>{c.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </span>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <SearchTrigger onClick={() => setSearchOpen(true)} />

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="Account menu">
                <Avatar className="h-8 w-8 ring-1 ring-border/60">
                  <AvatarFallback className="bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] text-white text-xs font-semibold">
                    {profile.full_name
                      ? profile.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                      : profile.email
                      ? profile.email[0]?.toUpperCase() ?? "?"
                      : "?"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl border-border/60">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium truncate">{profile.full_name || "Your Account"}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email || ""}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {plan.name} Plan
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <User className="mr-2 h-4 w-4" />
                  Account settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing &amp; plan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/notifications">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global search modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

function WorkspaceSwitcher({
  sources,
  active,
}: {
  sources: Connection[];
  active: Connection;
}) {
  const ActiveIcon = sourceIcon(active.type);
  const onlyOne = sources.length <= 1;

  if (onlyOne) {
    return (
      <Link
        href="/dashboard/settings/connections"
        className="group flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-2.5 text-xs hover:border-accent/40 hover:bg-accent/5 transition-colors"
        title="Manage connections"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/10 ring-1 ring-accent/20">
          <ActiveIcon className="h-3 w-3 text-accent" />
        </span>
        <span className="font-medium text-foreground/90 max-w-[140px] truncate">{active.name}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {SOURCE_LABEL[active.type]}
        </span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-2.5 text-xs hover:border-accent/40 hover:bg-accent/5 transition-colors"
          aria-label="Switch source"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/10 ring-1 ring-accent/20">
            <ActiveIcon className="h-3 w-3 text-accent" />
          </span>
          <span className="font-medium text-foreground/90 max-w-[140px] truncate">{active.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {SOURCE_LABEL[active.type]}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 rounded-xl border-border/60">
        <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
          Connected sources
        </DropdownMenuLabel>
        {sources.map((s) => {
          const Icon = sourceIcon(s.type);
          const isActive = s.id === active.id;
          return (
            <DropdownMenuItem key={s.id} asChild>
              <Link href={`/dashboard/settings/connections/${s.id}`} className="flex items-center gap-2.5 py-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 ring-1 ring-accent/20">
                  <Icon className="h-3 w-3 text-accent" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                    {SOURCE_LABEL[s.type]}
                  </p>
                </div>
                {isActive && <Check className="h-3.5 w-3.5 text-accent" />}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="bg-border/60" />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/connections" className="text-xs text-accent">
            Manage connections →
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
