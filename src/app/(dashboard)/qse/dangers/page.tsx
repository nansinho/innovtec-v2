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
    <div className="px-7 py-6 pb-20 md:pb-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Situations dangereuses
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Signalez et suivez les situations dangereuses identifiées sur les chantiers.
        </p>
      </div>

      {/* Create form */}
      <div className="mb-6">
        <DangerFormWrapper />
      </div>

      {/* List */}
      <DangerList dangers={dangers} canManage={canManage} />
    </div>
  );
}
