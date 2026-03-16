"use client";

import { BookOpen, Eye, Download, Trash2 } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { TypeBadge } from "@/components/ui/status-badge";
import { INCIDENT_TYPE_MAP } from "@/lib/status-config";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";
import { useRouter } from "next/navigation";
import { deleteRex } from "@/actions/qse";
import { toast } from "sonner";
import type { Rex } from "@/lib/types/database";

interface RexItem extends Rex {
  author?: { first_name: string; last_name: string } | null;
}

interface RexListProps {
  rexList: RexItem[];
  headerAction?: React.ReactNode;
}

export default function RexList({ rexList, headerAction }: RexListProps) {
  const router = useRouter();

  const columns: ColumnDef<RexItem>[] = [
    {
      key: "rex_number",
      header: "N°",
      width: "70px",
      sortable: true,
      accessor: (r) => r.rex_number || "",
      render: (r) => (
        <span className="font-semibold text-orange-700">
          {r.rex_number ? `${r.rex_number}/${r.rex_year || ""}` : "—"}
        </span>
      ),
    },
    {
      key: "date_evenement",
      header: "Date",
      sortable: true,
      width: "100px",
      accessor: (r) => r.date_evenement || r.created_at,
      render: (r) => (
        <span className="text-[var(--text-secondary)]">
          {r.date_evenement
            ? new Date(r.date_evenement).toLocaleDateString("fr-FR")
            : new Date(r.created_at).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "title",
      header: "Titre",
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--heading)]">{r.title}</div>
          {r.lieu && (
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
              {r.lieu}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "type_evenement",
      header: "Type",
      sortable: true,
      width: "140px",
      render: (r) => {
        return <TypeBadge module="rex_types" type={r.type_evenement} />;
      },
    },
    {
      key: "chantier",
      header: "Chantier",
      sortable: true,
      render: (r) =>
        r.chantier ? (
          <Badge variant="blue" dot={false}>{r.chantier}</Badge>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: "author",
      header: "Auteur",
      render: (r) => {
        const author = r.author as unknown as { first_name: string; last_name: string } | null;
        return (
          <span className="text-[var(--text-secondary)]">
            {author ? `${author.first_name} ${author.last_name}` : "—"}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      data={rexList}
      columns={columns}
      keyField="id"
      title="Fiches REX"
      description="Retours d'expérience — consultez, importez ou exportez en PDF."
      toolbarActions={getStandardToolbarActions()}
      headerAction={headerAction}
      selectable
      searchable
      searchPlaceholder="Rechercher un REX..."
      emptyState={{
        icon: BookOpen,
        title: "Aucune fiche REX",
        description: "Aucun retour d'expérience n'a été enregistré pour le moment.",
      }}
      actions={(r) => [
        {
          label: "Voir la fiche",
          icon: Eye,
          onClick: () => router.push(`/qse/rex/${r.id}`),
        },
        {
          label: "Télécharger PDF",
          icon: Download,
          onClick: async () => {
            const num = r.rex_number || "X";
            const year = r.rex_year || new Date().getFullYear();
            const { exportRexPdf } = await import("@/lib/export/rex-pdf");
            exportRexPdf(r, `Fiche-REX-${num}-${year}.pdf`);
          },
        },
        {
          label: "Supprimer",
          icon: Trash2,
          onClick: async () => {
            if (!confirm("Supprimer cette fiche REX ?")) return;
            const result = await deleteRex(r.id);
            if (result.success) {
              toast.success("Fiche REX supprimée");
              router.refresh();
            } else {
              toast.error(result.error || "Erreur");
            }
          },
          variant: "danger",
        },
      ]}
    />
  );
}
