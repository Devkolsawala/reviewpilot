import { Skeleton } from "@/components/ui/skeleton";
import {
  KpiRowSkeleton,
  ChartSkeleton,
  DistributionSkeleton,
} from "@/components/dashboard/DashboardSkeletons";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Title + period selector */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-12 rounded-sm" />
          ))}
        </div>
      </div>

      {/* KPI row */}
      <KpiRowSkeleton />

      {/* Auto-replies panel */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-2.5 w-64" />
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="ml-auto h-8 w-12" />
            <Skeleton className="ml-auto h-2.5 w-16" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>

      {/* Charts row 1 — trend + distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height={220} />
        <DistributionSkeleton />
      </div>

      {/* Charts row 2 — sentiment + reply rate */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height={200} />
        <ChartSkeleton height={200} />
      </div>
    </div>
  );
}
