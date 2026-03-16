"use client";

import { useState, useTransition } from "react";
import type { SseDashboard } from "@/lib/types/database";
import { SseDashboardForm } from "./sse-dashboard-form";
import { deleteSseDashboard } from "@/actions/sse-dashboard";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";

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
        <p className="text-sm text-gray-500">
          {dashboards.length} tableau{dashboards.length !== 1 ? "x" : ""} SSE
        </p>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau tableau
        </button>
      </div>

      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(26, 45, 78, 0.06)" }}>
            <Calendar className="h-7 w-7 text-gray-900" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-900">
            Aucun tableau SSE
          </p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-gray-400">
            Creez votre premier tableau de bord SSE mensuel.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Periode</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">ASAA</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Taux SST</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Visites terrain</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Cree le</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboards.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {MONTH_NAMES[d.month - 1]} {d.year}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{d.accidents_with_leave}</td>
                  <td className="px-4 py-3 text-gray-700">{d.sst_rate}%</td>
                  <td className="px-4 py-3 text-gray-700">{d.field_visits_count}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(d)}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(d)}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
