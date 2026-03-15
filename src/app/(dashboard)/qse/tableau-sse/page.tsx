import { BarChart3 } from "lucide-react";

export default function TableauSsePage() {
  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Tableau de Bord SSE
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Visualisez les indicateurs Santé, Sécurité et Environnement.
        </p>
      </div>

      <div className="flex flex-col items-center rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(26, 45, 78, 0.06)" }}>
          <BarChart3 className="h-7 w-7 text-[var(--navy)]" />
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--heading)]">
          Fonctionnalité en cours de développement
        </p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-[var(--text-muted)]">
          Le tableau de bord SSE sera bientôt disponible avec les indicateurs de fréquence, gravité et suivi des heures travaillées.
        </p>
      </div>
    </div>
  );
}
