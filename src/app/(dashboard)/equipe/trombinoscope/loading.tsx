import { Skeleton } from "@/components/ui/skeleton";

export default function TrombinoscopeLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <Skeleton className="h-7 w-48" />

      {/* Search bar */}
      <Skeleton className="h-10 w-72 rounded-xl" />

      {/* Grid of avatar cards */}
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-6"
          >
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
