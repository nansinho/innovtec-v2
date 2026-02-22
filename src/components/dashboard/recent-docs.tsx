import { FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";

const docs = [
  { name: "plan_chantier_v2.pdf", meta: "Il y a 3h par Pierre" },
  { name: "Rapport_SSE.pdf", meta: "Hier par Sophie" },
  { name: "Devis_materiel.xlsx", meta: "Il y a 2j par Marc" },
];

export default function RecentDocs() {
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
      {docs.map((doc) => (
        <div
          key={doc.name}
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
              {doc.meta}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}
