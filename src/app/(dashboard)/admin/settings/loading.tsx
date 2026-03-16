export default function SettingsLoading() {
  return (
    <div className="px-7 py-6 animate-pulse">
      <div className="h-6 w-32 rounded bg-[var(--border-1)] mb-2" />
      <div className="h-4 w-64 rounded bg-[var(--border-1)] mb-8" />
      <div className="max-w-2xl space-y-6">
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 space-y-4">
          <div className="h-5 w-40 rounded bg-[var(--border-1)]" />
          <div className="h-10 w-full rounded bg-[var(--border-1)]" />
          <div className="h-9 w-32 rounded bg-[var(--border-1)]" />
        </div>
      </div>
    </div>
  );
}
