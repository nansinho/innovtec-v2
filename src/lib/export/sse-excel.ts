import * as XLSX from "xlsx";
import type { SseDashboard } from "@/lib/types/database";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function exportSseExcel(dashboard: SseDashboard, filename: string) {
  const wb = XLSX.utils.book_new();
  const monthLabel = MONTH_NAMES[dashboard.month - 1];
  const title = `INNOVTEC - Tableau SSE - ${monthLabel} ${dashboard.year}`;

  // Sheet 1: Indicateurs principaux
  const sheet1Data = [
    [title],
    [],
    ["Indicateurs", "Réalisé", `Objectif ${dashboard.year}`],
    ["Nombre d'Accidents en Service Avec Arrêts (ASAA)", dashboard.accidents_with_leave, dashboard.accidents_with_leave_objective],
    ["Suivi des formations réglementaires", dashboard.regulatory_training_completion, dashboard.regulatory_training_objective],
    ["Taux de conformité réglementaire", dashboard.regulatory_compliance_rate, dashboard.regulatory_compliance_objective],
    ["Taux de réalisation de la vérification périodique", `${dashboard.periodic_verification_rate}%`, dashboard.periodic_verification_objective],
    ["Suivi des déchets", `${dashboard.waste_monitoring}%`, dashboard.waste_monitoring_objective],
    ["Taux de SST", `${dashboard.sst_rate}%`, dashboard.sst_rate_objective],
    ["Bennes déclassées", dashboard.downgraded_bins, dashboard.downgraded_bins_objective],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1["!cols"] = [{ wch: 55 }, { wch: 15 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Indicateurs principaux");

  // Sheet 2: Indicateurs de suivi
  const sheet2Data = [
    [title],
    [],
    ["Indicateurs de suivi", "Objectif", "Réalisé"],
    ["Nombre d'accidents en service sans arrêt (ASSA)", dashboard.accidents_without_leave_objective, dashboard.accidents_without_leave],
    ["Nombre de visites croisées", dashboard.cross_visits_objective, dashboard.cross_visits],
    ["Nombre de visites managériales", dashboard.managerial_visits_objective, dashboard.managerial_visits],
    ["% de déclarants de SD (salariés)", dashboard.sd_declarants_objective, dashboard.sd_declarants_percentage],
    ["Nombres de SD déclarés", dashboard.sd_declared_objective, dashboard.sd_declared_count],
    ["Nombre de salariés sensibilisés au tri des déchets", dashboard.waste_awareness_objective, dashboard.waste_awareness_employees],
    ["Taux de suivi du plan de formation", dashboard.training_plan_objective, `${dashboard.training_plan_follow_rate}%`],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2["!cols"] = [{ wch: 55 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Indicateurs de suivi");

  // Sheet 3: Bilan et sections
  const sheet3Data: (string | number)[][] = [
    [title],
    [],
    ["Visites terrain", dashboard.field_visits_count],
    [],
    ["Bilan mensuel"],
    [dashboard.monthly_report || ""],
    [],
    ["Priorités d'action"],
    ...dashboard.action_priorities.map((p) => [`- ${p}`]),
    [],
    ["Points de vigilance / alerte"],
    ...dashboard.vigilance_points.map((p) => [`- ${p}`]),
    [],
    [`Focus événement - ${dashboard.focus_event_title}`],
    ...dashboard.focus_event_content.map((p) => [`- ${p}`]),
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3["!cols"] = [{ wch: 80 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Bilan mensuel");

  XLSX.writeFile(wb, filename);
}
