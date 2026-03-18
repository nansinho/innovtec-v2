import { getProfile } from "@/actions/auth";
import { getUserById } from "@/actions/users";
import {
  getExperiences,
  getDiplomas,
  getUserFormations,
  getUserDocuments,
} from "@/actions/profile";
import { getJobTitles } from "@/actions/job-titles";
import { getDepartments } from "@/actions/departments";
import { getTeams } from "@/actions/teams";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import UserProfileTabs from "@/components/admin/user-profile-tabs";
import { RoleBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";


const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  collaborateur: "Collaborateur",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentProfile = await getProfile();

  if (!currentProfile) redirect("/login");

  const isAdminOrRh = ["admin", "rh"].includes(currentProfile.role);

  const [user, experiences, diplomas, formations, documents, jobTitles, departments, teams] =
    await Promise.all([
      getUserById(id),
      getExperiences(id),
      getDiplomas(id),
      getUserFormations(id),
      getUserDocuments(id),
      getJobTitles(),
      getDepartments(),
      getTeams(),
    ]);

  if (!user) notFound();

  // Redirect to /profil if viewing own profile
  if (currentProfile.id === user.id) redirect("/profil");
  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    "?";
  const fullName =
    `${user.first_name} ${user.last_name}`.trim() || user.email;

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Back link */}
      {isAdminOrRh && (
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--heading)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux utilisateurs
        </Link>
      )}

      {/* Header with avatar */}
      <div className="mb-8 flex items-center gap-5">
        {user.avatar_url ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-md ring-2 ring-white">
            <Image
              src={user.avatar_url}
              alt={fullName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy)] text-2xl font-semibold text-white shadow-md ring-2 ring-white">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[var(--heading)]">
            {fullName}
          </h1>
          {user.job_title && (
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              {user.job_title}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <RoleBadge role={user.role}>
              {roleLabels[user.role] ?? user.role}
            </RoleBadge>
            <Badge variant={user.is_active ? "green" : "red"} dot size="sm">
              {user.is_active ? "Actif" : "Inactif"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <UserProfileTabs
        user={user}
        experiences={experiences}
        diplomas={diplomas}
        formations={formations}
        documents={documents}
        isAdmin={isAdminOrRh}
        jobTitles={jobTitles}
        departments={departments}
        teams={teams}
      />
    </div>
  );
}
