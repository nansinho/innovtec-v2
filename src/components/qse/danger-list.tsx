"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Eye, Download } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { updateDangerStatus } from "@/actions/qse";
import { DataTable, type ColumnDef, type FilterDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "red" | "yellow" | "green" | "default" }> = {
  signale: { label: "Signalé", variant: "red" },
  en_cours: { label: "En cours", variant: "yellow" },
  resolu: { label: "Résolu", variant: "green" },
  cloture: { label: "Clôturé", variant: "default" },
};

const severityConfig: Record<number, { label: string; variant: "green" | "yellow" | "red" | "default" }> = {
  1: { label: "Faible", variant: "green" },
  2: { label: "Modérée", variant: "yellow" },
  3: { label: "Sérieuse", variant: "yellow" },
  4: { label: "Grave", variant: "red" },
  5: { label: "Critique", variant: "red" },
};

interface DangerItem {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  severity: number;
  created_at: string;
  reporter?: { first_name: string; last_name: string } | null;
}

interface DangerListProps {
  dangers: DangerItem[];
  canManage: boolean;
}

function exportCsv(dangers: DangerItem[]) {
  const headers = ["#", "Date", "Titre", "Lieu", "Gravité", "Déclarant", "Statut"];
  const rows = dangers.map((d, i) => {
    const reporter = d.reporter as unknown as { first_name: string; last_name: string } | null;
    const sev = severityConfig[d.severity] ?? severityConfig[1];
    const st = statusConfig[d.status] ?? statusConfig.signale;
    return [
      i + 1,
      new Date(d.created_at).toLocaleDateString("fr-FR"),
      `"${d.title}"`,
      `"${d.location || ""}"`,
      sev.label,
      reporter ? `${reporter.first_name} ${reporter.last_name}` : "",
      st.label,
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "situations-dangereuses.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function DangerList({ dangers: initialDangers, canManage }: DangerListProps) {
  const [dangers, setDangers] = useState(initialDangers);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(id: string, newStatus: string) {
    startTransition(async () => {
      const result = await updateDangerStatus(id, newStatus);
      if (result.success) {
        setDangers((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
        );
      }
    });
  }

  const columns: ColumnDef<DangerItem>[] = [
    {
      key: "index",
      header: "#",
      width: "50px",
      render: (_, ) => {
        const idx = dangers.indexOf(_);
        return <span className="text-[var(--text-muted)]">{idx + 1}</span>;
      },
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      width: "110px",
      accessor: (d) => d.created_at,
      render: (d) => (
        <span className="text-[var(--text-secondary)]">
          {new Date(d.created_at).toLocaleDateString("fr-FR")}
        </span>
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
      key: "location",
      header: "Lieu",
      sortable: true,
      render: (d) => (
        <span className="text-[var(--text-secondary)]">
          {d.location || "—"}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Gravité",
      sortable: true,
      width: "100px",
      accessor: (d) => d.severity,
      render: (d) => {
        const sev = severityConfig[d.severity] ?? severityConfig[1];
        return <Badge variant={sev.variant}>{sev.label} ({d.severity}/5)</Badge>;
      },
    },
    {
      key: "reporter",
      header: "Déclarant",
      render: (d) => {
        const reporter = d.reporter as unknown as { first_name: string; last_name: string } | null;
        return (
          <span className="text-[var(--text-secondary)]">
            {reporter ? `${reporter.first_name} ${reporter.last_name}` : "—"}
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
              className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-2 py-1 text-xs outline-none focus:border-[var(--yellow)]"
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
      key: "severity",
      label: "Gravité",
      type: "select",
      placeholder: "Toutes les gravités",
      options: Object.entries(severityConfig).map(([k, v]) => ({ value: k, label: v.label })),
    },
  ];

  return (
    <DataTable
      data={dangers}
      columns={columns}
      keyField="id"
      searchable
      searchPlaceholder="Rechercher une situation..."
      filters={filters}
      emptyState={{
        icon: AlertTriangle,
        title: "Aucune situation dangereuse",
        description: "Aucune situation n'a été signalée pour le moment.",
      }}
      headerAction={
        <button
          onClick={() => exportCsv(dangers)}
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
          onClick: () => {},
        },
      ]}
    />
  );
}
