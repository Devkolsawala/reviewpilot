import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Title bar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Inbox shell — left pane + right pane */}
      <div className="flex flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
        {/* Left pane */}
        <div className="hidden md:flex flex-col border-r w-80 shrink-0">
          {/* Search + filters */}
          <div className="p-3 border-b space-y-2.5">
            <Skeleton className="h-9 w-full rounded-md" />
            <div className="flex gap-1.5 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-14 rounded-full shrink-0" />
              ))}
            </div>
          </div>
          {/* Review rows */}
          <div className="flex-1 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3 border-b flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-2.5 w-full" />
                </div>
              </div>
            ))}
          </div>
          {/* Keyboard hints */}
          <div className="hidden md:flex shrink-0 justify-center gap-3 border-t bg-muted/20 px-3 py-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Right pane — review detail placeholder */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-6 border-b space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full" />
                ))}
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-md" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
