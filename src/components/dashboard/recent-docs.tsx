import { FileText, ChevronRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { getDocuments } from "@/actions/documents";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default async function RecentDocs() {
  const allDocs = await getDocuments();
  const docs = allDocs.slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Documents récents"
        action={
          <Link
            href="/documents"
            className="flex items-center gap-1 text-xs font-medium text-[var(--yellow)] transition-opacity hover:opacity-80"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {docs.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <FolderOpen className="mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-[var(--text-muted)]">Aucun document</p>
        </div>
      ) : (
        docs.map((doc) => {
          const uploaderProfile = doc.uploaded_by_profile as { first_name: string; last_name: string } | null;
          const uploaderName = uploaderProfile
            ? `${uploaderProfile.first_name}`.trim()
            : "";
          const timeAgo = formatDistanceToNow(new Date(doc.created_at), {
            addSuffix: true,
            locale: fr,
          });
          const meta = uploaderName ? `${timeAgo} par ${uploaderName}` : timeAgo;

          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-zinc-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] bg-blue-50">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-[var(--heading)]">
                  {doc.name}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {meta}
                </div>
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
}
