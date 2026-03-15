import { getDocuments } from "@/actions/documents";
import DocumentsTable from "@/components/documents/documents-table";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <DocumentsTable documents={documents} />
    </div>
  );
}
