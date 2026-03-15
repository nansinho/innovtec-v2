import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SseDashboard } from "@/lib/types/database";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatFr(value: number): string {
  return value.toString().replace(".", ",");
}

// Colors
const NAVY = [0, 32, 96] as const;
const YELLOW = [230, 160, 0] as const;
const HEADER_BG = [0, 32, 96] as const;
const ALT_ROW = [245, 247, 250] as const;

export function exportSsePdf(dashboard: SseDashboard, filename: string) {
  const d = dashboard;
  const monthLabel = MONTH_NAMES[d.month - 1];
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const marginX = 12;
  const contentW = pageW - marginX * 2;
  let y = 14;

  // ── Header ──
  pdf.setFillColor(...NAVY);
  pdf.rect(0, 0, pageW, 22, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`INNOVTEC - Tableau de Bord SSE - ${monthLabel} ${d.year}`, pageW / 2, y, { align: "center" });
  y = 28;

  // ── Two tables side by side ──
  const tableW = (contentW - 6) / 2;

  // Table 1: Indicateurs principaux
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...NAVY);
  pdf.text("Indicateurs", marginX, y);

  autoTable(pdf, {
    startY: y + 2,
    margin: { left: marginX, right: pageW - marginX - tableW },
    tableWidth: tableW,
    theme: "grid",
    headStyles: { fillColor: [...HEADER_BG], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [...ALT_ROW] },
    columnStyles: {
      0: { cellWidth: tableW * 0.6, halign: "left" },
      1: { cellWidth: tableW * 0.2, halign: "center", fontStyle: "bold" },
      2: { cellWidth: tableW * 0.2, halign: "center" },
    },
    head: [["Indicateur", "Réalisé", `Objectif ${d.year}`]],
    body: [
      ["Nombre d'Accidents en Service Avec Arrêts (ASAA)", String(d.accidents_with_leave), d.accidents_with_leave_objective],
      ["Suivi des formations réglementaires", `${formatFr(d.regulatory_training_completion)}%`, d.regulatory_training_objective],
      ["Taux de conformité réglementaire", `${formatFr(d.regulatory_compliance_rate)}%`, d.regulatory_compliance_objective],
      ["Taux de réalisation de la vérification périodique", `${formatFr(d.periodic_verification_rate)}%`, d.periodic_verification_objective],
      ["Suivi des déchets", `${formatFr(d.waste_monitoring)}%`, d.waste_monitoring_objective],
      ["Taux de SST", `${formatFr(d.sst_rate)}%`, d.sst_rate_objective],
      ["Bennes déclassées", String(d.downgraded_bins), String(d.downgraded_bins_objective)],
    ],
  });

  // Table 2: Indicateurs de suivi
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...NAVY);
  const rightX = marginX + tableW + 6;
  pdf.text("Indicateurs de suivi", rightX, y);

  autoTable(pdf, {
    startY: y + 2,
    margin: { left: rightX, right: marginX },
    tableWidth: tableW,
    theme: "grid",
    headStyles: { fillColor: [...HEADER_BG], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [...ALT_ROW] },
    columnStyles: {
      0: { cellWidth: tableW * 0.6, halign: "left" },
      1: { cellWidth: tableW * 0.2, halign: "center" },
      2: { cellWidth: tableW * 0.2, halign: "center", fontStyle: "bold" },
    },
    head: [["Indicateur", "Objectif", "Réalisé"]],
    body: [
      ["Nombre d'accidents en service sans arrêt (ASSA)", String(d.accidents_without_leave_objective), String(d.accidents_without_leave)],
      ["Nombre de visites croisées", d.cross_visits_objective, String(d.cross_visits)],
      ["Nombre de visites managériales", String(d.managerial_visits_objective), String(d.managerial_visits)],
      ["% de déclarants de SD (salariés)", formatFr(d.sd_declarants_objective), `${formatFr(d.sd_declarants_percentage)}%`],
      ["Nombres de SD déclarés", String(d.sd_declared_objective), String(d.sd_declared_count)],
      ["Nombre de salariés sensibilisés au tri des déchets", d.waste_awareness_objective, String(d.waste_awareness_employees)],
      ["Taux de suivi du plan de formation", d.training_plan_objective, `${formatFr(d.training_plan_follow_rate)}%`],
    ],
  });

  // Get Y position after the tallest table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (pdf as any).lastAutoTable?.finalY ?? y + 50;
  y += 8;

  // ── Bottom sections ──
  const colW = contentW / 3;

  // Section: Bilan mensuel
  drawSectionBadge(pdf, marginX, y, "Bilan mensuel", NAVY);
  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(60, 60, 60);
  const reportLines = pdf.splitTextToSize(d.monthly_report || "Aucun bilan renseigné.", colW - 4);
  pdf.text(reportLines, marginX, y);
  const reportH = reportLines.length * 3.5;

  // Section: Visites terrain (centered in middle column)
  const midX = marginX + colW;
  drawSectionBadge(pdf, midX + colW / 2 - 15, y - 8, "Visites terrain", NAVY);
  // Circle with number
  const circleX = midX + colW / 2;
  const circleY = y + 8;
  pdf.setFillColor(...YELLOW);
  pdf.circle(circleX, circleY, 8, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(String(d.field_visits_count), circleX, circleY + 1, { align: "center" });

  // Section: Priorités d'action
  const nextMonth = d.month === 12 ? `Janvier ${d.year + 1}` : `${MONTH_NAMES[d.month]} ${d.year}`;
  const rightColX = marginX + colW * 2;
  drawSectionBadge(pdf, rightColX, y - 8, `Priorités d'action pour ${nextMonth}`, NAVY);
  drawBulletList(pdf, rightColX, y, d.action_priorities, colW - 4, NAVY);
  const prioritiesH = d.action_priorities.length * 4.5;

  y += Math.max(reportH, 24, prioritiesH) + 8;

  // Check page break
  if (y > 170) {
    pdf.addPage();
    y = 14;
  }

  // ── Row 2: Vigilance + Focus ──
  // Vigilance (spans 2 columns)
  drawSectionBadge(pdf, marginX, y, "Point de vigilance/alerte", YELLOW);
  y += 8;
  drawBulletList(pdf, marginX, y, d.vigilance_points, colW * 2 - 4, YELLOW);
  const vigilanceH = Math.max(d.vigilance_points.length * 4.5, 6);

  // Focus événement (1 column, right)
  drawSectionBadge(pdf, rightColX, y - 8, `Focus événement -- ${d.focus_event_title}`, NAVY, true);
  drawBulletList(pdf, rightColX, y, d.focus_event_content, colW - 4, NAVY);

  y += Math.max(vigilanceH, d.focus_event_content.length * 4.5, 6) + 8;

  // ── Quote ──
  if (d.quote) {
    if (y > 185) { pdf.addPage(); y = 14; }
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`"${d.quote}"`, pageW / 2, y, { align: "center" });
  }

  pdf.save(filename);
}

function drawSectionBadge(
  pdf: jsPDF,
  x: number,
  y: number,
  text: string,
  color: readonly [number, number, number],
  outlined = false,
) {
  const textW = pdf.getStringUnitWidth(text) * 8 / pdf.internal.scaleFactor + 6;
  if (outlined) {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y - 3.5, textW, 5.5, 1, 1, "S");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...color);
  } else {
    pdf.setFillColor(...color);
    pdf.roundedRect(x, y - 3.5, textW, 5.5, 1, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
  }
  pdf.text(text, x + 3, y);
}

function drawBulletList(
  pdf: jsPDF,
  x: number,
  y: number,
  items: string[],
  maxW: number,
  color: readonly [number, number, number],
) {
  if (items.length === 0) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 160);
    pdf.text("Aucun élément.", x, y);
    return;
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(60, 60, 60);
  let currentY = y;
  for (const item of items) {
    pdf.setFillColor(...color);
    pdf.circle(x + 1.5, currentY - 0.8, 0.8, "F");
    const lines = pdf.splitTextToSize(item, maxW - 6);
    pdf.text(lines, x + 5, currentY);
    currentY += lines.length * 3.5 + 1;
  }
}
