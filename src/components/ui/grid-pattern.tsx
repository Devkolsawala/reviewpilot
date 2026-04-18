import { cn } from "@/lib/utils";

interface GridPatternProps {
  className?: string;
  variant?: "grid" | "dots";
  /** Apply a radial fade mask so edges dissolve. */
  fade?: boolean;
}

/**
 * Decorative grid / dot background. Absolute-positioned, aria-hidden.
 */
export function GridPattern({
  className,
  variant = "grid",
  fade = true,
}: GridPatternProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        variant === "grid"
          ? "bg-grid-pattern bg-grid"
          : "bg-dot-pattern bg-dots",
        fade && "mask-radial-fade",
        className,
      )}
    />
  );
}
