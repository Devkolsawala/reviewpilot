import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton variants that mirror the actual dashboard primitives shipped in
 * Phase 1–3. Each one matches its real counterpart's bounding box and major
 * regions so the layout doesn't snap when data arrives.
 */

export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="flex items-end gap-2 mb-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="mb-1.5 h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
        <div className="mt-2 flex items-center justify-between">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
    </div>
  );
}

export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-16 rounded-md" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="h-2.5 w-3/4" />
      </div>
      <Skeleton className="hidden sm:block h-5 w-20 rounded-full shrink-0" />
    </div>
  );
}

export function ReviewListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <DashboardRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 220, className }: { height?: number; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-card p-5 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <div className="space-y-1.5 text-right">
          <Skeleton className="ml-auto h-6 w-14" />
          <Skeleton className="ml-auto h-2.5 w-20" />
        </div>
      </div>
      <Skeleton style={{ height }} className="w-full rounded-md" />
    </div>
  );
}

export function DistributionSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="h-2.5 w-12" />
      </div>
      <div className="space-y-2.5 pt-1">
        {[5, 4, 3, 2, 1].map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-5 flex-1 rounded-md" style={{ opacity: 0.4 + i * 0.12 }} />
            <Skeleton className="h-3 w-14 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GettingStartedSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-[52px] w-[52px] rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-2.5 w-44" />
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      ))}
    </div>
  );
}
