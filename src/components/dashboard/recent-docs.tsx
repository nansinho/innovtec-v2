import { FileText, ChevronRight } from "lucide-react";
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
            className="flex items-center gap-1 text-[10.5px] font-medium text-[var(--yellow)] opacity-85 transition-opacity hover:opacity-100"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {docs.length === 0 ? (
        <div className="px-5 py-4 text-center text-[12px] text-[var(--text-muted)]">
          Aucun document
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
              className="flex cursor-pointer items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-[var(--hover)]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--bg)]">
                <FileText className="h-[13px] w-[13px] text-[var(--text-muted)]" />
              </div>
              <div>
                <div className="text-xs font-normal text-[var(--heading)]">
                  {doc.name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
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
