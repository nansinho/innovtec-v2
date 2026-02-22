import { getProfile } from "@/actions/auth";
import {
  getExperiences,
  getDiplomas,
  getUserFormations,
  getUserDocuments,
} from "@/actions/profile";
import ProfileInfoSection from "@/components/profil/profile-info-section";
import ExperiencesSection from "@/components/profil/experiences-section";
import DiplomasSection from "@/components/profil/diplomas-section";
import FormationsSection from "@/components/profil/formations-section";
import PasswordSection from "@/components/profil/password-section";
import DocumentsSection from "@/components/profil/documents-section";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const [profile, experiences, diplomas, formations, documents] =
    await Promise.all([
      getProfile(),
      getExperiences(),
      getDiplomas(),
      getUserFormations(),
      getUserDocuments(),
    ]);

  if (!profile) {
    return (
      <div className="px-7 py-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Impossible de charger le profil.
        </p>
      </div>
    );
  }

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      <h1 className="mb-6 text-xl font-semibold text-[var(--heading)]">
        Mon profil
      </h1>

      <div className="flex flex-col gap-6">
        <ProfileInfoSection profile={profile} />
        <ExperiencesSection experiences={experiences} />
        <DiplomasSection diplomas={diplomas} />
        <FormationsSection formations={formations} />
        <PasswordSection />
        <DocumentsSection documents={documents} />
      </div>
    </div>
  );
}
