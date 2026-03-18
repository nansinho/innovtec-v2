"use client";

import { useState, useTransition, useMemo } from "react";
import { FileText, Trash2, Image as ImageIcon } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/ui/status-badge";
import { PILLAR_MAP } from "@/lib/status-config";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";
import { createReferenceMap } from "@/lib/utils";
import { deleteBonnePratique } from "@/actions/bonnes-pratiques";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { BonnePratique } from "@/lib/types/database";

interface BonnesPratiquesListProps {
  items: BonnePratique[];
  headerAction?: React.ReactNode;
}

export default function BonnesPratiquesList({ items, headerAction }: BonnesPratiquesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const refMap = useMemo(() => createReferenceMap(items, "BP"), [items]);

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteBonnePratique(id);
      if (result.success) {
        toast.success("Bonne pratique supprimée");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    });
  }

  const columns: ColumnDef<BonnePratique>[] = [
    {
      key: "index",
      header: "ID",
      width: "120px",
      render: (item) => <span className="text-[var(--text-muted)]">{refMap.get(item.id)}</span>,
    },
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
      key: "pillar",
      header: "Pilier",
      sortable: true,
      width: "140px",
      render: (r) => {
        return <CategoryBadge module="piliers" category={r.pillar} />;
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
      key: "photos",
      header: "Photos",
      width: "80px",
      render: (r) =>
        r.photos && r.photos.length > 0 ? (
          <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <ImageIcon className="h-3.5 w-3.5" />
            {r.photos.length}
          </span>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: "author",
      header: "Auteur",
      render: (r) => (
        <span className="text-[var(--text-secondary)]">
          {r.author?.full_name || "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      keyField="id"
      title="Bonnes pratiques"
      description="Documentez et partagez les bonnes pratiques QSE."
      toolbarActions={getStandardToolbarActions()}
      headerAction={headerAction}
      selectable
      searchable
      searchPlaceholder="Rechercher une bonne pratique..."
      emptyState={{
        icon: FileText,
        title: "Aucune bonne pratique",
        description: "Aucune bonne pratique n'a été enregistrée pour le moment.",
      }}
      actions={(r) => [
        {
          label: "Supprimer",
          icon: Trash2,
          variant: "danger" as const,
          onClick: () => handleDelete(r.id),
        },
      ]}
    />
  );
}
