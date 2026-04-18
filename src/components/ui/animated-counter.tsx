"use client";

import NumberFlow, { type Format } from "@number-flow/react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  format?: Format;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Animated numeric counter (wraps @number-flow/react). Respects
 * prefers-reduced-motion automatically via the underlying library.
 */
export function AnimatedCounter({
  value,
  format,
  prefix,
  suffix,
  className,
}: AnimatedCounterProps) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix}
      <NumberFlow value={value} format={format} />
      {suffix}
    </span>
  );
}
