import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-xs)] bg-zinc-200", className)}
      {...props}
    />
  );
}

export function DataTableSkeleton({
  columns = 5,
  rows = 8,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="w-full">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3 border-b border-[var(--border-1)] bg-[var(--hover)]/30 px-5 py-3">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <div className="ml-auto">
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>
      {/* Header */}
      <div className="flex gap-4 border-b border-[var(--border-2)] bg-zinc-50/80 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 border-b border-[var(--border-1)] px-4 py-3.5"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className="h-4 flex-1"
              style={{ maxWidth: colIdx === 0 ? "40px" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
