"use client";

import { useState, useTransition } from "react";
import { BookOpen, Trash2, Image as ImageIcon } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";
import { deleteBonnePratique } from "@/actions/bonnes-pratiques";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { BonnePratique } from "@/lib/types/database";

const PILLAR_CONFIG: Record<string, { label: string; variant: "warning" | "info" | "error" | "success" }> = {
  qualite: { label: "Qualité", variant: "warning" },
  sante: { label: "Santé", variant: "info" },
  securite: { label: "Sécurité", variant: "error" },
  environnement: { label: "Environnement", variant: "success" },
};

interface BonnesPratiquesListProps {
  items: BonnePratique[];
  headerAction?: React.ReactNode;
}

export default function BonnesPratiquesList({ items, headerAction }: BonnesPratiquesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
        const config = PILLAR_CONFIG[r.pillar] || { label: r.pillar, variant: "default" as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "chantier",
      header: "Chantier",
      sortable: true,
      render: (r) =>
        r.chantier ? (
          <Badge variant="default">{r.chantier}</Badge>
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
        icon: BookOpen,
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
