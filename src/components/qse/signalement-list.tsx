"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, Download, Trash2 } from "lucide-react";
import { updateSignalementStatus, deleteSignalement } from "@/actions/signalements";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { DataTable, type ColumnDef, type FilterDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type { DangerReport, SignalementCategory } from "@/lib/types/database";

const statusConfig: Record<string, { label: string; variant: "red" | "yellow" | "green" | "default" }> = {
  signale: { label: "Signalé", variant: "red" },
  en_cours: { label: "En cours", variant: "yellow" },
  resolu: { label: "Résolu", variant: "green" },
  cloture: { label: "Clôturé", variant: "default" },
};

const priorityConfig: Record<string, { label: string; variant: "green" | "yellow" | "red" | "default" }> = {
  faible: { label: "Faible", variant: "green" },
  moyenne: { label: "Moyenne", variant: "yellow" },
  haute: { label: "Haute", variant: "red" },
  critique: { label: "Critique", variant: "red" },
};

interface SignalementListProps {
  signalements: DangerReport[];
  categories: SignalementCategory[];
  canManage: boolean;
}

function exportCsv(signalements: DangerReport[]) {
  const headers = ["#", "Date", "Titre", "Catégorie", "Priorité", "Lieu", "Déclarant", "Statut"];
  const rows = signalements.map((d, i) => {
    const cat = d.category as { name: string } | null;
    const pri = priorityConfig[d.priority] ?? priorityConfig.faible;
    const st = statusConfig[d.status] ?? statusConfig.signale;
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

export default function SignalementList({ signalements: initial, categories, canManage }: SignalementListProps) {
  const [signalements, setSignalements] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

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
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm"
            style={{ background: `linear-gradient(to bottom, ${cat.color}, ${cat.color}dd)` }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            {cat.name}
          </span>
        );
      },
    },
    {
      key: "priority",
      header: "Priorité",
      sortable: true,
      width: "100px",
      render: (d) => {
        const pri = priorityConfig[d.priority] ?? priorityConfig.faible;
        return <Badge variant={pri.variant}>{pri.label}</Badge>;
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
        const st = statusConfig[d.status] ?? statusConfig.signale;
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
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
    },
  ];

  const filters: FilterDef[] = [
    {
      key: "status",
      label: "Statut",
      type: "select",
      placeholder: "Tous les statuts",
      options: Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
    },
    {
      key: "priority",
      label: "Priorité",
      type: "select",
      placeholder: "Toutes les priorités",
      options: Object.entries(priorityConfig).map(([k, v]) => ({ value: k, label: v.label })),
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
      selectable
      searchable
      searchPlaceholder="Rechercher un signalement..."
      filters={filters}
      onRowClick={(d) => router.push(`/qse/signalements/${d.id}`)}
      emptyState={{
        icon: AlertTriangle,
        title: "Aucun signalement",
        description: "Aucune situation dangereuse n'a été signalée pour le moment.",
      }}
      headerAction={
        <button
          onClick={() => exportCsv(signalements)}
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius)] border border-[var(--border-1)] bg-white px-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-zinc-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      }
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
