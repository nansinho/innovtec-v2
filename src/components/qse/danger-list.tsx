"use client";

import { useState, useTransition, useMemo } from "react";
import { AlertTriangle, Eye } from "lucide-react";
import { cn, formatRelative, createReferenceMap } from "@/lib/utils";
import { updateDangerStatus } from "@/actions/qse";
import { DataTable, type ColumnDef, type FilterDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { SIGNALEMENT_STATUS_MAP, DANGER_SEVERITY_MAP } from "@/lib/status-config";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";

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
    const sev = DANGER_SEVERITY_MAP[String(d.severity)] ?? DANGER_SEVERITY_MAP["1"];
    const st = SIGNALEMENT_STATUS_MAP[d.status] ?? SIGNALEMENT_STATUS_MAP.signale;
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
        const sev = DANGER_SEVERITY_MAP[String(d.severity)];
        return <Badge variant={sev?.variant ?? "gray"} dot>{sev?.label ?? d.severity} ({d.severity}/5)</Badge>;
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
      key: "severity",
      label: "Gravité",
      type: "select",
      placeholder: "Toutes les gravités",
      options: Object.entries(DANGER_SEVERITY_MAP).map(([k, v]) => ({ value: k, label: v.label })),
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
