"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Bell, Menu, LogOut, Settings, User, Star, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlobalSearch, SearchTrigger } from "@/components/dashboard/GlobalSearch";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/usePlan";
import Link from "next/link";

const NOTIFICATIONS: { id: string; icon: typeof Star; color: string; bg: string; text: string; time: string; unread: boolean }[] = [];

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { plan } = usePlan();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null }>({ full_name: null, email: null });
  const unreadCount = notifications.filter((n) => n.unread).length;

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

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/70 backdrop-blur-xl px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <SearchTrigger onClick={() => setSearchOpen(true)} />
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-accent-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl border-border/60">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-sans text-sm font-semibold tracking-tight">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-accent hover:underline flex items-center gap-1">
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator className="bg-border/60" />
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex items-start gap-3 py-3 px-3 cursor-pointer">
                    <div className={cn("rounded-lg p-1.5 mt-0.5 shrink-0", n.bg)}>
                      <n.icon className={cn("h-3.5 w-3.5", n.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs leading-snug", n.unread ? "font-medium" : "text-muted-foreground")}>
                        {n.text}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">{n.time}</span>
                    </div>
                    {n.unread && <span className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8 ring-1 ring-border/60">
                  <AvatarFallback className="bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] text-white text-xs font-semibold">
                    {profile.full_name
                      ? profile.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                      : "?"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/60">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{profile.full_name || "Your Account"}</p>
                  <p className="text-xs text-muted-foreground">{profile.email || ""}</p>
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
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
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
