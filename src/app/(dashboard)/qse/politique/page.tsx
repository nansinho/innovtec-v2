import { getQseContent, getAllQseContent, getQseFileUrls } from "@/actions/qse";
import { getProfile } from "@/actions/auth";
import PolitiqueContent from "@/components/qse/politique-content";

export const dynamic = "force-dynamic";

export default async function PolitiqueQSEPage() {
  const [content, allContent, profile] = await Promise.all([
    getQseContent("politique"),
    getAllQseContent("politique"),
    getProfile(),
  ]);

  // Generate signed URLs for all documents that have source files
  const fileUrls = await getQseFileUrls(allContent);

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
          La politique Qualit&eacute;, S&eacute;curit&eacute; et Environnement d&apos;INNOVTEC R&eacute;seaux.
        </p>
      </div>

      <PolitiqueContent
        content={content}
        allContent={allContent}
        canEdit={canEdit}
        fileUrls={fileUrls}
      />
    </div>
  );
}
