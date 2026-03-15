import { jsPDF } from "jspdf";
import type { Rex } from "@/lib/types/database";

// Colors matching the REX fiche design
const ORANGE = [243, 156, 18] as const;    // Header orange
const NAVY = [30, 58, 95] as const;        // INNOVTEC navy
const YELLOW_ACCENT = [245, 158, 11] as const; // INNOVTEC yellow
const GREEN = [76, 175, 80] as const;      // Les Faits
const ORANGE_SEC = [255, 152, 0] as const; // Les Causes
const TEAL = [0, 137, 123] as const;       // Les Actions
const AMBER = [255, 193, 7] as const;      // La Vigilance
const GRAY_TEXT = [60, 60, 60] as const;
const LIGHT_GRAY = [245, 245, 245] as const;

const RED_ACCENT = [220, 53, 69] as const;
const PURPLE_ACCENT = [142, 68, 173] as const;

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
    .replace(/\u00bb/g, '"');
}

function drawSectionIcon(
  pdf: jsPDF,
  x: number,
  y: number,
  color: readonly [number, number, number],
  type: "faits" | "causes" | "actions" | "vigilance"
) {
  const r = 7;
  const cx = x + r;
  const cy = y + r;

  // Circle
  pdf.setFillColor(...color);
  pdf.circle(cx, cy, r, "F");

  // Symbol inside
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);

  switch (type) {
    case "faits":
      // Document icon (simplified as text)
      pdf.setFontSize(10);
      pdf.text("\u2261", cx, cy + 1.2, { align: "center" }); // ≡ hamburger
      break;
    case "causes":
      pdf.setFontSize(12);
      pdf.text("?", cx, cy + 1.5, { align: "center" });
      break;
    case "actions":
      pdf.setFontSize(10);
      pdf.text("\u2713", cx, cy + 1.2, { align: "center" }); // ✓
      break;
    case "vigilance":
      pdf.setFontSize(11);
      pdf.text("!", cx, cy + 1.5, { align: "center" });
      break;
  }
}

function drawSection(
  pdf: jsPDF,
  y: number,
  label: string,
  text: string,
  color: readonly [number, number, number],
  iconType: "faits" | "causes" | "actions" | "vigilance",
  photoData?: string | null,
  pageW = 210,
  marginX = 12
): number {
  if (!text && !photoData) return y;

  const contentW = pageW - marginX * 2;

  // Check page break
  if (y > 240) {
    pdf.addPage();
    y = 15;
  }

  // Section header: icon + label
  drawSectionIcon(pdf, marginX, y - 2, color, iconType);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...color);
  pdf.text(sanitize(label), marginX + 17, y + 5);

  y += 16;

  // Content area
  const textW = photoData ? contentW * 0.65 : contentW;

  // Left border colored line
  pdf.setDrawColor(...color);
  pdf.setLineWidth(1);

  // Text content box
  pdf.setFillColor(...LIGHT_GRAY);
  pdf.roundedRect(marginX, y - 2, textW, 4, 1, 1, "F"); // minimal bg, will expand

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...GRAY_TEXT);

  const sanitizedText = sanitize(text || "");
  const lines = pdf.splitTextToSize(sanitizedText, textW - 10);
  const textH = lines.length * 4 + 6;

  // Draw background rect
  pdf.setFillColor(250, 250, 250);
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(marginX, y - 2, textW, textH, 1.5, 1.5, "FD");

  // Draw left color border (thick)
  pdf.setFillColor(...color);
  pdf.rect(marginX, y - 2, 2, textH, "F");

  // Draw text
  pdf.setTextColor(...GRAY_TEXT);
  pdf.text(lines, marginX + 6, y + 4);

  // Photo placeholder (right 1/3)
  if (photoData) {
    const photoX = marginX + textW + 4;
    const photoW = contentW - textW - 4;
    const photoH = Math.max(textH, 35);

    pdf.setFillColor(240, 240, 240);
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(photoX, y - 2, photoW, photoH, 2, 2, "FD");

    // Try to load the image
    try {
      pdf.addImage(photoData, "JPEG", photoX + 1, y - 1, photoW - 2, photoH - 2);
    } catch {
      // If image fails, show placeholder
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      pdf.setTextColor(160, 160, 160);
      pdf.text("Photo", photoX + photoW / 2, y + photoH / 2, { align: "center" });
    }
  }

  return y + textH + 6;
}

export async function exportRexPdf(rex: Rex, filename: string) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const marginX = 12;
  const contentW = pageW - marginX * 2;
  let y = 12;

  // ==========================================
  // HEADER
  // ==========================================

  // Badge "FICHE REX n/year"
  const badgeW = 32;
  const badgeH = 22;
  pdf.setFillColor(...ORANGE);
  pdf.roundedRect(marginX, y, badgeW, badgeH, 2, 2, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text("FICHE REX", marginX + badgeW / 2, y + 8, { align: "center" });
  pdf.setFontSize(12);
  pdf.text(
    `${rex.rex_number || "—"}/${rex.rex_year || "—"}`,
    marginX + badgeW / 2,
    y + 17,
    { align: "center" }
  );

  // Logo INNOVTEC (text-based in PDF)
  const logoX = pageW - marginX - 50;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...NAVY);

  // Draw "INN" with yellow NN
  pdf.text("I", logoX, y + 8);
  pdf.setTextColor(...YELLOW_ACCENT);
  pdf.text("NN", logoX + 5, y + 8);
  pdf.setTextColor(...NAVY);
  pdf.text("OVTEC", logoX + 16, y + 8);

  // Subtitle
  pdf.setFontSize(6);
  pdf.setTextColor(...NAVY);
  pdf.text("RESEAUX", logoX + 12, y + 13, { align: "center" });

  // Yellow accent line under logo
  pdf.setFillColor(...YELLOW_ACCENT);
  pdf.rect(logoX, y + 14, 38, 0.5, "F");

  // Title and metadata
  const infoX = marginX + badgeW + 6;
  const infoW = logoX - infoX - 4;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...ORANGE);
  pdf.text("TITRE DE L'\u00c9V\u00c9NEMENT", infoX, y + 5);
  pdf.setTextColor(...NAVY);
  const titleLines = pdf.splitTextToSize(sanitize(` - ${rex.title}`), infoW);
  pdf.text(titleLines, infoX + pdf.getStringUnitWidth("TITRE DE L'\u00c9V\u00c9NEMENT") * 9 / pdf.internal.scaleFactor, y + 5);

  // Metadata lines
  pdf.setFontSize(8);
  let metaY = y + 10;
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

  // Orange separator line
  pdf.setFillColor(...ORANGE);
  pdf.rect(marginX, y, contentW, 1.2, "F");
  y += 8;

  // ==========================================
  // SECTIONS
  // ==========================================

  // Preload photos if they exist (fetch as base64 for embedding)
  const photoDataMap: Record<string, string | null> = {};
  const photoFields = [
    { key: "faits_photo_url", value: rex.faits_photo_url },
    { key: "causes_photo_url", value: rex.causes_photo_url },
    { key: "actions_photo_url", value: rex.actions_photo_url },
    { key: "vigilance_photo_url", value: rex.vigilance_photo_url },
  ];

  for (const { key, value } of photoFields) {
    if (value) {
      try {
        const response = await fetch(value);
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        photoDataMap[key] = dataUrl;
      } catch {
        photoDataMap[key] = null;
      }
    }
  }

  // Section 1: Les Faits
  y = drawSection(
    pdf, y, "LES FAITS", rex.faits, GREEN, "faits",
    photoDataMap.faits_photo_url, pageW, marginX
  );

  // Section 2: Les Causes
  y = drawSection(
    pdf, y, "LES CAUSES ET LES CIRCONSTANCES", rex.causes, ORANGE_SEC, "causes",
    photoDataMap.causes_photo_url, pageW, marginX
  );

  // Section 3: Les Actions
  y = drawSection(
    pdf, y, "LA SYNTH\u00c8SE DES ACTIONS ENGAG\u00c9ES", rex.actions_engagees, TEAL, "actions",
    photoDataMap.actions_photo_url, pageW, marginX
  );

  // Section 4: La Vigilance
  y = drawSection(
    pdf, y, "LE RAPPEL \u00c0 VIGILANCE", rex.vigilance, AMBER, "vigilance",
    photoDataMap.vigilance_photo_url, pageW, marginX
  );

  // ==========================================
  // FOOTER
  // ==========================================

  // Check page break
  if (y > 240) {
    pdf.addPage();
    y = 15;
  }

  // Separator
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(marginX, y, pageW - marginX, y);
  y += 6;

  const halfW = contentW / 2 - 2;

  // Left: Déjà arrivé ?
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(66, 133, 244);
  pdf.text("D\u00c9J\u00c0 ARRIV\u00c9 ?", marginX, y);
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
    pdf.text("Non...", marginX + 4, y);
  }

  // Right: Type d'événement
  const rightX = marginX + halfW + 4;
  const footerTopY = y - (rex.deja_arrive?.length || 1) * 4 - 5;
  let typeY = footerTopY;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...ORANGE);
  pdf.text("TYPE D'\u00c9V\u00c9NEMENT", rightX, typeY);
  typeY += 5;

  for (const t of EVENT_TYPES) {
    const isActive = rex.type_evenement === t.value;

    if (isActive) {
      // Highlighted background
      pdf.setFillColor(...t.color);
      pdf.roundedRect(rightX, typeY - 3, halfW, 5.5, 1, 1, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...GRAY_TEXT);
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
