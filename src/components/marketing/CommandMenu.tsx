"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Home,
  DollarSign,
  BookOpen,
  Smartphone,
  MapPin,
  Sparkles,
  PlayCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { group: "Go to", icon: Home, label: "Home", href: "/" },
  { group: "Go to", icon: DollarSign, label: "Pricing", href: "/pricing" },
  { group: "Go to", icon: PlayCircle, label: "How it works", href: "/how-it-works" },
  { group: "Go to", icon: BookOpen, label: "Blog", href: "/blog" },
  { group: "Go to", icon: BookOpen, label: "Docs", href: "/docs" },
  {
    group: "Solutions",
    icon: Smartphone,
    label: "For app developers",
    href: "/for-app-developers",
  },
  {
    group: "Solutions",
    icon: MapPin,
    label: "For local businesses",
    href: "/for-local-business",
  },
  {
    group: "Features",
    icon: Sparkles,
    label: "Google Play review automation",
    href: "/features/google-play-reviews",
  },
  {
    group: "Features",
    icon: Sparkles,
    label: "Google Business Profile automation",
    href: "/features/google-business-profile",
  },
  { group: "Account", icon: LogIn, label: "Log in", href: "/login" },
  { group: "Account", icon: UserPlus, label: "Start free trial", href: "/signup" },
];

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  const grouped = ITEMS.reduce<Record<string, typeof ITEMS>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-background/70 backdrop-blur-sm px-4 pt-[15vh]"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border/60 bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Global command menu" loop>
          <div className="flex items-center gap-3 border-b border-border/60 px-4">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
            <Command.Input
              autoFocus
              placeholder="Search pages, features…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              Esc
            </kbd>
          </div>
          <Command.List className="max-h-[55vh] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            {Object.entries(grouped).map(([group, items]) => (
              <Command.Group
                key={group}
                heading={group}
                className="mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.href}
                      value={`${item.group} ${item.label}`}
                      onSelect={() => {
                        router.push(item.href);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm",
                        "aria-selected:bg-accent/10 aria-selected:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {item.label}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
