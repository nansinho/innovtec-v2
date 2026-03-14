import { getDocuments } from "@/actions/documents";
import DocumentsTable from "@/components/documents/documents-table";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Documents
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Tous les documents de l&apos;entreprise : plans, rapports, procédures...
        </p>
      </div>

      <DocumentsTable documents={documents} />
    </div>
  );
}
