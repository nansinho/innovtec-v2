import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SseDashboard } from "@/lib/types/database";

const MONTH_NAMES = [
  "Janvier", "F\u00e9vrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Ao\u00fbt", "Septembre", "Octobre", "Novembre", "D\u00e9cembre",
];

function formatFr(value: number): string {
  return value.toString().replace(".", ",");
}

/**
 * Sanitize text for jsPDF built-in fonts (Helvetica/WinAnsiEncoding).
 * Replace unsupported Unicode symbols with ASCII equivalents.
 * Note: basic Latin accents (é, è, ê, à, ç, etc.) ARE supported.
 */
function sanitize(text: string): string {
  return text
    .replace(/\u2264/g, "<=")  // ≤
    .replace(/\u2265/g, ">=")  // ≥
    .replace(/\u2019/g, "'")   // right single quotation mark
    .replace(/\u2018/g, "'")   // left single quotation mark
    .replace(/\u201c/g, '"')   // left double quotation mark
    .replace(/\u201d/g, '"')   // right double quotation mark
    .replace(/\u2013/g, "-")   // en dash
    .replace(/\u2014/g, "--")  // em dash
    .replace(/\u2026/g, "...") // ellipsis
    .replace(/\u00ab/g, '"')   // «
    .replace(/\u00bb/g, '"');  // »
}

/** Sanitize all strings in a table body row */
function sanitizeRow(row: string[]): string[] {
  return row.map(sanitize);
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
    headStyles: { fillColor: [...HEADER_BG], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, halign: "center", valign: "middle", cellPadding: 2.5 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, valign: "middle" },
    alternateRowStyles: { fillColor: [...ALT_ROW] },
    columnStyles: {
      0: { cellWidth: tableW * 0.6, halign: "left" },
      1: { cellWidth: tableW * 0.2, halign: "center", fontStyle: "bold" },
      2: { cellWidth: tableW * 0.2, halign: "center" },
    },
    head: [["Indicateur", "R\u00e9alis\u00e9", `Objectif ${d.year}`]],
    body: [
      sanitizeRow(["Nombre d'Accidents en Service Avec Arr\u00eats (ASAA)", String(d.accidents_with_leave), d.accidents_with_leave_objective]),
      sanitizeRow(["Suivi des formations r\u00e9glementaires", `${formatFr(d.regulatory_training_completion)}%`, d.regulatory_training_objective]),
      sanitizeRow(["Taux de conformit\u00e9 r\u00e9glementaire", `${formatFr(d.regulatory_compliance_rate)}%`, d.regulatory_compliance_objective]),
      sanitizeRow(["Taux de r\u00e9alisation de la v\u00e9rification p\u00e9riodique", `${formatFr(d.periodic_verification_rate)}%`, d.periodic_verification_objective]),
      sanitizeRow(["Suivi des d\u00e9chets", `${formatFr(d.waste_monitoring)}%`, d.waste_monitoring_objective]),
      sanitizeRow(["Taux de SST", `${formatFr(d.sst_rate)}%`, d.sst_rate_objective]),
      sanitizeRow(["Bennes d\u00e9class\u00e9es", String(d.downgraded_bins), String(d.downgraded_bins_objective)]),
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
    headStyles: { fillColor: [...HEADER_BG], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, halign: "center", valign: "middle", cellPadding: 2.5 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, valign: "middle" },
    alternateRowStyles: { fillColor: [...ALT_ROW] },
    columnStyles: {
      0: { cellWidth: tableW * 0.6, halign: "left" },
      1: { cellWidth: tableW * 0.2, halign: "center" },
      2: { cellWidth: tableW * 0.2, halign: "center", fontStyle: "bold" },
    },
    head: [["Indicateur", "Objectif", "R\u00e9alis\u00e9"]],
    body: [
      sanitizeRow(["Nombre d'accidents en service sans arr\u00eat (ASSA)", String(d.accidents_without_leave_objective), String(d.accidents_without_leave)]),
      sanitizeRow(["Nombre de visites crois\u00e9es", d.cross_visits_objective, String(d.cross_visits)]),
      sanitizeRow(["Nombre de visites manag\u00e9riales", String(d.managerial_visits_objective), String(d.managerial_visits)]),
      sanitizeRow(["% de d\u00e9clarants de SD (salari\u00e9s)", formatFr(d.sd_declarants_objective), `${formatFr(d.sd_declarants_percentage)}%`]),
      sanitizeRow(["Nombres de SD d\u00e9clar\u00e9s", String(d.sd_declared_objective), String(d.sd_declared_count)]),
      sanitizeRow(["Nombre de salari\u00e9s sensibilis\u00e9s au tri des d\u00e9chets", d.waste_awareness_objective, String(d.waste_awareness_employees)]),
      sanitizeRow(["Taux de suivi du plan de formation", d.training_plan_objective, `${formatFr(d.training_plan_follow_rate)}%`]),
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
  const reportText = sanitize(d.monthly_report || "Aucun bilan renseign\u00e9.");
  const reportLines = pdf.splitTextToSize(reportText, colW - 4);
  pdf.text(reportLines, marginX, y);
  const reportH = reportLines.length * 3.5;

  // Section: Visites terrain (centered in middle column)
  const midX = marginX + colW;
  const badgeText = "Visites terrain";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  const badgeW = pdf.getStringUnitWidth(badgeText) * 8 / pdf.internal.scaleFactor + 6;
  drawSectionBadge(pdf, midX + (colW - badgeW) / 2, y - 8, badgeText, NAVY);

  // Circle with number - properly centered
  const circleX = midX + colW / 2;
  const circleY = y + 10;
  const circleR = 10;
  pdf.setFillColor(...YELLOW);
  pdf.circle(circleX, circleY, circleR, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  // Vertical centering: offset ~35% of font size in mm (18pt ~ 6.35mm, 35% ~ 2.2mm)
  pdf.text(String(d.field_visits_count), circleX, circleY + 2.5, { align: "center" });

  // Section: Priorités d'action
  const nextMonth = d.month === 12 ? `Janvier ${d.year + 1}` : `${MONTH_NAMES[d.month]} ${d.year}`;
  const rightColX = marginX + colW * 2;
  drawSectionBadge(pdf, rightColX, y - 8, sanitize(`Priorit\u00e9s d'action pour ${nextMonth}`), NAVY);
  drawBulletList(pdf, rightColX, y, d.action_priorities, colW - 4, NAVY);
  const prioritiesH = d.action_priorities.length * 4.5;

  y += Math.max(reportH, 28, prioritiesH) + 8;

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
  const focusTitle = sanitize(`Focus \u00e9v\u00e9nement -- ${d.focus_event_title}`);
  drawSectionBadge(pdf, rightColX, y - 8, focusTitle, NAVY, true, colW - 4);
  drawBulletList(pdf, rightColX, y, d.focus_event_content, colW - 4, NAVY);

  y += Math.max(vigilanceH, d.focus_event_content.length * 4.5, 6) + 8;

  // ── Quote ──
  if (d.quote) {
    if (y > 185) { pdf.addPage(); y = 14; }
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(sanitize(`"${d.quote}"`), pageW / 2, y, { align: "center" });
  }

  // Use blob download with proper MIME type to avoid browser security warnings
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function drawSectionBadge(
  pdf: jsPDF,
  x: number,
  y: number,
  text: string,
  color: readonly [number, number, number],
  outlined = false,
  maxWidth?: number,
) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  let textW = pdf.getStringUnitWidth(text) * 8 / pdf.internal.scaleFactor + 6;

  // Clamp badge width to maxWidth if provided
  if (maxWidth && textW > maxWidth) {
    textW = maxWidth;
  }

  const badgeH = 6;
  const badgeY = y - badgeH / 2 - 0.5;

  if (outlined) {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, badgeY, textW, badgeH, 1, 1, "S");
    pdf.setTextColor(...color);
  } else {
    pdf.setFillColor(...color);
    pdf.roundedRect(x, badgeY, textW, badgeH, 1, 1, "F");
    pdf.setTextColor(255, 255, 255);
  }

  // Center text vertically inside the badge
  const textY = badgeY + badgeH / 2 + 1;

  // If text might be too wide for badge, truncate with ellipsis
  if (maxWidth) {
    const availableW = textW - 6;
    let displayText = text;
    while (pdf.getStringUnitWidth(displayText) * 8 / pdf.internal.scaleFactor > availableW && displayText.length > 3) {
      displayText = displayText.slice(0, -4) + "...";
    }
    pdf.text(displayText, x + 3, textY);
  } else {
    pdf.text(text, x + 3, textY);
  }
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
    pdf.text("Aucun \u00e9l\u00e9ment.", x, y);
    return;
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(60, 60, 60);
  let currentY = y;
  for (const item of items) {
    pdf.setFillColor(...color);
    pdf.circle(x + 1.5, currentY - 0.8, 0.8, "F");
    const lines = pdf.splitTextToSize(sanitize(item), maxW - 6);
    pdf.text(lines, x + 5, currentY);
    currentY += lines.length * 3.5 + 1;
  }
}
