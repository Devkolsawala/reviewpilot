import { Skeleton } from "@/components/ui/skeleton";
import {
  KpiRowSkeleton,
  ReviewListSkeleton,
  GettingStartedSkeleton,
  QuickActionsSkeleton,
} from "@/components/dashboard/DashboardSkeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
      </div>

      {/* KPI cards */}
      <KpiRowSkeleton />

      {/* Two-column body */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <ReviewListSkeleton rows={5} />
        </div>

        <div className="space-y-6">
          <GettingStartedSkeleton />
          <div>
            <Skeleton className="h-4 w-24 mx-1 mb-2.5" />
            <QuickActionsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
