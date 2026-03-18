"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Eye, Pencil, Trash2 } from "lucide-react";
import { DataTable, type ColumnDef, type FilterDef } from "@/components/ui/data-table";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/ui/status-badge";
import { PLAN_ACTION_STATUS_MAP, PLAN_ACTION_TYPE_MAP, PRIORITY_MAP } from "@/lib/status-config";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";
import { createReferenceMap } from "@/lib/utils";
import { deleteActionPlan } from "@/actions/action-plans";
import type { ActionPlan } from "@/lib/types/database";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface ActionPlanListProps {
  plans: ActionPlan[];
  canManage: boolean;
  onEdit: (plan: ActionPlan) => void;
  onAdd?: () => void;
}

export default function ActionPlanList({ plans: initial, canManage, onEdit, onAdd }: ActionPlanListProps) {
  const [plans, setPlans] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const refMap = useMemo(() => createReferenceMap(initial, "PA"), [initial]);

  function handleDelete() {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    startTransition(async () => {
      const result = await deleteActionPlan(id);
      if (result.success) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
        toast.success("Plan d'action supprimé");
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  }

  const columns: ColumnDef<ActionPlan>[] = [
    {
      key: "index",
      header: "ID",
      width: "120px",
      render: (item) => <span className="text-[var(--text-muted)]">{refMap.get(item.id)}</span>,
    },
    {
      key: "title",
      header: "Titre",
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-medium text-[var(--heading)]">{p.title}</div>
          {p.description && (
            <div className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">
              {p.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "120px",
      render: (p) => {
        return <TypeBadge module="plan_action_types" type={p.type} />;
      },
    },
    {
      key: "priority",
      header: "Priorité",
      sortable: true,
      width: "100px",
      render: (p) => {
        return <PriorityBadge priority={p.priority} />;
      },
    },
    {
      key: "responsible",
      header: "Responsable",
      width: "150px",
      render: (p) => (
        <span className="text-[var(--text-secondary)]">
          {p.responsible
            ? `${p.responsible.first_name} ${p.responsible.last_name}`
            : "—"}
        </span>
      ),
    },
    {
      key: "due_date",
      header: "Échéance",
      sortable: true,
      width: "110px",
      accessor: (p) => p.due_date || "",
      render: (p) => {
        if (!p.due_date) return <span className="text-[var(--text-muted)]">—</span>;
        const date = new Date(p.due_date);
        const isOverdue = p.status !== "termine" && p.status !== "annule" && date < new Date();
        return (
          <span className={isOverdue ? "font-medium text-[var(--red)]" : "text-[var(--text-secondary)]"}>
            {date.toLocaleDateString("fr-FR")}
          </span>
        );
      },
    },
    {
      key: "progress",
      header: "Progression",
      width: "120px",
      render: (p) => {
        const tasks = p.tasks ?? [];
        if (tasks.length === 0) return <span className="text-[var(--text-muted)]">—</span>;
        const done = tasks.filter((t) => t.is_done).length;
        const pct = Math.round((done / tasks.length) * 100);
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-[var(--hover)]">
              <div
                className="h-full rounded-full bg-[var(--green)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      width: "110px",
      render: (p) => {
        return <StatusBadge module="plans_actions" status={p.status} />;
      },
    },
  ];

  const filters: FilterDef[] = [
    {
      key: "status",
      label: "Statut",
      type: "select",
      placeholder: "Tous les statuts",
      options: Object.entries(PLAN_ACTION_STATUS_MAP).filter(([k]) => ["a_faire","en_cours","termine","annule"].includes(k)).map(([k, v]) => ({ value: k, label: v.label })),
    },
    {
      key: "type",
      label: "Type",
      type: "select",
      placeholder: "Tous les types",
      options: Object.entries(PLAN_ACTION_TYPE_MAP).filter(([k]) => ["corrective","preventive"].includes(k)).map(([k, v]) => ({ value: k, label: v.label })),
    },
    {
      key: "priority",
      label: "Priorité",
      type: "select",
      placeholder: "Toutes les priorités",
      options: Object.entries(PRIORITY_MAP).filter(([k]) => ["faible","moyenne","haute","critique"].includes(k)).map(([k, v]) => ({ value: k, label: v.label })),
    },
  ];

  return (
    <>
      <DataTable
        data={plans}
        columns={columns}
        keyField="id"
        title="Plans d'actions"
        description="Gérez les plans d'actions correctives et préventives."
        toolbarActions={getStandardToolbarActions()}
        selectable
        searchable
        searchPlaceholder="Rechercher un plan d'action..."
        filters={filters}
        onAdd={onAdd}
        addLabel="Nouveau plan"
        onRowClick={(p) => router.push(`/qse/plans/${p.id}`)}
        emptyState={{
          icon: ClipboardList,
          title: "Aucun plan d'action",
          description: "Aucun plan d'action n'a été créé pour le moment.",
        }}
        actions={(p) => [
          {
            label: "Voir les détails",
            icon: Eye,
            onClick: () => router.push(`/qse/plans/${p.id}`),
          },
          ...(canManage
            ? [
                {
                  label: "Modifier",
                  icon: Pencil,
                  onClick: () => onEdit(p),
                },
                {
                  label: "Supprimer",
                  icon: Trash2,
                  variant: "danger" as const,
                  onClick: () => setDeleteId(p.id),
                },
              ]
            : []),
        ]}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer le plan d'action"
        message="Êtes-vous sûr de vouloir supprimer ce plan d'action ? Les signalements liés seront détachés mais pas supprimés."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </>
  );
}
