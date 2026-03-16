"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  Loader2,
  AlertTriangle,
  LinkIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/ui/status-badge";
import { PLAN_ACTION_STATUS_MAP, PLAN_ACTION_TYPE_MAP, PRIORITY_MAP } from "@/lib/status-config";
import {
  updateActionPlan,
  addActionPlanTask,
  toggleActionPlanTask,
  deleteActionPlanTask,
  linkSignalement,
  unlinkSignalement,
} from "@/actions/action-plans";
import type { ActionPlan, ActionPlanTask, DangerReport } from "@/lib/types/database";
import { toast } from "sonner";


interface ActionPlanDetailProps {
  plan: ActionPlan;
  canManage: boolean;
  unresolvedSignalements: Pick<DangerReport, "id" | "title" | "priority">[];
}

export default function ActionPlanDetail({
  plan: initial,
  canManage,
  unresolvedSignalements,
}: ActionPlanDetailProps) {
  const router = useRouter();
  const [plan, setPlan] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [newTaskLabel, setNewTaskLabel] = useState("");

  const tasks = plan.tasks ?? [];
  const doneCount = tasks.filter((t) => t.is_done).length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateActionPlan(plan.id, { status: newStatus as ActionPlan["status"] });
      if (result.success) {
        setPlan((prev) => ({ ...prev, status: newStatus as ActionPlan["status"] }));
        toast.success("Statut mis à jour");
      }
    });
  }

  function handleAddTask() {
    if (!newTaskLabel.trim()) return;
    const label = newTaskLabel;
    setNewTaskLabel("");
    startTransition(async () => {
      const result = await addActionPlanTask(plan.id, label);
      if (result.success) {
        setPlan((prev) => ({
          ...prev,
          tasks: [
            ...(prev.tasks ?? []),
            { id: Date.now().toString(), action_plan_id: plan.id, label, is_done: false, position: (prev.tasks?.length ?? 0) + 1, created_at: new Date().toISOString() },
          ],
        }));
        router.refresh();
      }
    });
  }

  function handleToggleTask(task: ActionPlanTask) {
    const newDone = !task.is_done;
    setPlan((prev) => ({
      ...prev,
      tasks: prev.tasks?.map((t) => (t.id === task.id ? { ...t, is_done: newDone } : t)),
    }));
    startTransition(async () => {
      await toggleActionPlanTask(task.id, newDone);
    });
  }

  function handleDeleteTask(taskId: string) {
    setPlan((prev) => ({
      ...prev,
      tasks: prev.tasks?.filter((t) => t.id !== taskId),
    }));
    startTransition(async () => {
      await deleteActionPlanTask(taskId);
    });
  }

  function handleLinkSignalement(signalementId: string) {
    startTransition(async () => {
      const result = await linkSignalement(plan.id, signalementId);
      if (result.success) {
        toast.success("Signalement lié et résolu");
        router.refresh();
      }
    });
  }

  function handleUnlinkSignalement(signalementId: string) {
    startTransition(async () => {
      const result = await unlinkSignalement(signalementId);
      if (result.success) {
        setPlan((prev) => ({
          ...prev,
          signalements: prev.signalements?.filter((s) => s.id !== signalementId),
        }));
        toast.success("Signalement détaché");
      }
    });
  }

  return (
    <div>
      <button
        onClick={() => router.push("/qse/plans")}
        className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--heading)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux plans d&apos;actions
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-xs">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-xl font-semibold text-[var(--heading)]">{plan.title}</h1>
              <StatusBadge module="plans_actions" status={plan.status} />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <TypeBadge module="plan_action_types" type={plan.type} />
              <PriorityBadge priority={plan.priority} />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {plan.responsible && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <User className="h-4 w-4 text-[var(--text-muted)]" />
                  {plan.responsible.first_name} {plan.responsible.last_name}
                </div>
              )}
              {plan.due_date && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
                  {new Date(plan.due_date).toLocaleDateString("fr-FR")}
                </div>
              )}
              {plan.creator && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  Créé par {plan.creator.first_name} {plan.creator.last_name}
                </div>
              )}
            </div>

            {plan.description && (
              <div className="border-t border-[var(--border-1)] pt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                  {plan.description}
                </p>
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Sous-tâches ({doneCount}/{tasks.length})
              </h3>
              {tasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 rounded-full bg-[var(--hover)]">
                    <div
                      className="h-full rounded-full bg-[var(--green)] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">{progress}%</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-[var(--radius-xs)] px-2 py-2 transition-colors hover:bg-[var(--hover)]"
                >
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="flex-shrink-0"
                  >
                    {task.is_done ? (
                      <CheckCircle className="h-5 w-5 text-[var(--green)]" />
                    ) : (
                      <Circle className="h-5 w-5 text-[var(--text-muted)]" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      task.is_done
                        ? "text-[var(--text-muted)] line-through"
                        : "text-[var(--heading)]"
                    )}
                  >
                    {task.label}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-[var(--red)]" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add task */}
            {canManage && (
              <div className="mt-3 flex gap-2">
                <input
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Ajouter une sous-tâche..."
                  className="flex-1 rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm outline-none focus:border-[var(--yellow)]"
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskLabel.trim() || isPending}
                  className="flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Linked signalements */}
          <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-xs">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Signalements liés ({plan.signalements?.length ?? 0})
            </h3>

            {plan.signalements && plan.signalements.length > 0 ? (
              <div className="space-y-2">
                {plan.signalements.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5"
                  >
                    <button
                      onClick={() => router.push(`/qse/signalements/${s.id}`)}
                      className="flex items-center gap-2 text-sm font-medium text-[var(--heading)] hover:text-[var(--yellow)]"
                    >
                      <AlertTriangle className="h-4 w-4 text-[var(--yellow)]" />
                      {s.title}
                    </button>
                    {canManage && (
                      <button
                        onClick={() => handleUnlinkSignalement(s.id)}
                        className="text-[var(--text-muted)] transition-colors hover:text-[var(--red)]"
                        title="Détacher"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Aucun signalement lié à ce plan.</p>
            )}

            {/* Link new signalement */}
            {canManage && unresolvedSignalements.length > 0 && (
              <div className="mt-3">
                <select
                  onChange={(e) => {
                    if (e.target.value) handleLinkSignalement(e.target.value);
                    e.target.value = "";
                  }}
                  disabled={isPending}
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm outline-none focus:border-[var(--yellow)]"
                >
                  <option value="">Lier un signalement...</option>
                  {unresolvedSignalements.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {canManage && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-5 shadow-xs">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Changer le statut
              </h3>
              <select
                value={plan.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isPending}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm outline-none focus:border-[var(--yellow)]"
              >
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>

            {isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Mise à jour...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
