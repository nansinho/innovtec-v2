import { getProfile } from "@/actions/auth";
import { redirect } from "next/navigation";
import ActivityLogsTable from "@/components/admin/activity-logs-table";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const profile = await getProfile();

  if (!profile || !["admin", "rh"].includes(profile.role)) {
    redirect("/");
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--heading)]">
          Journal d'activité
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Traçabilité des actions effectuées sur la plateforme
        </p>
      </div>

      <ActivityLogsTable />
    </div>
  );
}
