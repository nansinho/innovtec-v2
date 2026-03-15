"use client";

import { useState, useRef, useTransition } from "react";
import type { SseDashboard } from "@/lib/types/database";
import { InnovtecLogo } from "@/components/icons/innovtec-logo";
import { SseDashboardForm } from "@/components/admin/sse-dashboard-form";
import { deleteSseDashboard, getSseDashboard } from "@/actions/sse-dashboard";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, Plus, Pencil, Trash2 } from "lucide-react";

const MONTH_NAMES = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
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
  const [currentIndex, setCurrentIndex] = useState(
    initialDashboard ? initialDashboards.findIndex((d) => d.id === initialDashboard.id) : 0
  );
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  // Admin state
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const [deleteTarget, setDeleteTarget] = useState<SseDashboard | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const dashboard = dashboards[currentIndex] ?? null;

  function sortDashboards(list: SseDashboard[]) {
    return [...list].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  function handleCreated(newDashboard: SseDashboard) {
    const updated = sortDashboards([...dashboards, newDashboard]);
    setDashboards(updated);
    setCurrentIndex(updated.findIndex((d) => d.id === newDashboard.id));
    setMode("view");
    toast.success("Tableau SSE cree avec succes");
  }

  function handleUpdated(updatedDashboard: SseDashboard) {
    const updated = dashboards.map((d) => (d.id === updatedDashboard.id ? updatedDashboard : d));
    setDashboards(updated);
    setMode("view");
    toast.success("Tableau SSE mis a jour");
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const result = await deleteSseDashboard(deleteTarget.id);
      if (result.success) {
        const updated = dashboards.filter((d) => d.id !== deleteTarget.id);
        setDashboards(updated);
        if (currentIndex >= updated.length) setCurrentIndex(Math.max(0, updated.length - 1));
        toast.success("Tableau SSE supprime");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
      setDeleteTarget(null);
    });
  }

  const canPrev = currentIndex < dashboards.length - 1;
  const canNext = currentIndex > 0;
  const monthLabel = dashboard ? MONTH_NAMES[dashboard.month - 1] : "";

  async function handleExportPdf() {
    setExporting("pdf");
    try {
      const { exportSsePdf } = await import("@/lib/export/sse-pdf");
      await exportSsePdf(printRef.current!, `Tableau_SSE_${monthLabel}_${dashboard!.year}.pdf`);
    } catch {
      toast.error("Erreur lors de l'export PDF");
    }
    setExporting(null);
  }

  async function handleExportExcel() {
    setExporting("excel");
    try {
      const { exportSseExcel } = await import("@/lib/export/sse-excel");
      exportSseExcel(dashboard!, `Tableau_SSE_${monthLabel}_${dashboard!.year}.xlsx`);
    } catch {
      toast.error("Erreur lors de l'export Excel");
    }
    setExporting(null);
  }

  // Show form for create/edit
  if (mode === "create") {
    return (
      <SseDashboardForm
        onSave={handleCreated}
        onCancel={() => setMode("view")}
      />
    );
  }

  if (mode === "edit" && dashboard) {
    return (
      <SseDashboardForm
        dashboard={dashboard}
        onSave={handleUpdated}
        onCancel={() => setMode("view")}
      />
    );
  }

  // Empty state
  if (!dashboard) {
    return (
      <div>
        <div className="flex flex-col items-center rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-xs">
          <p className="text-sm font-medium text-[var(--heading)]">Aucun tableau SSE disponible</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-[var(--text-muted)]">
            Les tableaux de bord SSE seront disponibles une fois crees.
          </p>
          {canManage && (
            <button
              onClick={() => setMode("create")}
              className="mt-4 flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
            >
              <Plus className="h-4 w-4" />
              Creer un tableau
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            disabled={!canPrev}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-[var(--heading)]">
            {monthLabel} {dashboard.year}
          </span>
          <button
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={!canNext}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)] disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={() => setMode("create")}
                className="flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Nouveau
              </button>
              <button
                onClick={() => setMode("edit")}
                className="flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--border-2)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--heading)] transition-colors hover:bg-[var(--hover)]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
              <button
                onClick={() => setDeleteTarget(dashboard)}
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

      {/* Dashboard content - also used for PDF capture */}
      <div
        ref={printRef}
        className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white shadow-sm"
        style={{ overflow: "hidden" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-1)] bg-white px-8 py-6">
          <div className="flex items-center gap-6">
            <InnovtecLogo width={140} height={44} />
            <div>
              <p className="text-lg font-bold text-[var(--navy)]">INNOVTEC</p>
              <p className="text-sm font-semibold text-[var(--navy)]">{monthLabel} {dashboard.year}</p>
            </div>
          </div>
          <h1 className="text-right text-xl font-bold text-[var(--navy)]" style={{ fontFamily: "var(--font-display, Sora, sans-serif)" }}>
            Tableau de bord sante-securite-environnement
          </h1>
        </div>

        {/* Quote */}
        <div className="border-b border-[var(--border-1)] bg-[#f8f9fb] px-8 py-3">
          <p className="text-xs italic text-[var(--navy)]" style={{ opacity: 0.7 }}>
            &laquo; {dashboard.quote} &raquo;
          </p>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-2">
          {/* Left table - Indicateurs */}
          <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-1)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--navy)]">
                  <th className="px-4 py-2.5 text-xs font-semibold text-white">Indicateurs</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-white">Realise</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-white">Objectif {dashboard.year}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-1)]">
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre d&apos;Accidents en Service Avec Arrets (ASAA)</td>
                  <ValueCell value={dashboard.accidents_with_leave} objective={dashboard.accidents_with_leave_objective} />
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.accidents_with_leave_objective}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Suivi des formations reglementaires</td>
                  <ValueCell value={dashboard.regulatory_training_completion} objective={dashboard.regulatory_training_objective} />
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.regulatory_training_objective}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Taux de conformite reglementaire</td>
                  <ValueCell value={dashboard.regulatory_compliance_rate} objective={dashboard.regulatory_compliance_objective} />
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.regulatory_compliance_objective}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Taux de realisation de la verification periodique</td>
                  <ValueCell value={dashboard.periodic_verification_rate} objective={dashboard.periodic_verification_objective} isPercentage />
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.periodic_verification_objective}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-emerald-600 font-medium">Suivi des dechets</td>
                  <ValueCell value={dashboard.waste_monitoring} objective={dashboard.waste_monitoring_objective} isPercentage />
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.waste_monitoring_objective}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-red-600 font-medium">Taux de SST</td>
                  <ValueCell value={dashboard.sst_rate} objective={dashboard.sst_rate_objective} isPercentage />
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.sst_rate_objective}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">{dashboard.downgraded_bins} Bennes declassees</td>
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--heading)]">{dashboard.downgraded_bins}</td>
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.downgraded_bins_objective}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right table - Indicateurs de suivi */}
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
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre d&apos;accidents en service sans arret (ASSA)</td>
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.accidents_without_leave_objective}</td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{dashboard.accidents_without_leave}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre de visites croisees</td>
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.cross_visits_objective}</td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{dashboard.cross_visits}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre de visites manageriales</td>
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.managerial_visits_objective}</td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{dashboard.managerial_visits}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">% de declarants de SD (salaries)</td>
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.sd_declarants_objective}</td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{dashboard.sd_declarants_percentage}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombres de SD declares</td>
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.sd_declared_objective}</td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{dashboard.sd_declared_count}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Nombre de salaries sensibilises au tri des dechets</td>
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.waste_awareness_objective}</td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-[var(--heading)]">{dashboard.waste_awareness_employees}</td>
                </tr>
                <tr className="hover:bg-[var(--hover)]">
                  <td className="px-4 py-2.5 text-sm text-[var(--heading)]">Taux de suivi du plan de formation</td>
                  <td className="px-4 py-2.5 text-center text-sm text-[var(--text-secondary)]">{dashboard.training_plan_objective}</td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-emerald-600">{dashboard.training_plan_follow_rate}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom sections */}
        <div className="grid grid-cols-1 gap-6 border-t border-[var(--border-1)] px-8 py-6 lg:grid-cols-3">
          {/* Bilan mensuel */}
          <div>
            <div className="mb-3 inline-block rounded-[var(--radius-xs)] bg-[var(--navy)] px-4 py-1.5">
              <h3 className="text-xs font-semibold text-white">Bilan mensuel</h3>
            </div>
            <div className="text-sm leading-relaxed text-[var(--text)]" style={{ whiteSpace: "pre-line" }}>
              {dashboard.monthly_report || "Aucun bilan renseigne."}
            </div>
          </div>

          {/* Visites terrain */}
          <div className="flex flex-col items-center justify-center">
            <div className="mb-3 inline-block rounded-[var(--radius-xs)] bg-[var(--navy)] px-4 py-1.5">
              <h3 className="text-xs font-semibold text-white">Visites terrain</h3>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--yellow)]">
              <span className="text-2xl font-bold text-white">{dashboard.field_visits_count}</span>
            </div>
          </div>

          {/* Priorites d'action */}
          <div>
            <div className="mb-3 inline-block rounded-[var(--radius-xs)] bg-[var(--navy)] px-4 py-1.5">
              <h3 className="text-xs font-semibold text-white">Priorites d&apos;action pour {getNextMonthLabel(dashboard.month, dashboard.year)}</h3>
            </div>
            {dashboard.action_priorities.length > 0 ? (
              <ul className="space-y-1.5">
                {dashboard.action_priorities.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--navy)]" />
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Aucune priorite renseignee.</p>
            )}
          </div>
        </div>

        {/* Vigilance + Focus */}
        <div className="grid grid-cols-1 gap-6 border-t border-[var(--border-1)] px-8 py-6 lg:grid-cols-2">
          {/* Point de vigilance */}
          <div>
            <div className="mb-3 inline-block rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-1.5">
              <h3 className="text-xs font-semibold text-white">Point de vigilance/alerte</h3>
            </div>
            {dashboard.vigilance_points.length > 0 ? (
              <ul className="space-y-1.5">
                {dashboard.vigilance_points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--yellow)]" />
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Aucun point de vigilance.</p>
            )}
          </div>

          {/* Focus evenement */}
          <div>
            <div className="mb-3 inline-block rounded-[var(--radius-xs)] border-2 border-[var(--navy)] px-4 py-1.5">
              <h3 className="text-xs font-semibold text-[var(--navy)]">Focus evenement -- {dashboard.focus_event_title}</h3>
            </div>
            {dashboard.focus_event_content.length > 0 ? (
              <ul className="space-y-1.5">
                {dashboard.focus_event_content.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--navy)]" />
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Aucun evenement a signaler.</p>
            )}
          </div>
        </div>

        {/* Footer with page number */}
        <div className="flex items-center justify-end border-t border-[var(--border-1)] px-8 py-2">
          <span className="text-xs text-[var(--text-muted)]">1</span>
        </div>
      </div>

      {/* Delete confirmation */}
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
