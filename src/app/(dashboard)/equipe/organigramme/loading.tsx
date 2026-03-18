import { Skeleton } from "@/components/ui/skeleton";

export default function OrganigrammeLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <Skeleton className="h-7 w-48" />

      {/* Search bar */}
      <Skeleton className="h-10 w-72 rounded-xl" />

      {/* Org chart tree */}
      <div className="flex flex-col items-center gap-6 pt-4">
        {/* Root node */}
        <div className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-4 w-56 space-y-2">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto h-4 w-32" />
          <Skeleton className="mx-auto h-3 w-24" />
        </div>

        {/* Connector line */}
        <Skeleton className="h-8 w-px" />

        {/* Second level */}
        <div className="flex gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-4 w-48 space-y-2"
            >
              <Skeleton className="mx-auto h-10 w-10 rounded-full" />
              <Skeleton className="mx-auto h-4 w-28" />
              <Skeleton className="mx-auto h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Connector line */}
        <Skeleton className="h-8 w-px" />

        {/* Third level */}
        <div className="flex gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-3 w-40 space-y-2"
            >
              <Skeleton className="mx-auto h-8 w-8 rounded-full" />
              <Skeleton className="mx-auto h-3 w-24" />
              <Skeleton className="mx-auto h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
