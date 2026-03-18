import { getQseContent, getAllQseContent, getQseFileUrls } from "@/actions/qse";
import { getProfile } from "@/actions/auth";
import PolitiqueContent from "@/components/qse/politique-content";


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
    <div className="p-6 pb-20 md:pb-6">
      <PolitiqueContent
        content={content}
        allContent={allContent}
        canEdit={canEdit}
        fileUrls={fileUrls}
      />
    </div>
  );
}
