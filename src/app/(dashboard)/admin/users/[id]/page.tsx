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

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  collaborateur: "Collaborateur",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-red-50 text-red-600",
  collaborateur: "bg-green-50 text-green-600",
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
    <div className="px-7 py-6 pb-20 md:pb-7">
      {/* Back link */}
      {isAdminOrRh && (
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-gray-900"
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
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-2xl font-semibold text-white shadow-md ring-2 ring-white">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {fullName}
          </h1>
          {user.job_title && (
            <p className="mt-0.5 text-sm text-gray-500">
              {user.job_title}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                roleBadgeColors[user.role] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {roleLabels[user.role] ?? user.role}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                user.is_active
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-green-500" : "bg-red-500"}`}
              />
              {user.is_active ? "Actif" : "Inactif"}
            </span>
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
