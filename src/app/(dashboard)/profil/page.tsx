import { getProfile } from "@/actions/auth";
import {
  getExperiences,
  getDiplomas,
  getUserFormations,
  getUserDocuments,
} from "@/actions/profile";
import ProfileTabs from "@/components/profil/profile-tabs";
import ProfileAvatarSection from "@/components/profil/profile-avatar-section";

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
      <div className="p-6 pb-20 md:pb-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Impossible de charger le profil.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-base font-semibold text-[var(--heading)]">
          Mon profil
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Gérez vos informations personnelles et vos documents
        </p>
      </div>

      <ProfileAvatarSection profile={profile} />

      <ProfileTabs
        profile={profile}
        experiences={experiences}
        diplomas={diplomas}
        formations={formations}
        documents={documents}
      />
    </div>
  );
}
