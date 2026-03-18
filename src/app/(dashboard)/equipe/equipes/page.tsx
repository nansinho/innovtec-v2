import { getProfile } from "@/actions/auth";
import { getTeamsWithMembers } from "@/actions/teams";
import { getAllUsers } from "@/actions/users";
import { redirect } from "next/navigation";
import TeamsManager from "@/components/equipe/teams-manager";

export default async function EquipesPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const isAdmin = ["admin", "rh"].includes(profile.role);

  const [teams, users] = await Promise.all([
    getTeamsWithMembers(),
    getAllUsers(),
  ]);

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--heading)]">
          Équipes
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Gérez les équipes et leurs membres
        </p>
      </div>

      <TeamsManager teams={teams} allUsers={users} isAdmin={isAdmin} />
    </div>
  );
}
