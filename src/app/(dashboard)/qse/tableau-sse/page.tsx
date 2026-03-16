import { getProfile } from "@/actions/auth";
import { getSseDashboards, getLatestSseDashboard } from "@/actions/sse-dashboard";
import { getCompanyLogo } from "@/actions/settings";
import { SseDashboardView } from "@/components/qse/sse-dashboard-view";

export const dynamic = "force-dynamic";

export default async function TableauSsePage() {
  const [dashboards, latest, profile, logos] = await Promise.all([
    getSseDashboards(),
    getLatestSseDashboard(),
    getProfile(),
    getCompanyLogo(),
  ]);

  const canManage = profile && ["admin", "responsable_qse"].includes(profile.role);

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-4">
        <h1 className="text-base font-semibold text-[var(--heading)]">
          Tableau de Bord SSE
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
          Visualisez les indicateurs Santé, Sécurité et Environnement.
        </p>
      </div>

      <SseDashboardView
        dashboards={dashboards}
        initialDashboard={latest}
        canManage={!!canManage}
        logos={logos}
      />
    </div>
  );
}
