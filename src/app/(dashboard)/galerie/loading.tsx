import { Skeleton } from "@/components/ui/skeleton";

export default function GalerieLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <Skeleton className="h-7 w-32" />

      {/* Image grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-square w-full rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}
