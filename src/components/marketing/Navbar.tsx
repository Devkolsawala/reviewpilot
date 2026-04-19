"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CommandMenu } from "./CommandMenu";
import { m, MotionProvider } from "@/components/motion/primitives";

type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
};

const NAV_LINKS: NavLink[] = [
  {
    label: "Product",
    href: "/#features",
    children: [
      {
        label: "Play Store automation",
        href: "/features/google-play-reviews",
        description: "AI replies within the 350-char limit",
      },
      {
        label: "Google Business Profile",
        href: "/features/google-business-profile",
        description: "One unified inbox for every location",
      },
      {
        label: "How it works",
        href: "/how-it-works",
        description: "Connect, draft, approve — in 3 steps",
      },
    ],
  },
  {
    label: "Solutions",
    href: "#",
    children: [
      {
        label: "For app developers",
        href: "/for-app-developers",
        description: "Protect your Play Store rating at scale",
      },
      {
        label: "For local businesses",
        href: "/for-local-business",
        description: "Every Google review, handled overnight",
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Docs", href: "/docs" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] text-white text-[13px] font-bold shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)]">
              RP
            </div>
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
                      <div className="w-[320px] rounded-xl border border-border/60 bg-popover p-2 shadow-xl shadow-black/5">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
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
                        ))}
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
            <button
              onClick={() => setCmdkOpen(true)}
              className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-border"
              aria-label="Open search (Cmd+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="ml-1 hidden lg:inline-flex h-5 items-center rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>
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
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm">
                <nav className="flex flex-col gap-1 pt-6">
                  {NAV_LINKS.flatMap((link) =>
                    link.children
                      ? [
                          <div
                            key={link.label}
                            className="px-2 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {link.label}
                          </div>,
                          ...link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className="rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-accent/10"
                            >
                              {child.label}
                            </Link>
                          )),
                        ]
                      : [
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-accent/10"
                          >
                            {link.label}
                          </Link>,
                        ],
                  )}
                </nav>
                <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-6">
                  <Button variant="outline" asChild>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                  <Button variant="gradient" asChild>
                    <Link href="/signup" onClick={() => setMobileOpen(false)}>
                      Start free trial
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <CommandMenu open={cmdkOpen} onOpenChange={setCmdkOpen} />
      </header>
    </MotionProvider>
  );
}
