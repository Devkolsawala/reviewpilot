"use client";

import { useEffect, useRef, useState } from "react";

type Section = { id: string; label: string };

export function FeaturesAnchorNav({ sections }: { sections: Section[] }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const link = linkRefs.current[activeId];
    if (link) {
      link.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeId]);

  const handleClick = (id: string) => () => {
    setActiveId(id);
  };

  return (
    <nav
      aria-label="Feature sections"
      className="sticky top-14 z-30 border-y border-border/60 bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ul
          className="scrollbar-hide flex items-center gap-1 overflow-x-auto scroll-smooth py-2 [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]"
        >
          {sections.map((s) => {
            const isActive = activeId === s.id;
            return (
              <li key={s.id} className="shrink-0">
                <a
                  ref={(el) => {
                    linkRefs.current[s.id] = el;
                  }}
                  href={`#${s.id}`}
                  onClick={handleClick(s.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={[
                    "inline-flex whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium tracking-tight",
                    "transition-all duration-300 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive
                      ? "text-foreground bg-gradient-to-b from-primary/15 to-primary/5 ring-1 ring-primary/20 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_-12px_hsl(var(--primary)/0.45)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  ].join(" ")}
                >
                  {s.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
