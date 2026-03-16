"use client";

import { useState, useTransition } from "react";
import { X, Send, Loader2, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { createActionPlan, updateActionPlan } from "@/actions/action-plans";
import type { ActionPlan, ActionPlanType, SignalementPriority, DangerReport, Profile } from "@/lib/types/database";
import { toast } from "sonner";

interface ActionPlanFormProps {
  plan?: ActionPlan;
  profiles: Pick<Profile, "id" | "first_name" | "last_name">[];
  unresolvedSignalements: Pick<DangerReport, "id" | "title" | "priority">[];
  onSaved: () => void;
  onClose: () => void;
}

const priorityOptions: { value: SignalementPriority; label: string }[] = [
  { value: "faible", label: "Faible" },
  { value: "moyenne", label: "Moyenne" },
  { value: "haute", label: "Haute" },
  { value: "critique", label: "Critique" },
];

const typeOptions: { value: ActionPlanType; label: string }[] = [
  { value: "corrective", label: "Corrective" },
  { value: "preventive", label: "Préventive" },
];

export default function ActionPlanForm({
  plan,
  profiles,
  unresolvedSignalements,
  onSaved,
  onClose,
}: ActionPlanFormProps) {
  const isEdit = !!plan;
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: plan?.title ?? "",
    description: plan?.description ?? "",
    type: plan?.type ?? ("corrective" as ActionPlanType),
    priority: plan?.priority ?? ("moyenne" as SignalementPriority),
    responsible_id: plan?.responsible_id ?? "",
    due_date: plan?.due_date ?? "",
    signalement_id: "",
  });
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }
    if (!form.due_date) {
      setError("La date d'échéance est obligatoire");
      return;
    }

    setError("");
    startTransition(async () => {
      if (isEdit) {
        const result = await updateActionPlan(plan.id, {
          title: form.title,
          description: form.description,
          type: form.type,
          priority: form.priority,
          responsible_id: form.responsible_id || null,
          due_date: form.due_date || null,
        });
        if (result.success) {
          toast.success("Plan d'action modifié");
          onSaved();
        } else {
          setError(result.error || "Erreur");
        }
      } else {
        const result = await createActionPlan({
          title: form.title,
          description: form.description,
          type: form.type,
          priority: form.priority,
          responsible_id: form.responsible_id || null,
          due_date: form.due_date || null,
          signalement_id: form.signalement_id || undefined,
        });
        if (result.success) {
          toast.success("Plan d'action créé");
          onSaved();
        } else {
          setError(result.error || "Erreur");
        }
      }
    });
  }

  const inputClass =
    "w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--card)] md:left-[var(--sidebar-width)]">
      <div className="relative flex h-full w-full flex-col bg-[var(--card)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-1)] px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[var(--blue)]" />
            <h2 className="text-lg font-semibold text-[var(--heading)]">
              {isEdit ? "Modifier le plan d'action" : "Nouveau plan d'action"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--heading)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Titre <span className="text-[var(--red)]">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="Titre du plan d'action"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={cn(inputClass, "resize-none")}
              placeholder="Description du plan d'action..."
            />
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ActionPlanType })}
                className={inputClass}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Priorité <span className="text-[var(--red)]">*</span>
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as SignalementPriority })}
                className={inputClass}
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsible + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Responsable
              </label>
              <select
                value={form.responsible_id}
                onChange={(e) => setForm({ ...form, responsible_id: e.target.value })}
                className={inputClass}
              >
                <option value="">Non assigné</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Échéance <span className="text-[var(--red)]">*</span>
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Link signalement (only on create) */}
          {!isEdit && unresolvedSignalements.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Lier un signalement (optionnel)
              </label>
              <select
                value={form.signalement_id}
                onChange={(e) => setForm({ ...form, signalement_id: e.target.value })}
                className={inputClass}
              >
                <option value="">Aucun</option>
                {unresolvedSignalements.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Le signalement lié passera automatiquement en &quot;Résolu&quot;
              </p>
            </div>
          )}

          {error && <p className="text-[12px] text-[var(--red)]">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-1)] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)]"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-5 py-2 text-sm font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-sm active:scale-[0.97] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending ? "En cours..." : isEdit ? "Enregistrer" : "Créer le plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
