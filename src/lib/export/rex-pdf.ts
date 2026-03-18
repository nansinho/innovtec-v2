import { jsPDF } from "jspdf";
import type { Rex } from "@/lib/types/database";
import { REX_BADGE_SVGS } from "@/components/icons/rex-section-icons";

// ==========================================
// COLORS — Navy + Yellow (#F59E0B) theme
// ==========================================
const YELLOW: [number, number, number] = [245, 158, 11];  // #F59E0B
const NAVY: [number, number, number] = [11, 54, 85];      // #0B3655
const GRAY_TEXT: [number, number, number] = [55, 55, 55];
const GOLD_BORDER: [number, number, number] = [200, 168, 78]; // #C8A84E

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "sd", label: "SD (Situation Dangereuse)" },
  { value: "presquaccident", label: "PRESQU'ACCIDENT" },
  { value: "accident", label: "ACCIDENT" },
  { value: "hpe", label: "HPE (High Potential Events)" },
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

/**
 * Load an image URL to base64 via Image element (works with CORS).
 */
function imageUrlToBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        fetchImageAsBase64(url).then(resolve);
      }
    };
    img.onerror = () => {
      fetchImageAsBase64(url).then(resolve);
    };
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
  const pageH = 297;
  const mx = 10; // margin X
  const cw = pageW - mx * 2; // content width
  let y = 10;

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
    rex.faits_photo_url ? imageUrlToBase64(rex.faits_photo_url) : null,
    rex.causes_photo_url ? imageUrlToBase64(rex.causes_photo_url) : null,
    rex.actions_photo_url ? imageUrlToBase64(rex.actions_photo_url) : null,
    rex.vigilance_photo_url ? imageUrlToBase64(rex.vigilance_photo_url) : null,
    logoUrl ? imageUrlToBase64(logoUrl) : null,
  ]);

  const badges: Record<string, string | null> = {
    faits: badgeFaits, causes: badgeCauses, actions: badgeActions, vigilance: badgeVigilance,
  };

  // Count sections with content to calculate available space
  const sections = [
    { key: "faits", text: rex.faits, photo: photoFaits },
    { key: "causes", text: rex.causes, photo: photoCauses },
    { key: "actions", text: rex.actions_engagees, photo: photoActions },
    { key: "vigilance", text: rex.vigilance, photo: photoVigilance },
  ] as const;

  const activeSections = sections.filter(s => s.text || s.photo);

  // ==========================================
  // HEADER — compact
  // ==========================================

  // Badge "FICHE REX n/year" — yellow rounded rectangle
  const bw = 28, bh = 18;
  pdf.setFillColor(...YELLOW);
  pdf.roundedRect(mx, y, bw, bh, 2.5, 2.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(255, 255, 255);
  pdf.text("FICHE REX", mx + bw / 2, y + 6, { align: "center" });
  pdf.setFontSize(14);
  pdf.text(`${rex.rex_number || "-"}/${rex.rex_year || "-"}`, mx + bw / 2, y + 15, { align: "center" });

  // Company logo (top right)
  const logoX = pageW - mx - 42;
  let logoOk = false;
  if (logoData) {
    try { pdf.addImage(logoData, "PNG", logoX, y, 40, 14); logoOk = true; } catch { /* fallback */ }
  }
  if (!logoOk) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(30, 58, 95);
    pdf.text("INN", logoX, y + 9);
    pdf.setTextColor(245, 158, 11);
    pdf.text("O", logoX + 14, y + 9);
    pdf.setTextColor(30, 58, 95);
    pdf.text("VTEC", logoX + 18, y + 9);
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text("R\u00c9SEAUX", logoX + 9, y + 13);
    pdf.setFillColor(245, 158, 11);
    pdf.rect(logoX, y + 14, 34, 0.4, "F");
  }

  // Title + metadata
  const ix = mx + bw + 4;
  const iw = logoX - ix - 4;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...YELLOW);
  const titleLabel = "TITRE DE L'\u00c9V\u00c9NEMENT";
  pdf.text(titleLabel, ix, y + 5);
  const tlW = pdf.getStringUnitWidth(titleLabel) * 10 / pdf.internal.scaleFactor;

  pdf.setTextColor(...NAVY);
  pdf.setFontSize(10);
  const titleText = sanitize(` -- ${rex.title}`);
  const titleLines = pdf.splitTextToSize(titleText, iw - tlW);
  pdf.text(titleLines, ix + tlW, y + 5);

  // Metadata — yellow labels
  pdf.setFontSize(8);
  let metaY = y + 10 + (titleLines.length > 1 ? (titleLines.length - 1) * 3.5 : 0);
  const metaItems = [
    { label: "Lieu", value: rex.lieu, lw: 8 },
    {
      label: "Date",
      value: rex.date_evenement
        ? new Date(rex.date_evenement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "",
      lw: 9,
    },
    { label: "Horaire", value: rex.horaire, lw: 14 },
  ];
  for (const m of metaItems) {
    if (!m.value) continue;
    pdf.setTextColor(...YELLOW);
    pdf.setFont("helvetica", "bold");
    pdf.text(m.label, ix, metaY);
    pdf.setTextColor(...GRAY_TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.text(` : ${sanitize(m.value)}`, ix + m.lw, metaY);
    metaY += 3.5;
  }

  y += bh + 4;

  // Yellow-to-navy gradient separator
  const gradSteps = 20;
  const stepW = cw / gradSteps;
  for (let i = 0; i < gradSteps; i++) {
    const t = i / gradSteps;
    const r = Math.round(245 + (11 - 245) * t);
    const g = Math.round(158 + (54 - 158) * t);
    const b = Math.round(11 + (85 - 11) * t);
    pdf.setFillColor(r, g, b);
    pdf.rect(mx + i * stepW, y, stepW + 0.5, 1.2, "F");
  }
  y += 4;

  // ==========================================
  // SECTIONS — dynamically sized to fit 1 page
  // ==========================================

  // Reserve space for footer
  const footerH = 30;
  const availableH = pageH - y - footerH - 5;
  // Distribute space equally among active sections
  const maxSectionH = activeSections.length > 0 ? availableH / activeSections.length : availableH;

  for (const sec of sections) {
    if (!sec.text && !sec.photo) continue;

    // Badge image
    const badge = badges[sec.key];
    if (badge) {
      try {
        const badgeH = 8;
        const badgeW = sec.key === "faits" ? 36 : sec.key === "causes" ? 42 : sec.key === "actions" ? 44 : 38;
        pdf.addImage(badge, "PNG", mx, y - 1, badgeW, badgeH);
      } catch {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...NAVY);
        pdf.text(sec.key.toUpperCase(), mx, y + 4);
      }
    }

    y += 10;

    // Text content box
    const hasPhoto = !!sec.photo;
    const textW = hasPhoto ? cw * 0.58 : cw;
    const sanitizedText = sanitize(sec.text || "");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(sanitizedText, textW - 8);

    // Limit text height to fit in available space
    const maxTextLines = Math.floor((maxSectionH - 14) / 3.5);
    const displayLines = lines.slice(0, Math.max(maxTextLines, 3));
    const textH = Math.max(displayLines.length * 3.5 + 6, 14);

    // White bg + border
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(mx, y - 1, textW, textH, 1.5, 1.5, "F");
    pdf.setDrawColor(...GOLD_BORDER);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(mx, y - 1, textW, textH, 1.5, 1.5, "S");

    // Text
    pdf.setTextColor(...GRAY_TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(displayLines, mx + 4, y + 3);

    // Photo (right column)
    if (sec.photo) {
      const px = mx + textW + 3;
      const pw = cw - textW - 3;
      const ph = textH;
      try {
        pdf.addImage(sec.photo, "JPEG", px, y - 1, pw, ph);
      } catch {
        // skip
      }
    }

    y += textH + 4;
  }

  // ==========================================
  // FOOTER
  // ==========================================

  // Separator
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(mx, y, pageW - mx, y);
  y += 4;

  const halfW = cw / 2 - 2;
  const fy = y;

  // Left: Déjà arrivé — navy title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...NAVY);
  pdf.text("D\u00c9J\u00c0 ARRIV\u00c9 ?", mx, y);
  y += 4;

  if (rex.deja_arrive && rex.deja_arrive.length > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...GRAY_TEXT);
    for (const item of rex.deja_arrive) {
      pdf.setFillColor(...YELLOW);
      pdf.circle(mx + 2, y - 0.5, 0.6, "F");
      const il = pdf.splitTextToSize(sanitize(item), halfW - 8);
      pdf.text(il, mx + 5, y);
      y += il.length * 3 + 1;
    }
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text("Non renseign\u00e9", mx + 4, y);
  }

  // Right: Type d'événement — navy title
  const rx = mx + halfW + 4;
  let ty = fy;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...NAVY);
  pdf.text("TYPE D'\u00c9V\u00c9NEMENT", rx, ty);
  ty += 4;

  for (const t of EVENT_TYPES) {
    const active = rex.type_evenement === t.value;
    if (active) {
      pdf.setFillColor(...NAVY);
      pdf.roundedRect(rx, ty - 2.5, halfW, 4.5, 0.8, 0.8, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(160, 160, 160);
    }
    pdf.text(sanitize(t.label), rx + 2, ty);
    ty += 5;
  }

  // ==========================================
  // DOWNLOAD — use pdf.save() for secure download
  // ==========================================
  pdf.save(filename);
}
