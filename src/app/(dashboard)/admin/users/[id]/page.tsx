import { getProfile } from "@/actions/auth";
import { getUserById } from "@/actions/users";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Building2, Calendar, Briefcase, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  rh: "Ressources Humaines",
  responsable_qse: "Responsable QSE",
  chef_chantier: "Chef de chantier",
  technicien: "Technicien",
  collaborateur: "Collaborateur",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-red-50 text-red-600",
  rh: "bg-purple-50 text-purple-600",
  responsable_qse: "bg-blue-50 text-blue-600",
  chef_chantier: "bg-orange-50 text-orange-600",
  technicien: "bg-gray-100 text-gray-600",
  collaborateur: "bg-green-50 text-green-600",
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--hover)]">
        <Icon className="h-4 w-4 text-[var(--text-muted)]" />
      </div>
      <div>
        <div className="text-[11px] font-medium text-[var(--text-muted)]">{label}</div>
        <div className="text-sm text-[var(--heading)]">{value || "—"}</div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentProfile = await getProfile();

  if (!currentProfile) redirect("/login");

  // Any authenticated user can view a profile, but only admin/rh can see admin details
  const user = await getUserById(id);
  if (!user) notFound();

  const isAdminOrRh = ["admin", "rh"].includes(currentProfile.role);
  const isOwnProfile = currentProfile.id === user.id;

  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      {/* Header */}
      <div className="mb-6">
        {isAdminOrRh && (
          <Link
            href="/admin/users"
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--heading)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux utilisateurs
          </Link>
        )}

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy)] text-lg font-semibold text-white shadow-md">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--heading)]">
              {fullName}
              {isOwnProfile && (
                <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                  (vous)
                </span>
              )}
            </h1>
            <div className="mt-1 flex items-center gap-2">
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
                <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-green-500" : "bg-red-500"}`} />
                {user.is_active ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informations personnelles */}
        <div className="rounded-2xl bg-white/92 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] backdrop-blur-xl">
          <h2 className="mb-4 text-sm font-semibold text-[var(--heading)]">
            Informations personnelles
          </h2>
          <div className="divide-y divide-[var(--border-1)]">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Téléphone" value={user.phone} />
            <InfoRow icon={Briefcase} label="Poste" value={user.job_title} />
            <InfoRow icon={Shield} label="Rôle" value={roleLabels[user.role] ?? user.role} />
          </div>
        </div>

        {/* Organisation */}
        <div className="rounded-2xl bg-white/92 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] backdrop-blur-xl">
          <h2 className="mb-4 text-sm font-semibold text-[var(--heading)]">
            Organisation
          </h2>
          <div className="divide-y divide-[var(--border-1)]">
            <InfoRow icon={Building2} label="Département" value={user.department} />
            <InfoRow icon={Building2} label="Équipe" value={user.team} />
            <InfoRow icon={Building2} label="Agence" value={user.agency} />
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-2xl bg-white/92 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] backdrop-blur-xl">
          <h2 className="mb-4 text-sm font-semibold text-[var(--heading)]">
            Dates
          </h2>
          <div className="divide-y divide-[var(--border-1)]">
            <InfoRow icon={Calendar} label="Date de naissance" value={formatDate(user.date_of_birth)} />
            <InfoRow icon={Calendar} label="Date d'embauche" value={formatDate(user.hire_date)} />
            <InfoRow icon={Calendar} label="Inscription" value={formatDate(user.created_at)} />
          </div>
        </div>

        {/* Méta (admin only) */}
        {isAdminOrRh && (
          <div className="rounded-2xl bg-white/92 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] backdrop-blur-xl">
            <h2 className="mb-4 text-sm font-semibold text-[var(--heading)]">
              Informations système
            </h2>
            <div className="divide-y divide-[var(--border-1)]">
              <div className="py-3">
                <div className="text-[11px] font-medium text-[var(--text-muted)]">ID</div>
                <div className="font-mono text-xs text-[var(--text-secondary)]">{user.id}</div>
              </div>
              <div className="py-3">
                <div className="text-[11px] font-medium text-[var(--text-muted)]">Changement de mot de passe requis</div>
                <div className="text-sm text-[var(--heading)]">
                  {user.must_change_password ? "Oui" : "Non"}
                </div>
              </div>
              <div className="py-3">
                <div className="text-[11px] font-medium text-[var(--text-muted)]">Dernière mise à jour</div>
                <div className="text-sm text-[var(--heading)]">{formatDate(user.updated_at)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
