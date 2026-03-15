"use client";

import { useState, useTransition } from "react";
import type { SseDashboard } from "@/lib/types/database";
import { createSseDashboard, updateSseDashboard, getSseDashboard } from "@/actions/sse-dashboard";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, Save } from "lucide-react";

const MONTH_NAMES = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

function getDefaults(): Omit<SseDashboard, "id" | "created_by" | "created_at" | "updated_at"> {
  return {
    month: currentMonth,
    year: currentYear,
    accidents_with_leave: 0,
    accidents_with_leave_objective: "\u22642",
    regulatory_training_completion: 0,
    regulatory_training_objective: "> 95%",
    regulatory_compliance_rate: 0,
    regulatory_compliance_objective: "> 80 %",
    periodic_verification_rate: 0,
    periodic_verification_objective: "> 95%",
    waste_monitoring: 0,
    waste_monitoring_objective: "> 95%",
    sst_rate: 0,
    sst_rate_objective: "> 40 %",
    downgraded_bins: 0,
    downgraded_bins_objective: 0,
    accidents_without_leave: 0,
    accidents_without_leave_objective: 0,
    cross_visits: 0,
    cross_visits_objective: "--",
    managerial_visits: 0,
    managerial_visits_objective: 8,
    sd_declarants_percentage: 0,
    sd_declarants_objective: 0.12,
    sd_declared_count: 0,
    sd_declared_objective: 6,
    waste_awareness_employees: 0,
    waste_awareness_objective: "--",
    training_plan_follow_rate: 0,
    training_plan_objective: "100%",
    field_visits_count: 0,
    monthly_report: "",
    action_priorities: [],
    vigilance_points: [],
    focus_event_title: "Accident avec arret",
    focus_event_content: [],
    quote: "Aucune urgence, aucune importance sont prioritaires sur la securite",
  };
}

interface SseDashboardFormProps {
  dashboard?: SseDashboard;
  onSave: (dashboard: SseDashboard) => void;
  onCancel: () => void;
}

export function SseDashboardForm({ dashboard, onSave, onCancel }: SseDashboardFormProps) {
  const isEditing = !!dashboard;
  const [form, setForm] = useState(() => {
    if (dashboard) {
      const { id, created_by, created_at, updated_at, ...rest } = dashboard;
      return rest;
    }
    return getDefaults();
  });
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addToArray(key: "action_priorities" | "vigilance_points" | "focus_event_content") {
    set(key, [...form[key], ""]);
  }

  function updateArrayItem(key: "action_priorities" | "vigilance_points" | "focus_event_content", index: number, value: string) {
    const arr = [...form[key]];
    arr[index] = value;
    set(key, arr);
  }

  function removeArrayItem(key: "action_priorities" | "vigilance_points" | "focus_event_content", index: number) {
    set(key, form[key].filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (form.month < 1 || form.month > 12) {
      toast.error("Mois invalide");
      return;
    }

    startTransition(async () => {
      if (isEditing && dashboard) {
        const result = await updateSseDashboard(dashboard.id, form);
        if (result.success) {
          const updated = await getSseDashboard(dashboard.id);
          if (updated) onSave(updated);
        } else {
          toast.error(result.error || "Erreur lors de la mise a jour");
        }
      } else {
        const result = await createSseDashboard(form);
        if (result.success && result.id) {
          const created = await getSseDashboard(result.id);
          if (created) onSave(created);
        } else {
          toast.error(result.error || "Erreur lors de la creation");
        }
      }
    });
  }

  return (
    <div>
      <button
        onClick={onCancel}
        className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour a la liste
      </button>

      <div className="space-y-6">
        {/* Periode */}
        <Section title="Periode">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Mois</label>
              <select
                value={form.month}
                onChange={(e) => set("month", parseInt(e.target.value))}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Annee</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => set("year", parseInt(e.target.value) || currentYear)}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
              />
            </div>
          </div>
        </Section>

        {/* Indicateurs principaux */}
        <Section title="Indicateurs principaux">
          <div className="overflow-hidden rounded-[var(--radius-xs)] border border-[var(--border-1)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--hover)]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Indicateur</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Realise</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Objectif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-1)]">
                <IndicatorRow
                  label="Nombre d'Accidents en Service Avec Arrets (ASAA)"
                  value={form.accidents_with_leave}
                  onValueChange={(v) => set("accidents_with_leave", v)}
                  objective={form.accidents_with_leave_objective}
                  onObjectiveChange={(v) => set("accidents_with_leave_objective", v)}
                  type="number"
                />
                <IndicatorRow
                  label="Suivi des formations reglementaires"
                  value={form.regulatory_training_completion}
                  onValueChange={(v) => set("regulatory_training_completion", v)}
                  objective={form.regulatory_training_objective}
                  onObjectiveChange={(v) => set("regulatory_training_objective", v)}
                  type="decimal"
                />
                <IndicatorRow
                  label="Taux de conformite reglementaire"
                  value={form.regulatory_compliance_rate}
                  onValueChange={(v) => set("regulatory_compliance_rate", v)}
                  objective={form.regulatory_compliance_objective}
                  onObjectiveChange={(v) => set("regulatory_compliance_objective", v)}
                  type="decimal"
                />
                <IndicatorRow
                  label="Taux de realisation de la verification periodique"
                  value={form.periodic_verification_rate}
                  onValueChange={(v) => set("periodic_verification_rate", v)}
                  objective={form.periodic_verification_objective}
                  onObjectiveChange={(v) => set("periodic_verification_objective", v)}
                  type="decimal"
                  suffix="%"
                />
                <IndicatorRow
                  label="Suivi des dechets"
                  value={form.waste_monitoring}
                  onValueChange={(v) => set("waste_monitoring", v)}
                  objective={form.waste_monitoring_objective}
                  onObjectiveChange={(v) => set("waste_monitoring_objective", v)}
                  type="decimal"
                  suffix="%"
                />
                <IndicatorRow
                  label="Taux de SST"
                  value={form.sst_rate}
                  onValueChange={(v) => set("sst_rate", v)}
                  objective={form.sst_rate_objective}
                  onObjectiveChange={(v) => set("sst_rate_objective", v)}
                  type="decimal"
                  suffix="%"
                />
                <tr>
                  <td className="px-3 py-2 text-sm text-[var(--heading)]">Bennes declassees</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={form.downgraded_bins}
                      onChange={(e) => set("downgraded_bins", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={form.downgraded_bins_objective}
                      onChange={(e) => set("downgraded_bins_objective", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Indicateurs de suivi */}
        <Section title="Indicateurs de suivi">
          <div className="overflow-hidden rounded-[var(--radius-xs)] border border-[var(--border-1)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--hover)]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Indicateur</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Objectif</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Realise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-1)]">
                <tr>
                  <td className="px-3 py-2 text-sm text-[var(--heading)]">Nombre d&apos;accidents en service sans arret (ASSA)</td>
                  <td className="px-3 py-2">
                    <input type="number" value={form.accidents_without_leave_objective} onChange={(e) => set("accidents_without_leave_objective", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={form.accidents_without_leave} onChange={(e) => set("accidents_without_leave", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm text-[var(--heading)]">Nombre de visites croisees</td>
                  <td className="px-3 py-2">
                    <input type="text" value={form.cross_visits_objective} onChange={(e) => set("cross_visits_objective", e.target.value)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={form.cross_visits} onChange={(e) => set("cross_visits", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm text-[var(--heading)]">Nombre de visites manageriales</td>
                  <td className="px-3 py-2">
                    <input type="number" value={form.managerial_visits_objective} onChange={(e) => set("managerial_visits_objective", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={form.managerial_visits} onChange={(e) => set("managerial_visits", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm text-[var(--heading)]">% de declarants de SD (salaries)</td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.01" value={form.sd_declarants_objective} onChange={(e) => set("sd_declarants_objective", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.01" value={form.sd_declarants_percentage} onChange={(e) => set("sd_declarants_percentage", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm text-[var(--heading)]">Nombres de SD declares</td>
                  <td className="px-3 py-2">
                    <input type="number" value={form.sd_declared_objective} onChange={(e) => set("sd_declared_objective", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={form.sd_declared_count} onChange={(e) => set("sd_declared_count", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm text-[var(--heading)]">Nombre de salaries sensibilises au tri des dechets</td>
                  <td className="px-3 py-2">
                    <input type="text" value={form.waste_awareness_objective} onChange={(e) => set("waste_awareness_objective", e.target.value)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={form.waste_awareness_employees} onChange={(e) => set("waste_awareness_employees", parseInt(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm text-[var(--heading)]">Taux de suivi du plan de formation</td>
                  <td className="px-3 py-2">
                    <input type="text" value={form.training_plan_objective} onChange={(e) => set("training_plan_objective", e.target.value)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.1" value={form.training_plan_follow_rate} onChange={(e) => set("training_plan_follow_rate", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Visites terrain */}
        <Section title="Visites terrain">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nombre de visites terrain</label>
            <input
              type="number"
              value={form.field_visits_count}
              onChange={(e) => set("field_visits_count", parseInt(e.target.value) || 0)}
              className="w-48 rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
        </Section>

        {/* Bilan mensuel */}
        <Section title="Bilan mensuel">
          <textarea
            value={form.monthly_report}
            onChange={(e) => set("monthly_report", e.target.value)}
            rows={6}
            placeholder="Redigez le bilan mensuel..."
            className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
          />
        </Section>

        {/* Priorites d'action */}
        <Section title="Priorites d'action">
          <DynamicList
            items={form.action_priorities}
            onAdd={() => addToArray("action_priorities")}
            onUpdate={(i, v) => updateArrayItem("action_priorities", i, v)}
            onRemove={(i) => removeArrayItem("action_priorities", i)}
            placeholder="Nouvelle priorite..."
          />
        </Section>

        {/* Points de vigilance */}
        <Section title="Points de vigilance / alerte">
          <DynamicList
            items={form.vigilance_points}
            onAdd={() => addToArray("vigilance_points")}
            onUpdate={(i, v) => updateArrayItem("vigilance_points", i, v)}
            onRemove={(i) => removeArrayItem("vigilance_points", i)}
            placeholder="Nouveau point de vigilance..."
          />
        </Section>

        {/* Focus evenement */}
        <Section title="Focus evenement">
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Titre de l&apos;evenement</label>
            <input
              type="text"
              value={form.focus_event_title}
              onChange={(e) => set("focus_event_title", e.target.value)}
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
          <DynamicList
            items={form.focus_event_content}
            onAdd={() => addToArray("focus_event_content")}
            onUpdate={(i, v) => updateArrayItem("focus_event_content", i, v)}
            onRemove={(i) => removeArrayItem("focus_event_content", i)}
            placeholder="Nouveau point..."
          />
        </Section>

        {/* Citation */}
        <Section title="Citation">
          <input
            type="text"
            value={form.quote}
            onChange={(e) => set("quote", e.target.value)}
            className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-2 text-sm italic text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
          />
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-1)] pt-6">
          <button
            onClick={onCancel}
            className="rounded-[var(--radius-xs)] border border-[var(--border-2)] px-4 py-2 text-sm font-medium text-[var(--heading)] transition-colors hover:bg-[var(--hover)]"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Enregistrement..." : isEditing ? "Mettre a jour" : "Creer le tableau"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] p-5 shadow-xs">
      <h3 className="mb-4 text-sm font-semibold text-[var(--heading)]">{title}</h3>
      {children}
    </div>
  );
}

function IndicatorRow({
  label,
  value,
  onValueChange,
  objective,
  onObjectiveChange,
  type,
  suffix,
}: {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  objective: string;
  onObjectiveChange: (v: string) => void;
  type: "number" | "decimal";
  suffix?: string;
}) {
  return (
    <tr>
      <td className="px-3 py-2 text-sm text-[var(--heading)]">{label}</td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-center gap-1">
          <input
            type="number"
            step={type === "decimal" ? "0.1" : "1"}
            value={value}
            onChange={(e) => onValueChange(type === "decimal" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
            className="w-20 rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]"
          />
          {suffix && <span className="text-xs text-[var(--text-muted)]">{suffix}</span>}
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={objective}
          onChange={(e) => onObjectiveChange(e.target.value)}
          className="w-full rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-2 py-1 text-center text-sm outline-none focus:border-[var(--yellow)]"
        />
      </td>
    </tr>
  );
}

function DynamicList({
  items,
  onAdd,
  onUpdate,
  onRemove,
  placeholder,
}: {
  items: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-1.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
          />
          <button
            onClick={() => onRemove(i)}
            className="rounded-[var(--radius-xs)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--yellow)] transition-colors hover:text-[var(--yellow-hover)]"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter
      </button>
    </div>
  );
}
