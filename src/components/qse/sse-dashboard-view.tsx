"use client";

import { useState, useRef, useTransition } from "react";
import type { SseDashboard } from "@/lib/types/database";
import { CompanyLogo } from "@/components/ui/company-logo";
import { SseDashboardForm } from "@/components/admin/sse-dashboard-form";
import { deleteSseDashboard } from "@/actions/sse-dashboard";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Download, FileSpreadsheet, Plus, Pencil, Trash2,
  Calendar, BarChart3, Eye, Edit3,
} from "lucide-react";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function getNextMonthLabel(month: number, year: number): string {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${MONTH_NAMES[nextMonth - 1].toLowerCase()} ${nextYear}`;
}

function parseObjective(objective: string): { operator: string; value: number } | null {
  const match = objective.match(/([<>=≤≥]+)\s*([\d.,]+)\s*%?/);
  if (!match) return null;
  return { operator: match[1], value: parseFloat(match[2].replace(",", ".")) };
}

/**
 * Retourne la couleur d'un indicateur selon son objectif :
 * - "green"  : objectif atteint
 * - "orange" : objectif pas atteint mais pas catastrophique
 * - "red"    : vraiment pas atteint (< 40% pour les pourcentages, > objectif pour les limites)
 * - null     : pas d'objectif à évaluer
 */
function getIndicatorStatus(realise: number, objectiveStr: string): "green" | "orange" | "red" | null {
  if (objectiveStr === "--" || objectiveStr === "") return null;
  const parsed = parseObjective(objectiveStr);
  if (!parsed) return null;
  const { operator, value } = parsed;

  switch (operator) {
    // "Plus c'est haut, mieux c'est" (ex: > 95%, > 80%)
    case ">":
      if (realise > value) return "green";
      if (realise >= 40) return "orange";
      return "red";
    case ">=":
    case "≥":
      if (realise >= value) return "green";
      if (realise >= 40) return "orange";
      return "red";
    // "Plus c'est bas, mieux c'est" (ex: ≤2 accidents)
    case "<":
      if (realise < value) {
        return realise === 0 ? "green" : "orange";
      }
      return "red";
    case "<=":
    case "≤":
      if (realise <= value) {
        return realise === 0 ? "green" : "orange";
      }
      return "red";
    case "=":
      return realise === value ? "green" : "red";
    default:
      return null;
  }
}

function getStatusColorClass(status: "green" | "orange" | "red" | null): string {
  switch (status) {
    case "green": return "text-emerald-600";
    case "orange": return "text-orange-500";
    case "red": return "text-red-600";
    default: return "text-[var(--heading)]";
  }
}

function formatFr(value: number): string {
  return value.toString().replace(".", ",");
}

function getSstColorClass(rate: number): string {
  if (rate >= 80) return "text-emerald-600";
  if (rate >= 60) return "text-yellow-500";
  if (rate >= 40) return "text-orange-500";
  return "text-red-600";
}

function ValueCell({ value, objective, isPercentage = false, colorClass }: { value: number; objective: string; isPercentage?: boolean; colorClass?: string }) {
  const status = colorClass ? null : getIndicatorStatus(value, objective);
  const display = isPercentage ? `${formatFr(value)}%` : formatFr(value);
  const cls = colorClass ?? getStatusColorClass(status);
  return (
    <td className={`px-4 py-2.5 text-center text-sm font-semibold ${cls}`}>
      {display}
    </td>
  );
}

interface SseDashboardViewProps {
  dashboards: SseDashboard[];
  initialDashboard: SseDashboard | null;
  canManage?: boolean;
  logos?: { light: string | null; dark: string | null } | null;
}

export function SseDashboardView({ dashboards: initialDashboards, initialDashboard, canManage = false, logos }: SseDashboardViewProps) {
  const [dashboards, setDashboards] = useState(initialDashboards);
  const [selected, setSelected] = useState<SseDashboard | null>(null);
  const [mode, setMode] = useState<"list" | "detail" | "create" | "edit">("list");
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SseDashboard | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Group dashboards by year
  const grouped = dashboards.reduce<Record<number, SseDashboard[]>>((acc, d) => {
    if (!acc[d.year]) acc[d.year] = [];
    acc[d.year].push(d);
    return acc;
  }, {});
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  function sortDashboards(list: SseDashboard[]) {
    return [...list].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  function openDetail(d: SseDashboard) {
    setSelected(d);
    setMode("detail");
  }

  function backToList() {
    setSelected(null);
    setMode("list");
  }

  function handleCreated(newDashboard: SseDashboard) {
    setDashboards(sortDashboards([...dashboards, newDashboard]));
    setSelected(newDashboard);
    setMode("detail");
    toast.success("Tableau SSE créé avec succès");
  }

  function handleUpdated(updatedDashboard: SseDashboard) {
    setDashboards(dashboards.map((d) => (d.id === updatedDashboard.id ? updatedDashboard : d)));
    setSelected(updatedDashboard);
    setMode("detail");
    toast.success("Tableau SSE mis à jour");
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const result = await deleteSseDashboard(deleteTarget.id);
      if (result.success) {
        setDashboards((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        if (selected?.id === deleteTarget.id) {
          setSelected(null);
          setMode("list");
        }
        toast.success("Tableau SSE supprimé");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
      setDeleteTarget(null);
    });
  }

  async function handleExportPdf() {
    if (!selected) return;
    setExporting("pdf");
    try {
      const { exportSsePdf } = await import("@/lib/export/sse-pdf");
      exportSsePdf(selected, `Tableau_SSE_${MONTH_NAMES[selected.month - 1]}_${selected.year}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Erreur lors de l'export PDF");
    }
    setExporting(null);
  }

  async function handleExportExcel() {
    if (!selected) return;
    setExporting("excel");
    try {
      const { exportSseExcel } = await import("@/lib/export/sse-excel");
      exportSseExcel(selected, `Tableau_SSE_${MONTH_NAMES[selected.month - 1]}_${selected.year}.xlsx`);
    } catch {
      toast.error("Erreur lors de l'export Excel");
    }
    setExporting(null);
  }

  // ─── CREATE / EDIT FORM ─────────────────────────────────────
  if (mode === "create") {
    return <SseDashboardForm onSave={handleCreated} onCancel={backToList} />;
  }
  if (mode === "edit" && selected) {
    return <SseDashboardForm dashboard={selected} onSave={handleUpdated} onCancel={() => setMode("detail")} />;
  }

  // ─── DETAIL VIEW ────────────────────────────────────────────
  if (mode === "detail" && selected) {
    const d = selected;
    const monthLabel = MONTH_NAMES[d.month - 1];

    return (
      <div>
        {/* Top bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={backToList}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Tous les tableaux
          </button>
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  onClick={() => setMode("edit")}
                  className="flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--heading)] transition-colors hover:bg-[var(--hover)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteTarget(d)}
                  className="flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              </>
            )}
            <button
              onClick={handleExportPdf}
              disabled={exporting !== null}
              className="flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--navy)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting === "pdf" ? "Export..." : "PDF"}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting !== null}
              className="flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--heading)] transition-colors hover:bg-[var(--hover)] disabled:opacity-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {exporting === "excel" ? "Export..." : "Excel"}
            </button>
          </div>
        </div>

        {/* Dashboard card for PDF capture */}
        <div
          ref={printRef}
          className="overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-white shadow-sm"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--border-1)] bg-white px-8 py-6">
            <div className="flex items-center gap-6">
              <CompanyLogo logoUrl={logos} variant="light" width={140} height={44} />
              <div>
                <p className="text-lg font-bold text-[var(--navy)]">INNOVTEC</p>
                <p className="text-sm font-semibold text-[var(--navy)]">{monthLabel} {d.year}</p>
              </div>
            </div>
            <h1 className="text-right text-xl font-bold text-[var(--navy)]" style={{ fontFamily: "var(--font-display, Sora, sans-serif)" }}>
              Tableau de bord santé-sécurité-environnement
            </h1>
          </div>

          {/* Quote */}
          <div className="border-b border-[var(--border-1)] bg-[#f8f9fb] px-8 py-3">
            <p className="text-xs italic text-[var(--navy)]" style={{ opacity: 0.7 }}>
              &laquo; {d.quote} &raquo;
            </p>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-2">
            {/* Left table */}
            <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-1)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[var(--navy)]">
                    <th className="px-4 py-2.5 text-xs font-semibold text-white">Indicateurs</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-white">Réalisé</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-white">Objectif {d.year}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-1)]">
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre d&apos;Accidents en Service Avec Arrêts (ASAA)</td><ValueCell value={d.accidents_with_leave} objective={d.accidents_with_leave_objective} /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.accidents_with_leave_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Suivi des formations réglementaires</td><ValueCell value={d.regulatory_training_completion} objective={d.regulatory_training_objective} /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.regulatory_training_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Taux de conformité réglementaire</td><ValueCell value={d.regulatory_compliance_rate} objective={d.regulatory_compliance_objective} /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.regulatory_compliance_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Taux de réalisation de la vérification périodique</td><ValueCell value={d.periodic_verification_rate} objective={d.periodic_verification_objective} isPercentage /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.periodic_verification_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm font-medium text-emerald-600">Suivi des déchets</td><ValueCell value={d.waste_monitoring} objective={d.waste_monitoring_objective} isPercentage /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.waste_monitoring_objective}</td></tr>
                  <tr><td className={`px-4 py-2.5 text-sm font-medium ${getSstColorClass(d.sst_rate)}`}>Taux de SST</td><ValueCell value={d.sst_rate} objective={d.sst_rate_objective} isPercentage colorClass={getSstColorClass(d.sst_rate)} /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.sst_rate_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">{d.downgraded_bins} Bennes déclassées</td><td className="px-4 py-2.5 text-center text-sm text-[var(--heading)]">{d.downgraded_bins}</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.downgraded_bins_objective}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Right table */}
            <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-1)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[var(--navy)]">
                    <th className="px-4 py-2.5 text-xs font-semibold text-white">Indicateurs de suivi</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-white">Objectif</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-white">Réalisé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-1)]">
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre d&apos;accidents en service sans arrêt (ASSA)</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.accidents_without_leave_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.accidents_without_leave}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre de visites croisées</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.cross_visits_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.cross_visits}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre de visites managériales</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.managerial_visits_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.managerial_visits}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">% de déclarants de SD (salariés)</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{formatFr(d.sd_declarants_objective)}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{formatFr(d.sd_declarants_percentage)}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombres de SD déclarés</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.sd_declared_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.sd_declared_count}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre de salariés sensibilisés au tri des déchets</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.waste_awareness_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.waste_awareness_employees}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Taux de suivi du plan de formation</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.training_plan_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-emerald-600">{formatFr(d.training_plan_follow_rate)}%</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom sections */}
          <div className="grid grid-cols-1 gap-6 border-t border-[var(--border-1)] px-8 py-6 lg:grid-cols-3">
            <div>
              <div className="mb-3 inline-block rounded-[var(--radius-xs)] bg-[var(--navy)] px-4 py-1.5">
                <h3 className="text-xs font-semibold text-white">Bilan mensuel</h3>
              </div>
              <div className="text-sm leading-relaxed text-[var(--text)]" style={{ whiteSpace: "pre-line" }}>
                {d.monthly_report || "Aucun bilan renseigné."}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="mb-3 inline-block rounded-[var(--radius-xs)] bg-[var(--navy)] px-4 py-1.5">
                <h3 className="text-xs font-semibold text-white">Visites terrain</h3>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--yellow)]">
                <span className="text-2xl font-bold text-white">{d.field_visits_count}</span>
              </div>
            </div>
            <div>
              <div className="mb-3 inline-block rounded-[var(--radius-xs)] bg-[var(--navy)] px-4 py-1.5">
                <h3 className="text-xs font-semibold text-white">Priorités d&apos;action pour {getNextMonthLabel(d.month, d.year)}</h3>
              </div>
              {d.action_priorities.length > 0 ? (
                <ul className="space-y-1.5">{d.action_priorities.map((p, i) => (<li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--navy)]" />{p}</li>))}</ul>
              ) : (<p className="text-sm text-[var(--text-muted)]">Aucune priorité renseignée.</p>)}
            </div>
          </div>

          {/* Vigilance + Focus */}
          <div className="grid grid-cols-1 gap-6 border-t border-[var(--border-1)] px-8 py-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-3 inline-block rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-1.5">
                <h3 className="text-xs font-semibold text-white">Point de vigilance/alerte</h3>
              </div>
              {d.vigilance_points.length > 0 ? (
                <ul className="space-y-1.5">{d.vigilance_points.map((p, i) => (<li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--yellow)]" />{p}</li>))}</ul>
              ) : (<p className="text-sm text-[var(--text-muted)]">Aucun point de vigilance.</p>)}
            </div>
            <div>
              <div className="mb-3 inline-block rounded-[var(--radius-xs)] border-2 border-[var(--navy)] px-4 py-1.5">
                <h3 className="text-xs font-semibold text-[var(--navy)]">Focus événement -- {d.focus_event_title}</h3>
              </div>
              {d.focus_event_content.length > 0 ? (
                <ul className="space-y-1.5">{d.focus_event_content.map((p, i) => (<li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--navy)]" />{p}</li>))}</ul>
              ) : (<p className="text-sm text-[var(--text-muted)]">Aucun événement à signaler.</p>)}
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-[var(--border-1)] px-8 py-2">
            <span className="text-xs text-[var(--text-muted)]">1</span>
          </div>
        </div>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Supprimer ce tableau SSE ?"
          message={`Le tableau de ${deleteTarget ? MONTH_NAMES[deleteTarget.month - 1] + " " + deleteTarget.year : ""} sera définitivement supprimé.`}
          confirmLabel="Supprimer"
          variant="danger"
          loading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    );
  }

  // ─── LISTING VIEW (default) ─────────────────────────────────
  const allSorted = [...dashboards].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div>
      {/* Header with action */}
      {canManage && (
        <div className="mb-6 flex items-center justify-end">
          <button
            onClick={() => setMode("create")}
            className="flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
          >
            <Plus className="h-4 w-4" />
            Nouveau tableau
          </button>
        </div>
      )}

      {allSorted.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-[var(--border-1)] bg-white py-16 text-center shadow-sm ring-1 ring-black/[0.03]">
          <BarChart3 className="mb-3 h-12 w-12 text-zinc-300" />
          <p className="text-sm font-medium text-[var(--heading)]">
            Aucun tableau SSE
          </p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--text-muted)]">
            Les tableaux de bord Santé-Sécurité-Environnement apparaîtront ici une fois créés.
          </p>
          {canManage && (
            <button
              onClick={() => setMode("create")}
              className="mt-5 flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
            >
              <Plus className="h-4 w-4" />
              Créer le premier tableau
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-1)] bg-white shadow-sm ring-1 ring-black/[0.03]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-1)] bg-[var(--hover)]">
                <th className="px-4 py-3.5 text-left text-xs font-medium text-[var(--text-secondary)]">Mois</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-[var(--text-secondary)]" style={{ width: "80px" }}>Année</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-[var(--text-secondary)]" style={{ width: "80px" }}>ASAA</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-[var(--text-secondary)]" style={{ width: "80px" }}>SST</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-[var(--text-secondary)]" style={{ width: "100px" }}>Conformité</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-[var(--text-secondary)]" style={{ width: "80px" }}>Visites</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-[var(--text-secondary)]" style={{ width: "80px" }}>Statut</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-[var(--text-secondary)]" style={{ width: "130px" }}>Date</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-[var(--text-secondary)]" style={{ width: "70px" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-1)]">
              {allSorted.map((d) => {
                const sstStatus = getIndicatorStatus(d.sst_rate, d.sst_rate_objective);
                const asaaStatus = getIndicatorStatus(d.accidents_with_leave, d.accidents_with_leave_objective);
                const complianceStatus = getIndicatorStatus(d.regulatory_compliance_rate, d.regulatory_compliance_objective);
                const hasIssues = sstStatus === "red" || sstStatus === "orange" || asaaStatus === "red" || asaaStatus === "orange";

                const dropdownItems = [
                  { label: "Voir", icon: Eye, onClick: () => openDetail(d) },
                  ...(canManage
                    ? [
                        { label: "Modifier", icon: Edit3, onClick: () => { setSelected(d); setMode("edit"); } },
                        { label: "Supprimer", icon: Trash2, variant: "danger" as const, onClick: () => setDeleteTarget(d) },
                      ]
                    : []),
                ];

                return (
                  <tr
                    key={d.id}
                    onClick={() => openDetail(d)}
                    className="cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]"
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-[var(--heading)]">{MONTH_NAMES[d.month - 1]}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-[var(--radius-xs)] bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        {d.year}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm font-semibold text-[var(--heading)]">
                      {d.accidents_with_leave}
                    </td>
                    <td className={`px-4 py-3.5 text-center text-sm font-semibold ${getSstColorClass(d.sst_rate)}`}>
                      {formatFr(d.sst_rate)}%
                    </td>
                    <td className={`px-4 py-3.5 text-center text-sm font-semibold ${getStatusColorClass(complianceStatus)}`}>
                      {formatFr(d.regulatory_compliance_rate)}%
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm font-semibold text-[var(--heading)]">
                      {d.field_visits_count}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {hasIssues ? (
                        <span className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                          Alerte
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--text-muted)]">
                      {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu items={dropdownItems} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-[var(--border-1)] px-4 py-3 text-sm text-[var(--text-muted)]">
            {allSorted.length} tableau{allSorted.length > 1 ? "x" : ""} SSE
          </div>
        </div>
      )}
    </div>
  );
}
