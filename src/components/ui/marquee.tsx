"use client";

import { cn } from "@/lib/utils";
import { type ReactNode, Children } from "react";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
  /** Tailwind duration class override (default animate-marquee = 40s). */
  speed?: string;
}

/**
 * Infinite horizontal marquee — duplicates children once so the CSS
 * translate(-50%) loop is seamless. Edges fade via mask.
 */
export function Marquee({
  children,
  className,
  pauseOnHover = true,
  reverse = false,
  speed,
}: MarqueeProps) {
  const items = Children.toArray(children);

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-max shrink-0 items-center gap-12",
          speed ?? "animate-marquee",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
        {items}
        {items}
      </div>
    </div>
  );
}
