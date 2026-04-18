import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <Skeleton className="h-8 w-28" />
 <Skeleton className="h-9 w-36 rounded-md" />
 </div>

 {/* KPI cards */}
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
 <Skeleton className="h-4 w-24" />
 <Skeleton className="h-8 w-16" />
 <Skeleton className="h-3 w-20" />
 </div>
 ))}
 </div>

 {/* Charts row 1 */}
 <div className="grid gap-6 lg:grid-cols-2">
 {[1, 2].map((i) => (
 <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
 <Skeleton className="h-5 w-36" />
 <Skeleton className="h-[200px] w-full rounded-lg" />
 </div>
 ))}
 </div>

 {/* Charts row 2 */}
 <div className="grid gap-6 lg:grid-cols-2">
 {[1, 2].map((i) => (
 <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
 <Skeleton className="h-5 w-36" />
 <Skeleton className="h-[200px] w-full rounded-lg" />
 </div>
 ))}
 </div>
 </div>
 );
}
