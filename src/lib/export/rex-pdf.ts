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
const CREAM_BG: [number, number, number] = [255, 249, 230]; // #FFF9E6
const YELLOW_LIGHT: [number, number, number] = [254, 243, 199]; // #FEF3C7

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "sd", label: "SD (Situation Dangereuse)" },
  { value: "presquaccident", label: "PRESQU'ACCIDENT" },
  { value: "accident", label: "ACCIDENT" },
  { value: "hpe", label: "HPE (High Potential Events)" },
];

/**
 * Determine which PDF template to use.
 * New template: fiche >= 8/2025
 */
function isNewTemplate(rex: Rex): boolean {
  const num = parseInt(rex.rex_number) || 0;
  const year = rex.rex_year || 0;
  return year > 2025 || (year === 2025 && num >= 8);
}

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

/**
 * Render metadata lines (yellow labels + gray values).
 */
function renderMetadata(
  pdf: jsPDF,
  metaLines: { items: { label: string; value: string; lw: number }[] }[],
  startX: number,
  startY: number,
): number {
  let metaY = startY;
  pdf.setFontSize(8);
  for (const line of metaLines) {
    let lineX = startX;
    let hasContent = false;
    for (const m of line.items) {
      if (!m.value) continue;
      hasContent = true;
      pdf.setTextColor(...YELLOW);
      pdf.setFont("helvetica", "bold");
      pdf.text(m.label, lineX, metaY);
      pdf.setTextColor(...GRAY_TEXT);
      pdf.setFont("helvetica", "normal");
      const valText = ` : ${sanitize(m.value)}`;
      pdf.text(valText, lineX + m.lw, metaY);
      lineX += m.lw + pdf.getStringUnitWidth(valText) * 8 / pdf.internal.scaleFactor + 8;
    }
    if (hasContent) metaY += 3.5;
  }
  return metaY;
}

/**
 * Build common metadata lines for header.
 */
function buildMetaLines(rex: Rex): { items: { label: string; value: string; lw: number }[] }[] {
  return [
    { items: [{ label: "CHANTIER", value: rex.chantier, lw: 20 }] },
    { items: [{ label: "ADRESSE", value: rex.lieu, lw: 18 }] },
    { items: [{ label: "TYPE DE TRAVAUX", value: rex.type_travaux || "", lw: 34 }] },
    {
      items: [
        {
          label: "DATE",
          value: rex.date_evenement
            ? new Date(rex.date_evenement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
            : "",
          lw: 11,
        },
        { label: "HORAIRE", value: rex.horaire, lw: 17 },
      ],
    },
  ];
}

/**
 * Render the INNOVTEC logo fallback text.
 */
function renderLogoFallback(pdf: jsPDF, x: number, y: number) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(30, 58, 95);
  pdf.text("INN", x, y + 9);
  pdf.setTextColor(245, 158, 11);
  pdf.text("O", x + 14, y + 9);
  pdf.setTextColor(30, 58, 95);
  pdf.text("VTEC", x + 18, y + 9);
  pdf.setFontSize(6);
  pdf.setTextColor(100, 100, 100);
  pdf.text("R\u00c9SEAUX", x + 9, y + 13);
  pdf.setFillColor(245, 158, 11);
  pdf.rect(x, y + 14, 34, 0.4, "F");
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
  let y = 0;

  const useNew = isNewTemplate(rex);

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

  const sections = [
    { key: "faits", text: rex.faits, photo: photoFaits },
    { key: "causes", text: rex.causes, photo: photoCauses },
    { key: "actions", text: rex.actions_engagees, photo: photoActions },
    { key: "vigilance", text: rex.vigilance, photo: photoVigilance },
  ] as const;

  // ==========================================
  // HEADER
  // ==========================================

  if (useNew) {
    // ---- NEW TEMPLATE HEADER ----
    // Navy bar at top
    const barH = 18;
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, pageW, barH, "F");

    // Logo on LEFT inside navy bar
    let logoOk = false;
    if (logoData) {
      try { pdf.addImage(logoData, "PNG", mx, 2, 44, 14); logoOk = true; } catch { /* fallback */ }
    }
    if (!logoOk) {
      // White text fallback on dark bg
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text("INNOVTEC", mx, 11);
      pdf.setFontSize(6);
      pdf.text("R\u00c9SEAUX", mx, 15);
    }

    // FICHE REX badge on RIGHT — yellow rounded rect
    const badgeW = 58;
    const badgeH = 14;
    const badgeX = pageW - mx - badgeW;
    const badgeY = 2;
    pdf.setFillColor(...YELLOW);
    pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...NAVY);
    pdf.text("FICHE REX", badgeX + 3, badgeY + 6);
    pdf.setFontSize(12);
    pdf.text(`${rex.rex_number || "-"}/${rex.rex_year || "-"}`, badgeX + 3, badgeY + 12);

    y = barH + 4;

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...YELLOW);
    const titleLabel = "TITRE DE L'\u00c9V\u00c9NEMENT :";
    pdf.text(titleLabel, mx, y + 4);
    const tlW = pdf.getStringUnitWidth(titleLabel) * 9 / pdf.internal.scaleFactor;

    pdf.setTextColor(...NAVY);
    pdf.setFontSize(9);
    const titleText = sanitize(rex.title);
    const maxTitleW = cw - tlW - 2;
    const titleLines = pdf.splitTextToSize(titleText, maxTitleW);
    pdf.text(titleLines, mx + tlW + 1, y + 4);

    let metaStartY = y + 8 + (titleLines.length > 1 ? (titleLines.length - 1) * 3.5 : 0);

    // Metadata
    const metaLines = buildMetaLines(rex);
    metaStartY = renderMetadata(pdf, metaLines, mx, metaStartY);

    // Type d'événement in header (small badge)
    if (rex.type_evenement) {
      const evtType = EVENT_TYPES.find(t => t.value === rex.type_evenement);
      if (evtType) {
        const evtLabel = sanitize(evtType.label);
        const evtW = pdf.getStringUnitWidth(evtLabel) * 7 / pdf.internal.scaleFactor + 6;
        pdf.setFillColor(...NAVY);
        pdf.roundedRect(mx, metaStartY, evtW, 5, 1, 1, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.text(evtLabel, mx + 3, metaStartY + 3.5);
        metaStartY += 7;
      }
    }

    y = metaStartY + 2;

    // Yellow-to-navy gradient separator
    const gradSteps = 20;
    const stepW = cw / gradSteps;
    for (let i = 0; i < gradSteps; i++) {
      const t = i / gradSteps;
      const r = Math.round(245 + (11 - 245) * t);
      const g = Math.round(158 + (54 - 158) * t);
      const b = Math.round(11 + (85 - 11) * t);
      pdf.setFillColor(r, g, b);
      pdf.rect(mx + i * stepW, y, stepW + 0.5, 1.5, "F");
    }
    y += 6;

  } else {
    // ---- OLD TEMPLATE HEADER ----
    y = 10;

    // Badge "FICHE REX n/year" — yellow rounded rectangle (LEFT)
    const bw = 30, bh = 20;
    pdf.setFillColor(...YELLOW);
    pdf.roundedRect(mx, y, bw, bh, 2.5, 2.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("FICHE REX", mx + bw / 2, y + 7, { align: "center" });
    pdf.setFontSize(15);
    pdf.text(`${rex.rex_number || "-"}/${rex.rex_year || "-"}`, mx + bw / 2, y + 16, { align: "center" });

    // Company logo (top RIGHT)
    const logoX = pageW - mx - 46;
    let logoOk = false;
    if (logoData) {
      try { pdf.addImage(logoData, "PNG", logoX, y, 44, 15); logoOk = true; } catch { /* fallback */ }
    }
    if (!logoOk) {
      renderLogoFallback(pdf, logoX, y);
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

    // Metadata
    const metaStartY = y + 10 + (titleLines.length > 1 ? (titleLines.length - 1) * 3.5 : 0);
    const metaLines = buildMetaLines(rex);
    renderMetadata(pdf, metaLines, ix, metaStartY);

    y += bh + 5;

    // Yellow-to-navy gradient separator
    const gradSteps = 20;
    const stepW = cw / gradSteps;
    for (let i = 0; i < gradSteps; i++) {
      const t = i / gradSteps;
      const r = Math.round(245 + (11 - 245) * t);
      const g = Math.round(158 + (54 - 158) * t);
      const b = Math.round(11 + (85 - 11) * t);
      pdf.setFillColor(r, g, b);
      pdf.rect(mx + i * stepW, y, stepW + 0.5, 1.5, "F");
    }
    y += 6;
  }

  // ==========================================
  // SECTIONS — natural size, keep colored SVG badges
  // ==========================================

  for (const sec of sections) {
    if (!sec.text && !sec.photo) continue;

    // Badge image (SVG rendered to PNG)
    const badge = badges[sec.key];
    if (badge) {
      try {
        const badgeH = 9;
        const badgeW = sec.key === "faits" ? 38 : sec.key === "causes" ? 46 : sec.key === "actions" ? 48 : 42;
        pdf.addImage(badge, "PNG", mx, y - 1, badgeW, badgeH);
      } catch {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...NAVY);
        pdf.text(sec.key.toUpperCase(), mx, y + 5);
      }
    }

    y += 12;

    // Text content box
    const hasPhoto = !!sec.photo;
    const textW = hasPhoto ? cw * 0.58 : cw;
    const sanitizedText = sanitize(sec.text || "");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const lines = pdf.splitTextToSize(sanitizedText, textW - 10);
    const textH = Math.max(lines.length * 4.2 + 8, 20);

    // Background: cream for new template, white for old
    if (useNew) {
      pdf.setFillColor(...CREAM_BG);
    } else {
      pdf.setFillColor(255, 255, 255);
    }
    pdf.roundedRect(mx, y - 2, textW, textH, 1.5, 1.5, "F");

    // Golden border
    pdf.setDrawColor(...GOLD_BORDER);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(mx, y - 2, textW, textH, 1.5, 1.5, "S");

    // Text
    pdf.setTextColor(...GRAY_TEXT);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(lines, mx + 5, y + 4);

    // Photo (right column)
    if (sec.photo) {
      const px = mx + textW + 4;
      const pw = cw - textW - 4;
      const ph = Math.max(textH, 28);
      try {
        pdf.addImage(sec.photo, "JPEG", px, y - 2, pw, ph);
      } catch {
        // skip
      }
    }

    y += textH + 6;
  }

  // ==========================================
  // CONCLUSION / FOOTER — template-dependent
  // ==========================================

  if (useNew) {
    // ---- NEW TEMPLATE FOOTER ----
    // Yellow background with Règles vitales associées
    if (rex.conclusion_title && rex.conclusion_content) {
      // Split content into lines by \n for bullet rendering
      const contentLines = sanitize(rex.conclusion_content)
        .split("\n")
        .map(l => l.replace(/^[\s\u2022\u25CF\u25A0\u2023*-]+\s*/, "").trim())
        .filter(l => l.length > 0);

      // Calculate needed height
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      let totalContentH = 0;
      for (const line of contentLines) {
        const wrapped = pdf.splitTextToSize(line, cw - 18);
        totalContentH += wrapped.length * 4.2 + 1.5;
      }
      const footerH = 12 + totalContentH + 6; // title + content + padding

      // Add new page if footer won't fit
      if (y + footerH > pageH - 10) {
        pdf.addPage();
        y = 15;
      }

      // Yellow background rectangle
      pdf.setFillColor(...YELLOW_LIGHT);
      pdf.roundedRect(mx, y, cw, footerH, 2, 2, "F");

      // Yellow border
      pdf.setDrawColor(...YELLOW);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(mx, y, cw, footerH, 2, 2, "S");

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...NAVY);
      const footerTitle = sanitize(rex.conclusion_title.toUpperCase());
      pdf.text(footerTitle, mx + 6, y + 8);

      // Bullet content
      let bulletY = y + 14;
      pdf.setFontSize(9);
      for (const line of contentLines) {
        // Navy square bullet
        pdf.setFillColor(...NAVY);
        pdf.rect(mx + 6, bulletY - 2.5, 2.5, 2.5, "F");

        // Bold navy text
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...NAVY);
        const wrapped = pdf.splitTextToSize(line, cw - 18);
        pdf.text(wrapped, mx + 11, bulletY);
        bulletY += wrapped.length * 4.2 + 1.5;
      }
    }

  } else {
    // ---- OLD TEMPLATE: Conclusion + Footer ----

    // Conclusion (Règles vitales, Bonnes pratiques, etc.)
    if (rex.conclusion_title && rex.conclusion_content) {
      // Red separator line
      pdf.setFillColor(239, 68, 68); // red-500
      pdf.rect(mx, y, cw, 1.2, "F");
      y += 5;

      // Title (underlined)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...NAVY);
      const conclusionTitle = sanitize(`${rex.conclusion_title} :`);
      pdf.text(conclusionTitle, mx, y);
      const titleWidth = pdf.getStringUnitWidth(conclusionTitle) * 10 / pdf.internal.scaleFactor;
      pdf.setDrawColor(...NAVY);
      pdf.setLineWidth(0.3);
      pdf.line(mx, y + 1, mx + titleWidth, y + 1);
      y += 6;

      // Content
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...GRAY_TEXT);
      const conclusionLines = pdf.splitTextToSize(sanitize(rex.conclusion_content), cw - 5);
      pdf.text(conclusionLines, mx + 2, y);
      y += conclusionLines.length * 4.2 + 6;
    }

    // Footer: DÉJÀ ARRIVÉ + TYPE D'ÉVÉNEMENT
    const footerHeight = 32;

    // Add new page if footer won't fit
    if (y + footerHeight > pageH - 10) {
      pdf.addPage();
      y = 15;
    }

    const footerY = y;

    // Separator line
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(mx, footerY, pageW - mx, footerY);

    const halfW = cw / 2 - 2;
    const fy = footerY + 5;

    // Left: Déjà arrivé
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...NAVY);
    pdf.text("D\u00c9J\u00c0 ARRIV\u00c9 ?", mx, fy);
    let leftY = fy + 5;

    if (rex.deja_arrive && rex.deja_arrive.length > 0) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...GRAY_TEXT);
      for (const item of rex.deja_arrive) {
        pdf.setFillColor(...YELLOW);
        pdf.circle(mx + 2, leftY - 0.5, 0.7, "F");
        const il = pdf.splitTextToSize(sanitize(item), halfW - 8);
        pdf.text(il, mx + 6, leftY);
        leftY += il.length * 3.5 + 1;
      }
    } else {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
      pdf.text("Non renseign\u00e9", mx + 4, leftY);
    }

    // Right: Type d'événement
    const rx = mx + halfW + 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...NAVY);
    pdf.text("TYPE D'\u00c9V\u00c9NEMENT", rx, fy);
    let ty = fy + 5;

    for (const t of EVENT_TYPES) {
      const active = rex.type_evenement === t.value;
      if (active) {
        pdf.setFillColor(...NAVY);
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
  }

  // ==========================================
  // DOWNLOAD
  // ==========================================
  pdf.save(filename);
}
