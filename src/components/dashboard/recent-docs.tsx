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
        title="Documents r\u00e9cents"
        icon={FileText}
        action={
          <Link
            href="/documents"
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--heading)]"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {docs.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <FolderOpen className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">Aucun document</p>
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
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-zinc-50/80"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--heading)]">
                  {doc.name}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
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
