"use client";

import { useState } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Lock,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileInfoSection from "./profile-info-section";
import ExperiencesSection from "./experiences-section";
import DiplomasSection from "./diplomas-section";
import FormationsSection from "./formations-section";
import PasswordSection from "./password-section";
import DocumentsSection from "./documents-section";
import type { Profile, UserExperience, UserDiploma, UserFormation, Document } from "@/lib/types/database";

const tabs = [
  { id: "info", label: "Informations", icon: User },
  { id: "experiences", label: "Expériences", icon: Briefcase },
  { id: "diplomas", label: "Diplômes", icon: GraduationCap },
  { id: "formations", label: "Formations", icon: Award },
  { id: "password", label: "Mot de passe", icon: Lock },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface ProfileTabsProps {
  profile: Profile;
  experiences: UserExperience[];
  diplomas: UserDiploma[];
  formations: UserFormation[];
  documents: Document[];
}

export default function ProfileTabs({
  profile,
  experiences,
  diplomas,
  formations,
  documents,
}: ProfileTabsProps) {
  const [active, setActive] = useState<TabId>("info");

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-[var(--radius)] border border-[var(--border-1)] bg-gray-50/80 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-3.5 py-2 text-xs font-medium transition-colors duration-150",
                isActive
                  ? "bg-white text-[var(--heading)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-white/60 hover:text-[var(--heading)]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {active === "info" && <ProfileInfoSection profile={profile} />}
      {active === "experiences" && <ExperiencesSection experiences={experiences} />}
      {active === "diplomas" && <DiplomasSection diplomas={diplomas} />}
      {active === "formations" && <FormationsSection formations={formations} />}
      {active === "password" && <PasswordSection />}
      {active === "documents" && <DocumentsSection documents={documents} />}
    </div>
  );
}
