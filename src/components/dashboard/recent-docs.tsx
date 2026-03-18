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
          const uploaderName = doc.uploaded_by_profile
            ? `${doc.uploaded_by_profile.first_name}`.trim()
            : "";
          const timeAgo = formatDistanceToNow(new Date(doc.created_at), {
            addSuffix: true,
            locale: fr,
          });
          const meta = uploaderName ? `${timeAgo} par ${uploaderName}` : timeAgo;
          const isRex = doc.category === "rex";
          const href = doc.internal_link || "/documents";

          return (
            <Link
              key={doc.id}
              href={href}
              className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-zinc-50/80"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#0B3655]/8">
                <FileText className="h-3.5 w-3.5 text-[#0B3655]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-[var(--heading)]">
                  {doc.name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  {isRex && (
                    <span className="rounded bg-[#C8A84E]/15 px-1 py-px text-[9px] font-medium text-[#0B3655]">
                      REX
                    </span>
                  )}
                  {meta}
                </div>
              </div>
            </Link>
          );
        })
      )}
    </Card>
  );
}
