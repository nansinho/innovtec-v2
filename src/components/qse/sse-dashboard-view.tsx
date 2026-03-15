"use client";

import { useState, useRef, useTransition } from "react";
import type { SseDashboard } from "@/lib/types/database";
import { InnovtecLogo } from "@/components/icons/innovtec-logo";
import { SseDashboardForm } from "@/components/admin/sse-dashboard-form";
import { deleteSseDashboard } from "@/actions/sse-dashboard";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Download, FileSpreadsheet, Plus, Pencil, Trash2,
  Calendar, BarChart3, Shield, Eye,
} from "lucide-react";

const MONTH_NAMES = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aout", "Sep", "Oct", "Nov", "Dec",
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

function meetsObjective(realise: number, objectiveStr: string): boolean | null {
  if (objectiveStr === "--" || objectiveStr === "") return null;
  const parsed = parseObjective(objectiveStr);
  if (!parsed) return null;
  const { operator, value } = parsed;
  switch (operator) {
    case ">": return realise > value;
    case ">=":
    case "≥": return realise >= value;
    case "<": return realise < value;
    case "<=":
    case "≤": return realise <= value;
    case "=": return realise === value;
    default: return null;
  }
}

function ValueCell({ value, objective, isPercentage = false }: { value: number; objective: string; isPercentage?: boolean }) {
  const met = meetsObjective(value, objective);
  const display = isPercentage ? `${value}%` : value;
  return (
    <td className={`px-4 py-2.5 text-center text-sm font-semibold ${met === false ? "text-red-600" : met === true ? "text-emerald-600" : "text-[var(--heading)]"}`}>
      {display}
    </td>
  );
}

interface SseDashboardViewProps {
  dashboards: SseDashboard[];
  initialDashboard: SseDashboard | null;
  canManage?: boolean;
}

export function SseDashboardView({ dashboards: initialDashboards, initialDashboard, canManage = false }: SseDashboardViewProps) {
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
    toast.success("Tableau SSE cree avec succes");
  }

  function handleUpdated(updatedDashboard: SseDashboard) {
    setDashboards(dashboards.map((d) => (d.id === updatedDashboard.id ? updatedDashboard : d)));
    setSelected(updatedDashboard);
    setMode("detail");
    toast.success("Tableau SSE mis a jour");
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
        toast.success("Tableau SSE supprime");
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
      await exportSsePdf(printRef.current!, `Tableau_SSE_${MONTH_NAMES[selected.month - 1]}_${selected.year}.pdf`);
    } catch {
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
              <InnovtecLogo width={140} height={44} />
              <div>
                <p className="text-lg font-bold text-[var(--navy)]">INNOVTEC</p>
                <p className="text-sm font-semibold text-[var(--navy)]">{monthLabel} {d.year}</p>
              </div>
            </div>
            <h1 className="text-right text-xl font-bold text-[var(--navy)]" style={{ fontFamily: "var(--font-display, Sora, sans-serif)" }}>
              Tableau de bord sante-securite-environnement
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
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-white">Realise</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-white">Objectif {d.year}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-1)]">
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre d&apos;Accidents en Service Avec Arrets (ASAA)</td><ValueCell value={d.accidents_with_leave} objective={d.accidents_with_leave_objective} /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.accidents_with_leave_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Suivi des formations reglementaires</td><ValueCell value={d.regulatory_training_completion} objective={d.regulatory_training_objective} /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.regulatory_training_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Taux de conformite reglementaire</td><ValueCell value={d.regulatory_compliance_rate} objective={d.regulatory_compliance_objective} /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.regulatory_compliance_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Taux de realisation de la verification periodique</td><ValueCell value={d.periodic_verification_rate} objective={d.periodic_verification_objective} isPercentage /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.periodic_verification_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm font-medium text-emerald-600">Suivi des dechets</td><ValueCell value={d.waste_monitoring} objective={d.waste_monitoring_objective} isPercentage /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.waste_monitoring_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm font-medium text-red-600">Taux de SST</td><ValueCell value={d.sst_rate} objective={d.sst_rate_objective} isPercentage /><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.sst_rate_objective}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">{d.downgraded_bins} Bennes declassees</td><td className="px-4 py-2.5 text-center text-sm text-[var(--heading)]">{d.downgraded_bins}</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.downgraded_bins_objective}</td></tr>
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
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-white">Realise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-1)]">
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre d&apos;accidents en service sans arret (ASSA)</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.accidents_without_leave_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.accidents_without_leave}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre de visites croisees</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.cross_visits_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.cross_visits}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre de visites manageriales</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.managerial_visits_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.managerial_visits}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">% de declarants de SD (salaries)</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.sd_declarants_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.sd_declarants_percentage}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombres de SD declares</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.sd_declared_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.sd_declared_count}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre de salaries sensibilises au tri des dechets</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.waste_awareness_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{d.waste_awareness_employees}</td></tr>
                  <tr><td className="px-4 py-2.5 text-sm text-[var(--heading)]">Taux de suivi du plan de formation</td><td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{d.training_plan_objective}</td><td className="px-4 py-2.5 text-center text-sm font-semibold text-emerald-600">{d.training_plan_follow_rate}%</td></tr>
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
                {d.monthly_report || "Aucun bilan renseigne."}
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
                <h3 className="text-xs font-semibold text-white">Priorites d&apos;action pour {getNextMonthLabel(d.month, d.year)}</h3>
              </div>
              {d.action_priorities.length > 0 ? (
                <ul className="space-y-1.5">{d.action_priorities.map((p, i) => (<li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--navy)]" />{p}</li>))}</ul>
              ) : (<p className="text-sm text-[var(--text-muted)]">Aucune priorite renseignee.</p>)}
            </div>
          </div>

          {/* Vigilance + Focus */}
          <div className="grid grid-cols-1 gap-6 border-t border-[var(--border-1)] px-8 py-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 inline-block rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-1.5">
                <h3 className="text-xs font-semibold text-white">Point de vigilance/alerte</h3>
              </div>
              {d.vigilance_points.length > 0 ? (
                <ul className="space-y-1.5">{d.vigilance_points.map((p, i) => (<li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--yellow)]" />{p}</li>))}</ul>
              ) : (<p className="text-sm text-[var(--text-muted)]">Aucun point de vigilance.</p>)}
            </div>
            <div>
              <div className="mb-3 inline-block rounded-[var(--radius-xs)] border-2 border-[var(--navy)] px-4 py-1.5">
                <h3 className="text-xs font-semibold text-[var(--navy)]">Focus evenement -- {d.focus_event_title}</h3>
              </div>
              {d.focus_event_content.length > 0 ? (
                <ul className="space-y-1.5">{d.focus_event_content.map((p, i) => (<li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--navy)]" />{p}</li>))}</ul>
              ) : (<p className="text-sm text-[var(--text-muted)]">Aucun evenement a signaler.</p>)}
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-[var(--border-1)] px-8 py-2">
            <span className="text-xs text-[var(--text-muted)]">1</span>
          </div>
        </div>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Supprimer ce tableau SSE ?"
          message={`Le tableau de ${deleteTarget ? MONTH_NAMES[deleteTarget.month - 1] + " " + deleteTarget.year : ""} sera definitivement supprime.`}
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

      {years.length === 0 ? (
        <div className="flex flex-col items-center rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-20 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(26, 45, 78, 0.06)" }}>
            <BarChart3 className="h-7 w-7 text-[var(--navy)]" />
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--heading)]">
            Aucun tableau SSE
          </p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-[var(--text-muted)]">
            Les tableaux de bord Sante-Securite-Environnement apparaitront ici une fois crees.
          </p>
          {canManage && (
            <button
              onClick={() => setMode("create")}
              className="mt-5 flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
            >
              <Plus className="h-4 w-4" />
              Creer le premier tableau
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {years.map((year) => {
            const yearDashboards = grouped[year].sort((a, b) => b.month - a.month);
            return (
              <div key={year}>
                {/* Year header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--navy)]">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--heading)]">{year}</h2>
                  <span className="rounded-full bg-[var(--navy)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--navy)]">
                    {yearDashboards.length} tableau{yearDashboards.length > 1 ? "x" : ""}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border-1)]" />
                </div>

                {/* Month cards grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {yearDashboards.map((d) => {
                    const hasIssues = meetsObjective(d.sst_rate, d.sst_rate_objective) === false ||
                      meetsObjective(d.accidents_with_leave, d.accidents_with_leave_objective) === false;

                    return (
                      <button
                        key={d.id}
                        onClick={() => openDetail(d)}
                        className="group relative overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] p-5 text-left shadow-xs transition-all hover:border-[var(--border-2)] hover:shadow-md"
                      >
                        {/* Month badge */}
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--navy)]">
                              <span className="text-xs font-bold text-white">{MONTH_SHORT[d.month - 1]}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--heading)]">{MONTH_NAMES[d.month - 1]}</p>
                              <p className="text-[11px] text-[var(--text-muted)]">{d.year}</p>
                            </div>
                          </div>
                          {hasIssues && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                            </div>
                          )}
                          {!hasIssues && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                          )}
                        </div>

                        {/* Key metrics */}
                        <div className="mb-3 grid grid-cols-3 gap-2">
                          <div className="rounded-[var(--radius-xs)] bg-[var(--hover)] px-2 py-1.5 text-center">
                            <p className="text-[10px] font-medium text-[var(--text-muted)]">ASAA</p>
                            <p className="text-sm font-bold text-[var(--heading)]">{d.accidents_with_leave}</p>
                          </div>
                          <div className="rounded-[var(--radius-xs)] bg-[var(--hover)] px-2 py-1.5 text-center">
                            <p className="text-[10px] font-medium text-[var(--text-muted)]">SST</p>
                            <p className={`text-sm font-bold ${meetsObjective(d.sst_rate, d.sst_rate_objective) === false ? "text-red-600" : "text-emerald-600"}`}>{d.sst_rate}%</p>
                          </div>
                          <div className="rounded-[var(--radius-xs)] bg-[var(--hover)] px-2 py-1.5 text-center">
                            <p className="text-[10px] font-medium text-[var(--text-muted)]">Visites</p>
                            <p className="text-sm font-bold text-[var(--heading)]">{d.field_visits_count}</p>
                          </div>
                        </div>

                        {/* View link */}
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors group-hover:text-[var(--navy)]">
                          <Eye className="h-3.5 w-3.5" />
                          Voir le tableau
                        </div>

                        {/* Accent bar */}
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--navy)] to-[var(--yellow)] opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
