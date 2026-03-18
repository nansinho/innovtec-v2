import { Skeleton } from "@/components/ui/skeleton";

export default function QSELoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <Skeleton className="h-7 w-32" />

      {/* KPI cards row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-5 space-y-3"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Data list */}
      <div className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] divide-y divide-[var(--border-1)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
