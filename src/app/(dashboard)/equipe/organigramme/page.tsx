import { getProfile } from "@/actions/auth";
import { getOrgChartData } from "@/actions/organigramme";
import { redirect } from "next/navigation";
import OrgChart from "@/components/equipe/org-chart";

export const dynamic = "force-dynamic";

export default async function OrganigrammePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const profiles = await getOrgChartData();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--heading)]">
          Organigramme
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Structure hiérarchique de l&apos;entreprise &mdash; {profiles.length} collaborateur
          {profiles.length > 1 ? "s" : ""}
        </p>
      </div>

      <OrgChart
        profiles={profiles}
        isAdmin={["admin", "rh"].includes(profile.role)}
      />
    </div>
  );
}
