import { getDangerReports } from "@/actions/qse";
import { getProfile } from "@/actions/auth";
import DangerList from "@/components/qse/danger-list";
import DangerFormWrapper from "@/components/qse/danger-form-wrapper";

export const dynamic = "force-dynamic";

export default async function DangersPage() {
  const [dangers, profile] = await Promise.all([
    getDangerReports(),
    getProfile(),
  ]);

  const canManage =
    profile !== null &&
    ["admin", "rh", "responsable_qse"].includes(profile.role);

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--heading)]">
            Situations dangereuses
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Signalez et suivez les situations dangereuses identifiées sur les chantiers.
          </p>
        </div>
        <DangerFormWrapper />
      </div>

      <DangerList dangers={dangers} canManage={canManage} />
    </div>
  );
}
