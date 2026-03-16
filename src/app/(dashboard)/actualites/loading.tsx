export default function ActualitesLoading() {
  return (
    <div className="px-7 py-6 animate-pulse">
      <div className="h-6 w-40 rounded bg-gray-200 mb-6" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            <div className="aspect-[16/9] bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-200" />
              <div className="h-3 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
