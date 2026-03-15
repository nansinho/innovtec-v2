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
      {/* Header */}
      <div className="flex gap-4 border-b border-[var(--border-1)] bg-[var(--hover)] px-4 py-3.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
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
