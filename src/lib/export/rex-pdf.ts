import { jsPDF } from "jspdf";
import type { Rex } from "@/lib/types/database";

// ==========================================
// COLORS (matching the REX fiche design)
// ==========================================
const ORANGE = [243, 156, 18] as const;
const NAVY = [30, 58, 95] as const;
const YELLOW_ACCENT = [245, 158, 11] as const;
const GRAY_TEXT = [60, 60, 60] as const;

const RED_ACCENT = [220, 53, 69] as const;
const PURPLE_ACCENT = [142, 68, 173] as const;
const ORANGE_SEC = [255, 152, 0] as const;
const AMBER = [255, 193, 7] as const;

// Section badge config: circle color, badge label color, label text, text color
const SECTION_CONFIG = {
  faits: {
    circleOuter: [212, 201, 168] as const, // #D4C9A8 beige
    circleInner: [197, 184, 154] as const, // #C5B89A
    badgeColor: [30, 58, 95] as const,     // #1E3A5F navy
    label: "LES FAITS",
    textColor: [255, 255, 255] as const,
    borderColor: [30, 58, 95] as const,
  },
  causes: {
    circleOuter: [212, 201, 168] as const,
    circleInner: [197, 184, 154] as const,
    badgeColor: [107, 142, 35] as const,   // #6B8E23 olive green
    label: "LES CAUSES ET LES CIRCONSTANCES",
    textColor: [255, 255, 255] as const,
    borderColor: [107, 142, 35] as const,
  },
  actions: {
    circleOuter: [46, 125, 50] as const,   // #2E7D32 dark green
    circleInner: [56, 142, 60] as const,   // #388E3C
    badgeColor: [230, 126, 34] as const,   // #E67E22 orange
    label: "LA SYNTHESE DES ACTIONS ENGAGEES",
    textColor: [255, 255, 255] as const,
    borderColor: [230, 126, 34] as const,
  },
  vigilance: {
    circleOuter: [46, 125, 50] as const,
    circleInner: [56, 142, 60] as const,
    badgeColor: [241, 196, 15] as const,   // #F1C40F yellow
    label: "LE RAPPEL A VIGILANCE",
    textColor: [51, 51, 51] as const,      // dark text on yellow
    borderColor: [241, 196, 15] as const,
  },
} as const;

const EVENT_TYPES: { value: string; label: string; color: readonly [number, number, number] }[] = [
  { value: "sd", label: "SD (Situation Dangereuse)", color: ORANGE_SEC },
  { value: "presquaccident", label: "PRESQU'ACCIDENT", color: AMBER },
  { value: "accident", label: "ACCIDENT", color: RED_ACCENT },
  { value: "hpe", label: "HPE (High Potential Events)", color: PURPLE_ACCENT },
];

/**
 * Sanitize text for jsPDF built-in fonts (Helvetica/WinAnsiEncoding).
 */
function sanitize(text: string): string {
  return text
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u2026/g, "...")
    .replace(/\u00ab/g, '"')
    .replace(/\u00bb/g, '"')
    .replace(/\u00c8/g, "E")
    .replace(/\u00c9/g, "E")
    .replace(/\u00c0/g, "A")
    .replace(/\u00e8/g, "e")
    .replace(/\u00e9/g, "e")
    .replace(/\u00ea/g, "e")
    .replace(/\u00e0/g, "a");
}

/**
 * Draw a section badge: colored circle + colored label rectangle
 */
function drawSectionBadge(
  pdf: jsPDF,
  x: number,
  y: number,
  type: keyof typeof SECTION_CONFIG
) {
  const cfg = SECTION_CONFIG[type];
  const circleOuter: [number, number, number] = [...cfg.circleOuter];
  const circleInner: [number, number, number] = [...cfg.circleInner];
  const badgeColor: [number, number, number] = [...cfg.badgeColor];
  const textColor: [number, number, number] = [...cfg.textColor];
  const r = 7;
  const cx = x + r;
  const cy = y + r;

  // Outer circle
  pdf.setFillColor(...circleOuter);
  pdf.circle(cx, cy, r, "F");

  // Inner circle
  pdf.setFillColor(...circleInner);
  pdf.circle(cx, cy, r - 1.5, "F");

  // Symbol inside circle (simple ASCII characters only)
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);

  switch (type) {
    case "faits":
      // Two person silhouettes → simplified as group icon
      pdf.setFillColor(...badgeColor);
      // Draw two simple person shapes
      pdf.circle(cx - 2, cy - 2, 1.3, "F");
      pdf.circle(cx + 2, cy - 2, 1.3, "F");
      pdf.roundedRect(cx - 4, cy, 4, 3, 0.5, 0.5, "F");
      pdf.roundedRect(cx, cy, 4, 3, 0.5, 0.5, "F");
      break;
    case "causes":
      // Two red question marks
      pdf.setTextColor(139, 26, 26); // #8B1A1A
      pdf.setFontSize(11);
      pdf.text("??", cx, cy + 1.5, { align: "center" });
      break;
    case "actions":
      // Document icon (white)
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.5);
      pdf.rect(cx - 3, cy - 4, 6, 8);
      pdf.line(cx - 1.5, cy - 2, cx + 1.5, cy - 2);
      pdf.line(cx - 1.5, cy, cx + 1.5, cy);
      pdf.line(cx - 1.5, cy + 2, cx + 0.5, cy + 2);
      break;
    case "vigilance":
      // Warning triangle
      pdf.setFillColor(255, 152, 0); // orange
      const triH = 8;
      const triW = 9;
      pdf.triangle(
        cx, cy - triH / 2 + 1,
        cx - triW / 2, cy + triH / 2 - 1,
        cx + triW / 2, cy + triH / 2 - 1,
        "F"
      );
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text("!", cx, cy + 2.5, { align: "center" });
      break;
  }

  // Label badge rectangle (to the right of the circle, slightly overlapping)
  const labelX = x + r * 2 - 2;
  const labelFontSize = cfg.label.length > 20 ? 6 : 8;
  pdf.setFontSize(labelFontSize);
  const labelW = pdf.getStringUnitWidth(sanitize(cfg.label)) * labelFontSize / pdf.internal.scaleFactor + 8;
  const labelH = cfg.label.length > 20 ? 10 : 7;
  const labelY = y + r - labelH / 2;

  pdf.setFillColor(...badgeColor);
  pdf.roundedRect(labelX, labelY, labelW, labelH, 1.5, 1.5, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(labelFontSize);
  pdf.setTextColor(...textColor);
  pdf.text(sanitize(cfg.label), labelX + 4, labelY + labelH / 2 + labelFontSize / 6);

  return labelX + labelW;
}

function drawSection(
  pdf: jsPDF,
  y: number,
  text: string,
  type: keyof typeof SECTION_CONFIG,
  photoData?: string | null,
  pageW = 210,
  marginX = 12
): number {
  if (!text && !photoData) return y;

  const contentW = pageW - marginX * 2;
  const cfg = SECTION_CONFIG[type];
  const borderColor: [number, number, number] = [...cfg.borderColor];

  // Check page break
  if (y > 230) {
    pdf.addPage();
    y = 15;
  }

  // Section header badge (circle + label)
  drawSectionBadge(pdf, marginX, y - 2, type);

  y += 18;

  // Content area
  const textW = photoData ? contentW * 0.65 : contentW;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...GRAY_TEXT);

  const sanitizedText = sanitize(text || "");
  const lines = pdf.splitTextToSize(sanitizedText, textW - 10);
  const textH = Math.max(lines.length * 4 + 8, 16);

  // Background fill (subtle warm gray)
  pdf.setFillColor(252, 250, 245);
  pdf.roundedRect(marginX, y - 2, textW, textH, 1.5, 1.5, "F");

  // Left colored border (thick, 2.5mm)
  pdf.setFillColor(...borderColor);
  pdf.rect(marginX, y - 2, 2.5, textH, "F");

  // Draw text
  pdf.setTextColor(...GRAY_TEXT);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(lines, marginX + 7, y + 4);

  // Photo (right 1/3)
  if (photoData) {
    const photoX = marginX + textW + 4;
    const photoW = contentW - textW - 4;
    const photoH = Math.max(textH, 35);

    try {
      pdf.addImage(photoData, "JPEG", photoX, y - 2, photoW, photoH);
    } catch {
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(photoX, y - 2, photoW, photoH, 2, 2, "F");
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      pdf.setTextColor(180, 180, 180);
      pdf.text("Photo", photoX + photoW / 2, y + photoH / 2, { align: "center" });
    }
  }

  return y + textH + 8;
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();
    return await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportRexPdf(rex: Rex, filename: string, logoUrl?: string | null) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const marginX = 12;
  const contentW = pageW - marginX * 2;
  let y = 12;

  // ==========================================
  // HEADER
  // ==========================================

  // Badge "FICHE REX n/year" — orange rounded rectangle
  const badgeW = 32;
  const badgeH = 22;
  pdf.setFillColor(...ORANGE);
  pdf.roundedRect(marginX, y, badgeW, badgeH, 3, 3, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(255, 255, 255);
  pdf.text("FICHE REX", marginX + badgeW / 2, y + 7, { align: "center" });
  pdf.setFontSize(14);
  pdf.text(
    `${rex.rex_number || "-"}/${rex.rex_year || "-"}`,
    marginX + badgeW / 2,
    y + 17,
    { align: "center" }
  );

  // Logo (real company logo or text fallback)
  const logoX = pageW - marginX - 50;
  let logoData: string | null = null;
  if (logoUrl) {
    logoData = await fetchImageAsBase64(logoUrl);
  }

  if (logoData) {
    try {
      pdf.addImage(logoData, "PNG", logoX, y, 45, 16);
    } catch {
      logoData = null;
    }
  }

  if (!logoData) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...NAVY);
    pdf.text("I", logoX, y + 8);
    pdf.setTextColor(...YELLOW_ACCENT);
    pdf.text("NN", logoX + 5, y + 8);
    pdf.setTextColor(...NAVY);
    pdf.text("OVTEC", logoX + 16, y + 8);
    pdf.setFontSize(6);
    pdf.text("RESEAUX", logoX + 12, y + 13, { align: "center" });
    pdf.setFillColor(...YELLOW_ACCENT);
    pdf.rect(logoX, y + 14, 38, 0.5, "F");
  }

  // Title and metadata
  const infoX = marginX + badgeW + 6;
  const infoW = logoX - infoX - 4;

  // Title line
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...ORANGE);
  const titleLabel = "TITRE DE L'EVENEMENT";
  pdf.text(titleLabel, infoX, y + 5);

  const titleLabelW = pdf.getStringUnitWidth(titleLabel) * 9 / pdf.internal.scaleFactor;
  pdf.setTextColor(...NAVY);
  pdf.setFont("helvetica", "bold");
  const titleText = sanitize(` - ${rex.title}`);
  const titleLines = pdf.splitTextToSize(titleText, infoW - titleLabelW);
  pdf.text(titleLines, infoX + titleLabelW, y + 5);

  // Metadata
  pdf.setFontSize(8);
  let metaY = y + 11;
  if (rex.lieu) {
    pdf.setTextColor(66, 133, 244);
    pdf.setFont("helvetica", "bold");
    pdf.text("Lieu", infoX, metaY);
    pdf.setTextColor(...GRAY_TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.text(` : ${sanitize(rex.lieu)}`, infoX + 8, metaY);
    metaY += 4;
  }
  if (rex.date_evenement) {
    const dateStr = new Date(rex.date_evenement).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    pdf.setTextColor(66, 133, 244);
    pdf.setFont("helvetica", "bold");
    pdf.text("Date", infoX, metaY);
    pdf.setTextColor(...GRAY_TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.text(` : ${dateStr}`, infoX + 9, metaY);
    metaY += 4;
  }
  if (rex.horaire) {
    pdf.setTextColor(66, 133, 244);
    pdf.setFont("helvetica", "bold");
    pdf.text("Horaire", infoX, metaY);
    pdf.setTextColor(...GRAY_TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.text(` : ${sanitize(rex.horaire)}`, infoX + 14, metaY);
  }

  y += badgeH + 6;

  // Orange separator line (gradient effect: two rects)
  pdf.setFillColor(243, 156, 18);
  pdf.rect(marginX, y, contentW * 0.5, 1.5, "F");
  pdf.setFillColor(231, 76, 60);
  pdf.rect(marginX + contentW * 0.5, y, contentW * 0.5, 1.5, "F");
  y += 8;

  // ==========================================
  // SECTIONS
  // ==========================================

  // Preload photos
  const photoDataMap: Record<string, string | null> = {};
  const photoFields = [
    { key: "faits_photo_url", value: rex.faits_photo_url },
    { key: "causes_photo_url", value: rex.causes_photo_url },
    { key: "actions_photo_url", value: rex.actions_photo_url },
    { key: "vigilance_photo_url", value: rex.vigilance_photo_url },
  ];

  await Promise.all(
    photoFields.map(async ({ key, value }) => {
      if (value) {
        photoDataMap[key] = await fetchImageAsBase64(value);
      }
    })
  );

  // Section 1: Les Faits
  y = drawSection(pdf, y, rex.faits, "faits", photoDataMap.faits_photo_url, pageW, marginX);

  // Section 2: Les Causes
  y = drawSection(pdf, y, rex.causes, "causes", photoDataMap.causes_photo_url, pageW, marginX);

  // Section 3: Les Actions
  y = drawSection(pdf, y, rex.actions_engagees, "actions", photoDataMap.actions_photo_url, pageW, marginX);

  // Section 4: La Vigilance
  y = drawSection(pdf, y, rex.vigilance, "vigilance", photoDataMap.vigilance_photo_url, pageW, marginX);

  // ==========================================
  // FOOTER
  // ==========================================

  if (y > 235) {
    pdf.addPage();
    y = 15;
  }

  // Separator
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(marginX, y, pageW - marginX, y);
  y += 6;

  const halfW = contentW / 2 - 2;
  const footerStartY = y;

  // Left: Deja arrive ?
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(66, 133, 244);
  pdf.text("DEJA ARRIVE ?", marginX, y);
  y += 5;

  if (rex.deja_arrive && rex.deja_arrive.length > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY_TEXT);
    for (const item of rex.deja_arrive) {
      pdf.setFillColor(...NAVY);
      pdf.circle(marginX + 2, y - 0.5, 0.7, "F");
      const itemLines = pdf.splitTextToSize(sanitize(item), halfW - 8);
      pdf.text(itemLines, marginX + 6, y);
      y += itemLines.length * 3.5 + 1;
    }
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 160);
    pdf.text("Non renseigne", marginX + 4, y);
  }

  // Right: Type d'evenement
  const rightX = marginX + halfW + 4;
  let typeY = footerStartY;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...ORANGE);
  pdf.text("TYPE D'EVENEMENT", rightX, typeY);
  typeY += 5;

  for (const t of EVENT_TYPES) {
    const isActive = rex.type_evenement === t.value;

    if (isActive) {
      pdf.setFillColor(...t.color);
      pdf.roundedRect(rightX, typeY - 3, halfW, 5.5, 1, 1, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
    }

    pdf.text(sanitize(t.label), rightX + 2, typeY);
    typeY += 6;
  }

  // ==========================================
  // DOWNLOAD
  // ==========================================
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
