import { jsPDF } from "jspdf";
import type { Rex } from "@/lib/types/database";
import { REX_BADGE_SVGS } from "@/components/icons/rex-section-icons";

// ==========================================
// COLORS
// ==========================================
const ORANGE = [243, 156, 18] as const;
const NAVY = [30, 58, 95] as const;
const YELLOW_ACCENT = [245, 158, 11] as const;
const GRAY_TEXT = [55, 55, 55] as const;

const RED_ACCENT = [220, 53, 69] as const;
const PURPLE_ACCENT = [142, 68, 173] as const;
const ORANGE_SEC = [255, 152, 0] as const;
const AMBER = [255, 193, 7] as const;

const SECTION_BORDER: Record<string, [number, number, number]> = {
  faits: [30, 58, 95],
  causes: [107, 142, 35],
  actions: [230, 126, 34],
  vigilance: [241, 196, 15],
};

const EVENT_TYPES: { value: string; label: string; color: readonly [number, number, number] }[] = [
  { value: "sd", label: "SD (Situation Dangereuse)", color: ORANGE_SEC },
  { value: "presquaccident", label: "PRESQU'ACCIDENT", color: AMBER },
  { value: "accident", label: "ACCIDENT", color: RED_ACCENT },
  { value: "hpe", label: "HPE (High Potential Events)", color: PURPLE_ACCENT },
];

/**
 * Sanitize text for Helvetica/WinAnsiEncoding.
 */
function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u2026/g, "...")
    .replace(/[\u00ab\u00bb]/g, '"')
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=");
}

/**
 * Render an inline SVG string to a PNG data URL via canvas.
 */
function svgStringToPng(svgString: string, scale = 3): Promise<string | null> {
  return new Promise((resolve) => {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); URL.revokeObjectURL(url); return; }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
      URL.revokeObjectURL(url);
    };

    img.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ==========================================
// MAIN EXPORT
// ==========================================

export async function exportRexPdf(rex: Rex, filename: string, logoUrl?: string | null) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const mx = 12; // margin X
  const cw = pageW - mx * 2; // content width
  let y = 12;

  // ------------------------------------------
  // Preload all images in parallel
  // ------------------------------------------
  const [
    badgeFaits, badgeCauses, badgeActions, badgeVigilance,
    photoFaits, photoCauses, photoActions, photoVigilance,
    logoData,
  ] = await Promise.all([
    svgStringToPng(REX_BADGE_SVGS.faits),
    svgStringToPng(REX_BADGE_SVGS.causes),
    svgStringToPng(REX_BADGE_SVGS.actions),
    svgStringToPng(REX_BADGE_SVGS.vigilance),
    rex.faits_photo_url ? fetchImageAsBase64(rex.faits_photo_url) : null,
    rex.causes_photo_url ? fetchImageAsBase64(rex.causes_photo_url) : null,
    rex.actions_photo_url ? fetchImageAsBase64(rex.actions_photo_url) : null,
    rex.vigilance_photo_url ? fetchImageAsBase64(rex.vigilance_photo_url) : null,
    logoUrl ? fetchImageAsBase64(logoUrl) : null,
  ]);

  const badges: Record<string, string | null> = {
    faits: badgeFaits, causes: badgeCauses, actions: badgeActions, vigilance: badgeVigilance,
  };

  // ==========================================
  // HEADER
  // ==========================================

  // Badge "FICHE REX n/year"
  const bw = 32, bh = 22;
  pdf.setFillColor(...ORANGE);
  pdf.roundedRect(mx, y, bw, bh, 3, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(255, 255, 255);
  pdf.text("FICHE REX", mx + bw / 2, y + 7, { align: "center" });
  pdf.setFontSize(14);
  pdf.text(`${rex.rex_number || "-"}/${rex.rex_year || "-"}`, mx + bw / 2, y + 17, { align: "center" });

  // Company logo
  const logoX = pageW - mx - 48;
  let logoOk = false;
  if (logoData) {
    try { pdf.addImage(logoData, "PNG", logoX, y, 45, 16); logoOk = true; } catch { /* fallback */ }
  }
  if (!logoOk) {
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
    pdf.rect(logoX, y + 14.5, 38, 0.5, "F");
  }

  // Title + metadata
  const ix = mx + bw + 6;
  const iw = logoX - ix - 4;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...ORANGE);
  pdf.text("TITRE DE L'EVENEMENT", ix, y + 5);
  pdf.setTextColor(...NAVY);
  const tw = pdf.getStringUnitWidth("TITRE DE L'EVENEMENT") * 9 / pdf.internal.scaleFactor;
  const tl = pdf.splitTextToSize(sanitize(` - ${rex.title}`), iw - tw);
  pdf.text(tl, ix + tw, y + 5);

  pdf.setFontSize(8);
  let my = y + 11;
  const meta = [
    { label: "Lieu", value: rex.lieu, lw: 8 },
    { label: "Date", value: rex.date_evenement ? new Date(rex.date_evenement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "", lw: 9 },
    { label: "Horaire", value: rex.horaire, lw: 14 },
  ];
  for (const m of meta) {
    if (!m.value) continue;
    pdf.setTextColor(66, 133, 244);
    pdf.setFont("helvetica", "bold");
    pdf.text(m.label, ix, my);
    pdf.setTextColor(...GRAY_TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.text(` : ${sanitize(m.value)}`, ix + m.lw, my);
    my += 4;
  }

  y += bh + 6;

  // Orange gradient separator
  const gradSteps = 20;
  const stepW = cw / gradSteps;
  for (let i = 0; i < gradSteps; i++) {
    const t = i / gradSteps;
    const r = Math.round(243 + (231 - 243) * t);
    const g = Math.round(156 + (76 - 156) * t);
    const b = Math.round(18 + (60 - 18) * t);
    pdf.setFillColor(r, g, b);
    pdf.rect(mx + i * stepW, y, stepW + 0.5, 1.5, "F");
  }
  y += 8;

  // ==========================================
  // SECTIONS
  // ==========================================

  const sections = [
    { key: "faits", text: rex.faits, photo: photoFaits },
    { key: "causes", text: rex.causes, photo: photoCauses },
    { key: "actions", text: rex.actions_engagees, photo: photoActions },
    { key: "vigilance", text: rex.vigilance, photo: photoVigilance },
  ] as const;

  for (const sec of sections) {
    if (!sec.text && !sec.photo) continue;

    // Page break check
    if (y > 225) { pdf.addPage(); y = 15; }

    // Badge image
    const badge = badges[sec.key];
    if (badge) {
      try {
        // Badge is wider than tall, scale appropriately
        const badgeH = 10;
        const badgeW = sec.key === "faits" ? 40 : sec.key === "causes" ? 48 : sec.key === "actions" ? 50 : 44;
        pdf.addImage(badge, "PNG", mx, y - 1, badgeW, badgeH);
      } catch {
        // Fallback: simple text header
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        const bc = SECTION_BORDER[sec.key];
        pdf.setTextColor(bc[0], bc[1], bc[2]);
        pdf.text(sec.key.toUpperCase(), mx, y + 5);
      }
    }

    y += 14;

    // Text content
    const textW = sec.photo ? cw * 0.65 : cw;
    const sanitizedText = sanitize(sec.text || "");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const lines = pdf.splitTextToSize(sanitizedText, textW - 12);
    const textH = Math.max(lines.length * 4.2 + 8, 18);

    // Background
    pdf.setFillColor(253, 251, 247);
    pdf.roundedRect(mx, y - 2, textW, textH, 1.5, 1.5, "F");

    // Left colored border
    const bc = SECTION_BORDER[sec.key];
    pdf.setFillColor(bc[0], bc[1], bc[2]);
    pdf.rect(mx, y - 2, 2.5, textH, "F");

    // Text
    pdf.setTextColor(...GRAY_TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(lines, mx + 8, y + 4);

    // Photo
    if (sec.photo) {
      const px = mx + textW + 4;
      const pw = cw - textW - 4;
      const ph = Math.max(textH, 30);
      try {
        pdf.addImage(sec.photo, "JPEG", px, y - 2, pw, ph);
      } catch {
        // skip
      }
    }

    y += textH + 8;
  }

  // ==========================================
  // FOOTER
  // ==========================================
  if (y > 230) { pdf.addPage(); y = 15; }

  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(mx, y, pageW - mx, y);
  y += 6;

  const halfW = cw / 2 - 2;
  const fy = y;

  // Left: Deja arrive
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(66, 133, 244);
  pdf.text("DEJA ARRIVE ?", mx, y);
  y += 5;

  if (rex.deja_arrive && rex.deja_arrive.length > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY_TEXT);
    for (const item of rex.deja_arrive) {
      pdf.setFillColor(...NAVY);
      pdf.circle(mx + 2, y - 0.5, 0.7, "F");
      const il = pdf.splitTextToSize(sanitize(item), halfW - 8);
      pdf.text(il, mx + 6, y);
      y += il.length * 3.5 + 1;
    }
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 160);
    pdf.text("Non renseigne", mx + 4, y);
  }

  // Right: Type d'evenement
  const rx = mx + halfW + 4;
  let ty = fy;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...ORANGE);
  pdf.text("TYPE D'EVENEMENT", rx, ty);
  ty += 5;

  for (const t of EVENT_TYPES) {
    const active = rex.type_evenement === t.value;
    if (active) {
      pdf.setFillColor(...t.color);
      pdf.roundedRect(rx, ty - 3, halfW, 5.5, 1, 1, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
    }
    pdf.text(sanitize(t.label), rx + 2, ty);
    ty += 6;
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
