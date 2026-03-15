import { getProfile } from "@/actions/auth";
import { getSseDashboards } from "@/actions/sse-dashboard";
import { redirect } from "next/navigation";
import { SseDashboardManager } from "@/components/admin/sse-dashboard-manager";

export const dynamic = "force-dynamic";

export default async function AdminTableauSsePage() {
  const profile = await getProfile();

  if (!profile || !["admin", "responsable_qse"].includes(profile.role)) {
    redirect("/");
  }

  const dashboards = await getSseDashboards();

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Gestion des Tableaux SSE
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Creez et gerez les tableaux de bord Sante-Securite-Environnement mensuels.
        </p>
      </div>

      <SseDashboardManager dashboards={dashboards} />
    </div>
  );
}
