import { cn } from "@/lib/utils";
import type { ElementType, HTMLAttributes } from "react";

interface GradientTextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  animate?: boolean;
}

export function GradientText({
  as: Tag = "span",
  animate = false,
  className,
  children,
  ...rest
}: GradientTextProps) {
  return (
    <Tag
      className={cn(
        "bg-clip-text text-transparent bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)]",
        animate && "bg-[length:200%_200%] animate-[shimmer_5s_linear_infinite]",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
