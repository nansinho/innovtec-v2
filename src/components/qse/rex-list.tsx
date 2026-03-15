"use client";

import { BookOpen, Eye } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

interface RexItem {
  id: string;
  title: string;
  description: string;
  lessons_learned: string;
  chantier: string;
  created_at: string;
  author?: { first_name: string; last_name: string } | null;
}

interface RexListProps {
  rexList: RexItem[];
}

export default function RexList({ rexList }: RexListProps) {
  const columns: ColumnDef<RexItem>[] = [
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      width: "110px",
      accessor: (r) => r.created_at,
      render: (r) => (
        <span className="text-[var(--text-secondary)]">
          {new Date(r.created_at).toLocaleDateString("fr-FR")}
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
          <div className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">
            {r.description}
          </div>
        </div>
      ),
    },
    {
      key: "chantier",
      header: "Chantier",
      sortable: true,
      render: (r) =>
        r.chantier ? (
          <Badge variant="blue">{r.chantier}</Badge>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: "lessons_learned",
      header: "Leçons tirées",
      render: (r) => (
        <span className="line-clamp-1 text-[var(--text-secondary)]">
          {r.lessons_learned || "—"}
        </span>
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
      selectable
      searchable
      searchPlaceholder="Rechercher un REX..."
      emptyState={{
        icon: BookOpen,
        title: "Aucun retour d'expérience",
        description: "Aucun REX n'a été enregistré pour le moment.",
      }}
      actions={(r) => [
        {
          label: "Voir les détails",
          icon: Eye,
          onClick: () => {},
        },
      ]}
    />
  );
}
