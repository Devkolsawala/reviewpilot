import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/50 animate-pulse",
        "after:absolute after:inset-0 after:bg-[linear-gradient(90deg,transparent,hsl(var(--card)/0.4),transparent)] after:bg-[length:200%_100%] after:animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
