export default function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 px-7 py-4 pb-20 md:pb-7 lg:grid-cols-[1fr_320px] animate-pulse">
      {/* Main column */}
      <div className="flex flex-col gap-5">
        {/* Carousel skeleton */}
        <div className="h-[260px] rounded-2xl bg-gray-200" />

        {/* Widgets row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="h-[200px] rounded-xl bg-white border border-gray-200" />
          <div className="h-[200px] rounded-xl bg-white border border-gray-200" />
        </div>

        {/* Feed skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="h-4 w-32 rounded bg-gray-200 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[180px] rounded-xl bg-white border border-gray-200"
          />
        ))}
      </div>
    </div>
  );
}
