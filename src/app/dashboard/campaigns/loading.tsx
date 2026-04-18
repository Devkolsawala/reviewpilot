import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <Skeleton className="h-8 w-28" />
 <Skeleton className="h-9 w-36" />
 </div>

 <div className="grid gap-6 lg:grid-cols-5">
 {/* Campaign builder skeleton */}
 <div className="lg:col-span-2 rounded-xl border bg-card p-5 space-y-4">
 <Skeleton className="h-5 w-36" />
 <div className="flex gap-2">
 <Skeleton className="h-9 flex-1" />
 <Skeleton className="h-9 flex-1" />
 </div>
 <Skeleton className="h-9 w-full" />
 <Skeleton className="h-24 w-full" />
 <Skeleton className="h-4 w-20" />
 </div>

 {/* Campaign list skeleton */}
 <div className="lg:col-span-3 space-y-3">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="rounded-xl border bg-card p-4 flex items-center gap-4">
 <Skeleton className="h-10 w-10 rounded-full shrink-0" />
 <div className="flex-1 space-y-2">
 <Skeleton className="h-4 w-40" />
 <Skeleton className="h-3 w-24" />
 </div>
 <div className="space-y-2 text-right">
 <Skeleton className="h-4 w-16" />
 <Skeleton className="h-3 w-12" />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
