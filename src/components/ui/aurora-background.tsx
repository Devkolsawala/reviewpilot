import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  /** Lower opacity for subtle backgrounds under text-heavy sections. */
  intensity?: "subtle" | "normal" | "strong";
}

/**
 * Purely decorative animated aurora. Place absolutely inside a relative parent.
 * Marked aria-hidden — contributes no semantics.
 */
export function AuroraBackground({
  className,
  intensity = "normal",
}: AuroraBackgroundProps) {
  const opacity =
    intensity === "subtle" ? "opacity-40" : intensity === "strong" ? "opacity-90" : "opacity-70";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "absolute -inset-[20%] bg-aurora animate-aurora",
          opacity,
        )}
      />
    </div>
  );
}
