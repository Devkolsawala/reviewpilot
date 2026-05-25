"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { m, MotionProvider } from "@/components/motion/primitives";
import { createClient } from "@/lib/supabase/client";

type NavChild = {
  label: string;
  href: string;
  description?: string;
  section?: string;
};

type NavLink = {
  label: string;
  href: string;
  children?: NavChild[];
};

const NAV_LINKS: NavLink[] = [
  {
    label: "Solutions",
    href: "#",
    children: [
      {
        section: "By platform",
        label: "Google Play Store",
        href: "/integrations/google-play-store",
        description: "AI replies within the 350-char limit",
      },
      {
        section: "By platform",
        label: "Google Business Profile",
        href: "/integrations/google-business-profile",
        description: "One unified inbox for every location",
      },
      {
        section: "By platform",
        label: "WhatsApp Business",
        href: "/integrations/whatsapp-business",
        description: "Meta Cloud API + Embedded Signup",
      },
      {
        section: "By business type",
        label: "For app developers",
        href: "/for-app-developers",
        description: "Protect your Play Store rating at scale",
      },
      {
        section: "By business type",
        label: "For local businesses",
        href: "/for-local-business",
        description: "Google reviews + WhatsApp, on autopilot",
      },
    ],
  },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Resources",
    href: "#",
    children: [
      {
        label: "Blog",
        href: "/blog",
        description: "Guides, playbooks & product updates",
      },
      {
        label: "Docs",
        href: "/docs",
        description: "Setup guides and API reference",
      },
      {
        label: "Free Tools",
        href: "/tools/play-store-analyzer",
        description: "Play Store Analyzer, AI Reply Generator & more",
      },
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setIsAuthed(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAuthed(!!session?.user);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <MotionProvider>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "glass border-b border-border/50"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300",
            scrolled ? "h-14" : "h-16",
          )}
        >
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/favicon.svg"
              alt="ReviewPilot logo"
              className="h-8 w-8 shrink-0"
              aria-hidden="true"
            />
            <span className="font-sans text-[15px] font-semibold tracking-tight text-foreground">
              ReviewPilot
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active =
                link.href !== "#" &&
                (link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href.split("#")[0]) &&
                    link.href.split("#")[0] !== "/");

              if (link.children) {
                return (
                  <div
                    key={link.label}
                    className="group relative"
                  >
                    <button
                      className="flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <div className="w-[340px] rounded-xl border border-border/60 bg-popover p-2 shadow-xl shadow-black/5">
                        {link.children.map((child, idx) => {
                          const prevSection = idx > 0 ? link.children![idx - 1].section : undefined;
                          const showHeader = child.section && child.section !== prevSection;
                          return (
                            <div key={child.href}>
                              {showHeader && (
                                <div
                                  className={cn(
                                    "px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                                    idx > 0 && "mt-1 border-t border-border/50",
                                  )}
                                >
                                  {child.section}
                                </div>
                              )}
                              <Link
                                href={child.href}
                                className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/10"
                              >
                                <span className="text-sm font-medium text-foreground">
                                  {child.label}
                                </span>
                                {child.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {child.description}
                                  </span>
                                )}
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <m.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-md bg-accent/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/signup">Start free trial</Link>
            </Button>
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav-drawer"
                  className="h-11 w-11"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                hideCloseButton
                id="mobile-nav-drawer"
                aria-modal="true"
                className="flex flex-col gap-0 p-0 border-l border-border/60 w-[88vw] max-w-[360px] sm:max-w-[360px] overflow-hidden"
                style={{ height: "100dvh" }}
              >
                <VisuallyHidden.Root>
                  <SheetTitle>Site navigation</SheetTitle>
                  <SheetDescription>
                    Primary actions and links for ReviewPilot
                  </SheetDescription>
                </VisuallyHidden.Root>

                {/* Sticky header: logo + close */}
                <div
                  className="flex items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur-sm px-4"
                  style={{
                    paddingTop: "max(0.625rem, env(safe-area-inset-top))",
                    paddingBottom: "0.625rem",
                  }}
                >
                  <Link
                    href="/"
                    onClick={closeMobile}
                    className="flex items-center gap-2"
                  >
                    <img
                      src="/favicon.svg"
                      alt=""
                      className="h-7 w-7 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-sans text-[15px] font-semibold tracking-tight text-foreground">
                      ReviewPilot
                    </span>
                  </Link>
                  <SheetClose asChild>
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="inline-flex h-11 w-11 -mr-2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </SheetClose>
                </div>

                {/* Primary CTA block — above the fold */}
                <div className="border-b border-border/60 px-4 pt-4 pb-4 space-y-2">
                  {isAuthed ? (
                    <Button
                      variant="gradient"
                      className="w-full h-12 text-[15px] font-semibold"
                      asChild
                    >
                      <Link href="/dashboard" onClick={closeMobile}>
                        Go to dashboard
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="gradient"
                        className="w-full h-12 text-[15px] font-semibold"
                        asChild
                      >
                        <Link href="/signup" onClick={closeMobile}>
                          Start free trial
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-12 text-[15px] font-medium"
                        asChild
                      >
                        <Link href="/login" onClick={closeMobile}>
                          Log in
                        </Link>
                      </Button>
                    </>
                  )}
                </div>

                {/* Scrollable nav sections */}
                <nav
                  className="flex-1 overflow-y-auto overscroll-contain px-2 py-3"
                  aria-label="Mobile site navigation"
                >
                  {NAV_LINKS.map((link) => {
                    if (link.children) {
                      return (
                        <div key={link.label} className="mb-3">
                          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {link.label}
                          </div>
                          {link.children.map((child) => {
                            const active = pathname === child.href;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={closeMobile}
                                className={cn(
                                  "group flex min-h-[44px] items-center justify-between rounded-md px-3 py-3 text-[16px] font-medium transition-colors",
                                  active
                                    ? "bg-brand-500/10 text-brand-300"
                                    : "text-foreground hover:bg-accent/10 hover:text-brand-300 active:bg-accent/15",
                                )}
                              >
                                <span className="truncate pr-2">
                                  {child.label}
                                </span>
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 shrink-0 transition-opacity",
                                    active
                                      ? "opacity-70"
                                      : "opacity-30 group-hover:opacity-70",
                                  )}
                                />
                              </Link>
                            );
                          })}
                        </div>
                      );
                    }

                    const active =
                      link.href === "/"
                        ? pathname === "/"
                        : pathname?.startsWith(link.href.split("#")[0]) ?? false;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMobile}
                        className={cn(
                          "group flex min-h-[44px] items-center justify-between rounded-md px-3 py-3 text-[16px] font-medium transition-colors",
                          active
                            ? "bg-brand-500/10 text-brand-300"
                            : "text-foreground hover:bg-accent/10 hover:text-brand-300 active:bg-accent/15",
                        )}
                      >
                        <span>{link.label}</span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 transition-opacity",
                            active
                              ? "opacity-70"
                              : "opacity-30 group-hover:opacity-70",
                          )}
                        />
                      </Link>
                    );
                  })}
                </nav>

                {/* Sticky footer */}
                <div
                  className="border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 pt-3"
                  style={{
                    paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                  }}
                >
                  <div className="flex items-center justify-center gap-3 text-[13px] text-muted-foreground">
                    <Link
                      href="/pricing"
                      onClick={closeMobile}
                      className="rounded px-2 py-1 transition-colors hover:text-foreground"
                    >
                      Pricing
                    </Link>
                    <span aria-hidden="true" className="opacity-30">
                      •
                    </span>
                    <Link
                      href="/docs"
                      onClick={closeMobile}
                      className="rounded px-2 py-1 transition-colors hover:text-foreground"
                    >
                      Docs
                    </Link>
                    <span aria-hidden="true" className="opacity-30">
                      •
                    </span>
                    <Link
                      href="/demo"
                      onClick={closeMobile}
                      className="rounded px-2 py-1 transition-colors hover:text-foreground"
                    >
                      Contact
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </header>
    </MotionProvider>
  );
}
