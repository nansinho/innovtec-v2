import { getProfile } from "@/actions/auth";
import { getAllUsers, ensureAdminExists } from "@/actions/users";
import { getJobTitles } from "@/actions/job-titles";
import { getDepartments } from "@/actions/departments";
import { getTeams, getTeamsWithMembers } from "@/actions/teams";
import { redirect } from "next/navigation";
import UsersTable from "@/components/admin/users-table";
import AdminBootstrap from "@/components/admin/admin-bootstrap";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";


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

  // If user doesn't have manage_users permission and an admin already exists, redirect
  const canManageUsers = await hasPermission(profile.role, profile.job_title || "", PERMISSIONS.MANAGE_USERS);
  if (!canManageUsers && adminCheck.hasAdmin) {
    redirect("/");
  }

  // If no admin and user was NOT promoted (shouldn't happen normally)
  if (!adminCheck.hasAdmin && !canManageUsers) {
    return (
      <div className="p-6 pb-20 md:pb-6">
        <AdminBootstrap />
      </div>
    );
  }

  const [users, jobTitles, departments, teams, teamsWithMembers] = await Promise.all([
    getAllUsers(),
    getJobTitles(),
    getDepartments(),
    getTeams(),
    getTeamsWithMembers(),
  ]);

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--heading)]">
          Gestion des utilisateurs
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
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
        teamsWithMembers={teamsWithMembers}
      />
    </div>
  );
}
