"use client";

import { useState, useTransition, useMemo } from "react";
import type { SseDashboard } from "@/lib/types/database";
import { SseDashboardForm } from "./sse-dashboard-form";
import { deleteSseDashboard } from "@/actions/sse-dashboard";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { createReferenceMap } from "@/lib/utils";

const MONTH_NAMES = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

interface SseDashboardManagerProps {
  dashboards: SseDashboard[];
}

export function SseDashboardManager({ dashboards: initialDashboards }: SseDashboardManagerProps) {
  const [dashboards, setDashboards] = useState(initialDashboards);
  const [editing, setEditing] = useState<SseDashboard | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SseDashboard | null>(null);
  const [isPending, startTransition] = useTransition();
  const refMap = useMemo(() => createReferenceMap(dashboards, "SSE"), [dashboards]);

  function handleCreated(newDashboard: SseDashboard) {
    setDashboards((prev) => [newDashboard, ...prev].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    }));
    setCreating(false);
    toast.success("Tableau SSE cree avec succes");
  }

  function handleUpdated(updated: SseDashboard) {
    setDashboards((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
    setEditing(null);
    toast.success("Tableau SSE mis a jour");
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteSseDashboard(deleteTarget.id);
      if (result.success) {
        setDashboards((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        toast.success("Tableau SSE supprime");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
      setDeleteTarget(null);
    });
  }

  if (creating) {
    return (
      <SseDashboardForm
        onSave={handleCreated}
        onCancel={() => setCreating(false)}
      />
    );
  }

  if (editing) {
    return (
      <SseDashboardForm
        dashboard={editing}
        onSave={handleUpdated}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          {dashboards.length} tableau{dashboards.length !== 1 ? "x" : ""} SSE
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Nouveau tableau
        </Button>
      </div>

      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(26, 45, 78, 0.06)" }}>
            <Calendar className="h-7 w-7 text-[var(--navy)]" />
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--heading)]">
            Aucun tableau SSE
          </p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-[var(--text-muted)]">
            Creez votre premier tableau de bord SSE mensuel.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border-1)] bg-[var(--hover)]">
              <tr>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">ID</th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Période</th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">ASAA</th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Taux SST</th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Visites terrain</th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Créé le</th>
                <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-1)]">
              {dashboards.map((d, index) => (
                <tr key={d.id} className="transition-colors hover:bg-[var(--hover)]">
                  <td className="px-3 py-2 text-[13px] text-[var(--text-muted)]">{refMap.get(d.id)}</td>
                  <td className="px-3 py-2 font-medium text-[var(--heading)]">
                    {MONTH_NAMES[d.month - 1]} {d.year}
                  </td>
                  <td className="px-3 py-2 text-[var(--text)]">{d.accidents_with_leave}</td>
                  <td className="px-3 py-2 text-[var(--text)]">{d.sst_rate}%</td>
                  <td className="px-3 py-2 text-[var(--text)]">{d.field_visits_count}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">
                    {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <DropdownMenu
                      items={[
                        { label: "Modifier", icon: Pencil, onClick: () => setEditing(d) },
                        { label: "Supprimer", icon: Trash2, variant: "danger" as const, onClick: () => setDeleteTarget(d) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer ce tableau SSE ?"
        message={`Le tableau de ${deleteTarget ? MONTH_NAMES[deleteTarget.month - 1] + " " + deleteTarget.year : ""} sera definitivement supprime.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
