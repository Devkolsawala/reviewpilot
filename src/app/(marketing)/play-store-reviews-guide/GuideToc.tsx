"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TocItem = {
  label: string;
  href: string;
};

export function GuideToc({ items }: { items: TocItem[] }) {
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? "");

  useEffect(() => {
    const sectionIds = items.map((item) => item.href.slice(1));

    const updateActive = () => {
      const current = sectionIds
        .map((id) => {
          const el = document.getElementById(id);
          return el ? { id, top: el.getBoundingClientRect().top } : null;
        })
        .filter((entry): entry is { id: string; top: number } => Boolean(entry))
        .filter((entry) => entry.top <= 160)
        .sort((a, b) => b.top - a.top)[0];

      if (current) setActiveHref(`#${current.id}`);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [items]);

  return (
    <nav className="rounded-2xl border border-border/60 bg-background/70 p-3 shadow-[0_18px_70px_rgba(79,70,229,0.10)] backdrop-blur-xl dark:bg-card/55">
      <p className="mb-3 px-3 pt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Guide sections
      </p>
      <ol className="space-y-1">
        {items.map((item) => {
          const isActive = activeHref === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "true" : undefined}
                className={`group relative block rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "border border-violet-400/30 bg-[linear-gradient(135deg,rgba(99,102,241,0.16),rgba(217,70,239,0.12))] text-foreground shadow-[0_10px_30px_rgba(99,102,241,0.16)] ring-1 ring-white/40"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute left-1 top-1/2 h-5 -translate-y-1/2 rounded-full transition-all ${
                    isActive ? "w-1 bg-violet-500 opacity-100" : "w-0 opacity-0"
                  }`}
                />
                <span className="block pl-2">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
