import { Skeleton } from "@/components/ui/skeleton";

export default function SocialLoading() {
  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Title */}
      <Skeleton className="h-7 w-36" />

      {/* Post cards stacked */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-5 space-y-4"
        >
          {/* Author row */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          {/* Content */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          {/* Actions */}
          <div className="flex items-center gap-4 pt-1">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
