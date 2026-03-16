import { getProfile } from "@/actions/auth";
import { getAllUsers, ensureAdminExists } from "@/actions/users";
import { getJobTitles } from "@/actions/job-titles";
import { getDepartments } from "@/actions/departments";
import { getTeams } from "@/actions/teams";
import { redirect } from "next/navigation";
import UsersTable from "@/components/admin/users-table";
import AdminBootstrap from "@/components/admin/admin-bootstrap";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if there's an admin — if not, show the bootstrap UI
  const adminCheck = await ensureAdminExists();

  // If user was just promoted, profile.role will be stale — reload
  if (adminCheck.promoted) {
    redirect("/admin/users");
  }

  // If user is not admin/rh and an admin already exists, redirect
  if (!["admin", "rh"].includes(profile.role) && adminCheck.hasAdmin) {
    redirect("/");
  }

  // If no admin and user was NOT promoted (shouldn't happen normally)
  if (!adminCheck.hasAdmin && !["admin", "rh"].includes(profile.role)) {
    return (
      <div className="px-7 py-6 pb-20 md:pb-7">
        <AdminBootstrap />
      </div>
    );
  }

  const [users, jobTitles, departments, teams] = await Promise.all([
    getAllUsers(),
    getJobTitles(),
    getDepartments(),
    getTeams(),
  ]);

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Gestion des utilisateurs
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {users.length} collaborateur{users.length > 1 ? "s" : ""} enregistré
          {users.length > 1 ? "s" : ""}
        </p>
      </div>

      <UsersTable
        users={users}
        currentUserId={profile.id}
        currentUserRole={profile.role}
        jobTitles={jobTitles}
        departments={departments}
        teams={teams}
      />
    </div>
  );
}
