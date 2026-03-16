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
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white md:left-[var(--sidebar-width)]">
      <div className="relative flex h-full w-full flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Modifier le plan d'action" : "Nouveau plan d'action"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Titre <span className="text-red-600">*</span>
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
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
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
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
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
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Priorité <span className="text-red-600">*</span>
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
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
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
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                Échéance <span className="text-red-600">*</span>
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
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
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
              <p className="mt-1 text-[11px] text-gray-400">
                Le signalement lié passera automatiquement en &quot;Résolu&quot;
              </p>
            </div>
          )}

          {error && <p className="text-[12px] text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-orange-700 hover:shadow-sm disabled:opacity-50"
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
