"use client";

import { useState } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  MapPin,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExperiencesSection from "@/components/profil/experiences-section";
import DiplomasSection from "@/components/profil/diplomas-section";
import FormationsSection from "@/components/profil/formations-section";
import DocumentsSection from "@/components/profil/documents-section";
import EmergencyContactSection from "@/components/profil/emergency-contact-section";
import UserFormModal from "@/components/admin/user-form-modal";
import type {
  Profile,
  UserExperience,
  UserDiploma,
  UserFormation,
  Document,
} from "@/lib/types/database";
import type { JobTitle } from "@/actions/job-titles";
import type { Department } from "@/actions/departments";
import type { Team } from "@/actions/teams";

const tabs = [
  { id: "info", label: "Informations", icon: User },
  { id: "experiences", label: "Expériences", icon: Briefcase },
  { id: "diplomas", label: "Diplômes", icon: GraduationCap },
  { id: "formations", label: "Formations", icon: Award },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  collaborateur: "Collaborateur",
};

interface UserProfileTabsProps {
  user: Profile;
  experiences: UserExperience[];
  diplomas: UserDiploma[];
  formations: UserFormation[];
  documents: Document[];
  isAdmin?: boolean;
  jobTitles?: JobTitle[];
  departments?: Department[];
  teams?: Team[];
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div>
        <div className="text-[11px] font-medium text-gray-400">
          {label}
        </div>
        <div className="text-sm text-gray-900">{value || "—"}</div>
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

export default function UserProfileTabs({
  user,
  experiences,
  diplomas,
  formations,
  documents,
  isAdmin = false,
  jobTitles = [],
  departments = [],
  teams = [],
}: UserProfileTabsProps) {
  const [active, setActive] = useState<TabId>("info");
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-0 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-medium transition-colors duration-200",
                isActive
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-500"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-orange-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {active === "info" && (
        <div className="flex flex-col gap-6">
          {/* Admin edit button */}
          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-500 shadow-sm transition-all hover:bg-gray-50 hover:shadow-sm"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
            </div>
          )}

          {/* Personal info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Informations personnelles
            </h3>
            <div className="divide-y divide-gray-200">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Phone} label="Téléphone" value={user.phone} />
              <InfoRow
                icon={Briefcase}
                label="Poste"
                value={user.job_title}
              />
              <InfoRow
                icon={Shield}
                label="Rôle"
                value={roleLabels[user.role] ?? user.role}
              />
            </div>
          </div>

          {/* Organisation */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Organisation
            </h3>
            <div className="divide-y divide-gray-200">
              <InfoRow
                icon={Building2}
                label="Département"
                value={user.department}
              />
              <InfoRow icon={Building2} label="Équipe" value={user.team} />
              <InfoRow icon={MapPin} label="Agence" value={user.agency} />
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Dates
            </h3>
            <div className="divide-y divide-gray-200">
              <InfoRow
                icon={Calendar}
                label="Date de naissance"
                value={formatDate(user.date_of_birth)}
              />
              <InfoRow
                icon={Calendar}
                label="Date d'embauche"
                value={formatDate(user.hire_date)}
              />
              <InfoRow
                icon={Calendar}
                label="Inscription"
                value={formatDate(user.created_at)}
              />
            </div>
          </div>

          {/* Emergency contact */}
          <EmergencyContactSection
            initialData={{
              emergency_contact_name: user.emergency_contact_name || "",
              emergency_contact_phone: user.emergency_contact_phone || "",
              emergency_contact_relation:
                user.emergency_contact_relation || "",
            }}
            userId={user.id}
          />
        </div>
      )}

      {active === "experiences" && (
        <ExperiencesSection experiences={experiences} userId={user.id} />
      )}

      {active === "diplomas" && (
        <DiplomasSection diplomas={diplomas} userId={user.id} />
      )}

      {active === "formations" && (
        <FormationsSection formations={formations} userId={user.id} />
      )}

      {active === "documents" && <DocumentsSection documents={documents} />}

      {/* Edit Modal (admin only) */}
      {isAdmin && (
        <UserFormModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          user={user}
          jobTitles={jobTitles}
          departments={departments}
          teams={teams}
        />
      )}
    </div>
  );
}
