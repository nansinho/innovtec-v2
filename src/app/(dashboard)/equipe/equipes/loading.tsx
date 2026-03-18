import { Skeleton } from "@/components/ui/skeleton";

export default function EquipesLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Title + create button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Team cards grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex -space-x-2 pt-1">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-8 w-8 rounded-full border-2 border-[var(--card)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
