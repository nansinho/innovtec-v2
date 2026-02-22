import { getQseContent } from "@/actions/qse";
import { getProfile } from "@/actions/auth";
import PolitiqueContent from "@/components/qse/politique-content";

export const dynamic = "force-dynamic";

export default async function PolitiqueQSEPage() {
  const [content, profile] = await Promise.all([
    getQseContent("politique"),
    getProfile(),
  ]);

  const canEdit =
    profile !== null &&
    ["admin", "rh", "responsable_qse"].includes(profile.role);

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Politique QSE
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          La politique Qualité, Sécurité et Environnement d&apos;INNOVTEC Réseaux.
        </p>
      </div>

      <PolitiqueContent content={content} canEdit={canEdit} />
    </div>
  );
}
