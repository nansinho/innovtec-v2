import { ClipboardList } from "lucide-react";

export default function PlansActionsPage() {
  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Plans d&apos;actions
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Suivez les plans d&apos;actions correctives et préventives.
        </p>
      </div>

      <div className="flex flex-col items-center rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--blue-surface)]">
          <ClipboardList className="h-7 w-7 text-[var(--blue)]" />
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--heading)]">
          Fonctionnalité en cours de développement
        </p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-[var(--text-muted)]">
          Les plans d&apos;actions seront bientôt disponibles pour gérer les actions correctives et préventives.
        </p>
      </div>
    </div>
  );
}
