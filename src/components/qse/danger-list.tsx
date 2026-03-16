"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Eye } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { updateDangerStatus } from "@/actions/qse";
import { DataTable, type ColumnDef, type FilterDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";

const statusConfig: Record<string, { label: string; variant: "error" | "warning" | "success" | "default" }> = {
  signale: { label: "Signalé", variant: "error" },
  en_cours: { label: "En cours", variant: "warning" },
  resolu: { label: "Résolu", variant: "success" },
  cloture: { label: "Clôturé", variant: "default" },
};

const severityConfig: Record<number, { label: string; variant: "success" | "warning" | "error" | "default" }> = {
  1: { label: "Faible", variant: "success" },
  2: { label: "Modérée", variant: "warning" },
  3: { label: "Sérieuse", variant: "warning" },
  4: { label: "Grave", variant: "error" },
  5: { label: "Critique", variant: "error" },
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
        return <span className="text-gray-400">{idx + 1}</span>;
      },
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      width: "110px",
      accessor: (d) => d.created_at,
      render: (d) => (
        <span className="text-gray-500">
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
          <div className="font-medium text-gray-900">{d.title}</div>
          <div className="mt-0.5 line-clamp-1 text-xs text-gray-400">
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
        <span className="text-gray-500">
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
          <span className="text-gray-500">
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
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
      title="Situations dangereuses"
      description="Suivez les situations dangereuses identifiées."
      toolbarActions={getStandardToolbarActions({ onExport: () => exportCsv(dangers) })}
      selectable
      searchable
      searchPlaceholder="Rechercher une situation..."
      filters={filters}
      emptyState={{
        icon: AlertTriangle,
        title: "Aucune situation dangereuse",
        description: "Aucune situation n'a été signalée pour le moment.",
      }}
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
