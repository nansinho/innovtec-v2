import { getProfile } from "@/actions/auth";
import { getAllUsers } from "@/actions/users";
import { redirect } from "next/navigation";
import UsersTable from "@/components/admin/users-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const profile = await getProfile();

  if (!profile || !["admin", "rh"].includes(profile.role)) {
    redirect("/");
  }

  const users = await getAllUsers();

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--heading)]">
            Gestion des utilisateurs
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {users.length} collaborateur{users.length > 1 ? "s" : ""} enregistré
            {users.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <UsersTable users={users} currentUserId={profile.id} />
    </div>
  );
}
