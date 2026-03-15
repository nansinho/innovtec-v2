import { getSseDashboards, getLatestSseDashboard } from "@/actions/sse-dashboard";
import { SseDashboardView } from "@/components/qse/sse-dashboard-view";

export const dynamic = "force-dynamic";

export default async function TableauSsePage() {
  const [dashboards, latest] = await Promise.all([
    getSseDashboards(),
    getLatestSseDashboard(),
  ]);

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Tableau de Bord SSE
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Visualisez les indicateurs Sante, Securite et Environnement.
        </p>
      </div>

      <SseDashboardView dashboards={dashboards} initialDashboard={latest} />
    </div>
  );
}
