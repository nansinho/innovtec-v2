import { getProfile } from "@/actions/auth";
import {
  getExperiences,
  getDiplomas,
  getUserFormations,
  getUserDocuments,
} from "@/actions/profile";
import ProfileTabs from "@/components/profil/profile-tabs";

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
