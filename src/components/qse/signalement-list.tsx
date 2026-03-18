"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, Trash2 } from "lucide-react";
import { updateSignalementStatus, deleteSignalement } from "@/actions/signalements";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { DataTable, type ColumnDef, type FilterDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { SIGNALEMENT_STATUS_MAP, PRIORITY_MAP } from "@/lib/status-config";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";
import { createReferenceMap } from "@/lib/utils";
import type { DangerReport, SignalementCategory } from "@/lib/types/database";

interface SignalementListProps {
  signalements: DangerReport[];
  categories: SignalementCategory[];
  canManage: boolean;
  onAdd?: () => void;
}

function exportCsv(signalements: DangerReport[]) {
  const headers = ["#", "Date", "Titre", "Catégorie", "Priorité", "Lieu", "Déclarant", "Statut"];
  const rows = signalements.map((d, i) => {
    const cat = d.category as { name: string } | null;
    const pri = PRIORITY_MAP[d.priority] ?? PRIORITY_MAP.faible;
    const st = SIGNALEMENT_STATUS_MAP[d.status] ?? SIGNALEMENT_STATUS_MAP.signale;
    const reporter = d.is_anonymous
      ? "Anonyme"
      : d.reporter
        ? `${d.reporter.first_name} ${d.reporter.last_name}`
        : "—";
    return [
      i + 1,
      d.incident_date ? new Date(d.incident_date).toLocaleDateString("fr-FR") : new Date(d.created_at).toLocaleDateString("fr-FR"),
      `"${d.title}"`,
      cat?.name ?? "—",
      pri.label,
      `"${d.chantier || d.location || ""}"`,
      reporter,
      st.label,
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "signalements.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function SignalementList({ signalements: initial, categories, canManage, onAdd }: SignalementListProps) {
  const [signalements, setSignalements] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const refMap = useMemo(() => createReferenceMap(initial, "SIG"), [initial]);

  function handleDelete() {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    startTransition(async () => {
      const result = await deleteSignalement(id);
      if (result.success) {
        setSignalements((prev) => prev.filter((d) => d.id !== id));
        toast.success("Signalement supprimé");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    });
  }

  function handleStatusChange(id: string, newStatus: string) {
    startTransition(async () => {
      const result = await updateSignalementStatus(id, newStatus as DangerReport["status"]);
      if (result.success) {
        setSignalements((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus as DangerReport["status"] } : d))
        );
      }
    });
  }

  const columns: ColumnDef<DangerReport>[] = [
    {
      key: "index",
      header: "ID",
      width: "120px",
      render: (item) => <span className="text-[var(--text-muted)]">{refMap.get(item.id)}</span>,
    },
    {
      key: "incident_date",
      header: "Date",
      sortable: true,
      width: "110px",
      accessor: (d) => d.incident_date || d.created_at,
      render: (d) => (
        <div>
          <span className="text-[var(--text-secondary)]">
            {(d.incident_date ? new Date(d.incident_date) : new Date(d.created_at)).toLocaleDateString("fr-FR")}
          </span>
          {d.incident_time && (
            <div className="text-[11px] text-[var(--text-muted)]">{d.incident_time.slice(0, 5)}</div>
          )}
        </div>
      ),
    },
    {
      key: "title",
      header: "Titre",
      sortable: true,
      render: (d) => (
        <div>
          <div className="font-medium text-[var(--heading)]">{d.title}</div>
          <div className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">
            {d.description}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Catégorie",
      width: "130px",
      render: (d) => {
        const cat = d.category as { name: string; color: string } | null;
        if (!cat) return <span className="text-[var(--text-muted)]">—</span>;
        return (
          <Badge
            variant="gray"
            className="border-[1.5px] bg-transparent"
            style={{
              color: cat.color,
              borderColor: cat.color,
            }}
          >
            {cat.name}
          </Badge>
        );
      },
    },
    {
      key: "priority",
      header: "Priorité",
      sortable: true,
      width: "100px",
      render: (d) => {
        return <PriorityBadge priority={d.priority} />;
      },
    },
    {
      key: "chantier",
      header: "Lieu",
      sortable: true,
      render: (d) => (
        <span className="text-[var(--text-secondary)]">
          {d.chantier || d.location || "—"}
        </span>
      ),
    },
    {
      key: "reporter",
      header: "Déclarant",
      width: "140px",
      render: (d) => {
        if (d.is_anonymous) {
          return (
            <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
              <span className="text-xs italic">Anonyme</span>
            </span>
          );
        }
        return (
          <span className="text-[var(--text-secondary)]">
            {d.reporter ? `${d.reporter.first_name} ${d.reporter.last_name}` : "—"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      width: "130px",
      render: (d) => {
        if (canManage && d.status !== "cloture") {
          return (
            <select
              value={d.status}
              onChange={(e) => {
                e.stopPropagation();
                handleStatusChange(d.id, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={isPending}
              className="rounded-lg border border-[var(--border-1)] bg-white px-2 py-1 text-xs outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            >
              <option value="signale">Signalé</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
              <option value="cloture">Clôturé</option>
            </select>
          );
        }
        return <StatusBadge module="signalements" status={d.status} />;
      },
    },
  ];

  const filters: FilterDef[] = [
    {
      key: "status",
      label: "Statut",
      type: "select",
      placeholder: "Tous les statuts",
      options: Object.entries(SIGNALEMENT_STATUS_MAP).filter(([k]) => ["signale","en_cours","resolu","cloture"].includes(k)).map(([k, v]) => ({ value: k, label: v.label })),
    },
    {
      key: "priority",
      label: "Priorité",
      type: "select",
      placeholder: "Toutes les priorités",
      options: Object.entries(PRIORITY_MAP).filter(([k]) => ["faible","moyenne","haute","critique"].includes(k)).map(([k, v]) => ({ value: k, label: v.label })),
    },
    ...(categories.length > 0
      ? [
          {
            key: "category_id",
            label: "Catégorie",
            type: "select" as const,
            placeholder: "Toutes les catégories",
            options: categories.map((c) => ({ value: c.id, label: c.name })),
          },
        ]
      : []),
  ];

  return (
    <>
    <DataTable
      data={signalements}
      columns={columns}
      keyField="id"
      title="Signalements"
      description="Signalez et suivez les situations dangereuses identifiées."
      toolbarActions={getStandardToolbarActions({ onExport: () => exportCsv(signalements) })}
      selectable
      searchable
      searchPlaceholder="Rechercher un signalement..."
      filters={filters}
      onAdd={onAdd}
      addLabel="Nouveau signalement"
      onRowClick={(d) => router.push(`/qse/signalements/${d.id}`)}
      emptyState={{
        icon: AlertTriangle,
        title: "Aucun signalement",
        description: "Aucune situation dangereuse n'a été signalée pour le moment.",
      }}
      actions={(d) => [
        {
          label: "Voir les détails",
          icon: Eye,
          onClick: () => router.push(`/qse/signalements/${d.id}`),
        },
        ...(canManage
          ? [
              {
                label: "Supprimer",
                icon: Trash2,
                variant: "danger" as const,
                onClick: () => setDeleteId(d.id),
              },
            ]
          : []),
      ]}
    />

    <ConfirmDialog
      open={!!deleteId}
      onClose={() => setDeleteId(null)}
      onConfirm={handleDelete}
      title="Supprimer le signalement"
      message="Êtes-vous sûr de vouloir supprimer ce signalement ? Cette action est irréversible."
      confirmLabel="Supprimer"
      variant="danger"
    />
    </>
  );
}
