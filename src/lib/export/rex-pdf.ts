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
 * New template: fiche >= 8/2025
 */
function isNewTemplate(rex: Rex): boolean {
  const num = parseInt(rex.rex_number) || 0;
  const year = rex.rex_year || 0;
  return year > 2025 || (year === 2025 && num >= 8);
}

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
    img.onerror = () => { fetchImageAsBase64(url).then(resolve); };
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
  const mx = 8; // margin X
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

  // Helper: format date
  const dateStr = rex.date_evenement
    ? new Date(rex.date_evenement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  // ==========================================
  // HEADER
  // ==========================================

  if (useNew) {
    // ---- NEW TEMPLATE HEADER ----
    y = 6;

    // Logo on LEFT
    let logoOk = false;
    if (logoData) {
      try { pdf.addImage(logoData, "PNG", mx, y, 40, 13); logoOk = true; } catch { /* fallback */ }
    }
    if (!logoOk) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(...NAVY);
      pdf.text("INN", mx, y + 8);
      pdf.setTextColor(...YELLOW);
      pdf.text("O", mx + 16, y + 8);
      pdf.setTextColor(...NAVY);
      pdf.text("VTEC", mx + 20, y + 8);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text("R\u00c9SEAUX", mx + 8, y + 12);
      pdf.setFillColor(...YELLOW);
      pdf.rect(mx, y + 13, 38, 0.5, "F");
    }

    // FICHE REX badge on RIGHT — yellow rounded rect
    const badgeW = 52;
    const badgeH = 13;
    const badgeX = pageW - mx - badgeW;
    pdf.setFillColor(...YELLOW);
    pdf.roundedRect(badgeX, y, badgeW, badgeH, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(...NAVY);
    pdf.text("FICHE REX", badgeX + 3, y + 5.5);
    pdf.setFontSize(11);
    pdf.text(`${rex.rex_number || "-"}/${rex.rex_year || "-"}`, badgeX + 3, y + 11);

    y += 17;

    // TITRE DE L'ÉVÉNEMENT
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...YELLOW);
    const tLabel = "TITRE DE L'\u00c9V\u00c9NEMENT : ";
    pdf.text(tLabel, mx, y);
    const tLabelW = pdf.getStringUnitWidth(tLabel) * 10 / pdf.internal.scaleFactor;
    pdf.setTextColor(...NAVY);
    const titleLines = pdf.splitTextToSize(sanitize(rex.title), cw - tLabelW);
    pdf.text(titleLines, mx + tLabelW, y);
    y += 4 + (titleLines.length > 1 ? (titleLines.length - 1) * 4 : 0);

    // Metadata lines — 9pt, proper spacing
    pdf.setFontSize(9);
    const metaItems: { label: string; value: string }[] = [
      { label: "CHANTIER", value: rex.chantier },
      { label: "ADRESSE", value: rex.lieu },
      { label: "TYPE DE TRAVAUX", value: rex.type_travaux || "" },
    ];
    for (const m of metaItems) {
      if (!m.value) continue;
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...YELLOW);
      pdf.text(m.label, mx, y);
      const lw = pdf.getStringUnitWidth(m.label) * 9 / pdf.internal.scaleFactor;
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...GRAY_TEXT);
      pdf.text(` : ${sanitize(m.value)}`, mx + lw, y);
      y += 3.8;
    }

    // DATE + HORAIRE on same line
    if (dateStr || rex.horaire) {
      let lineX = mx;
      if (dateStr) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...YELLOW);
        pdf.text("DATE", lineX, y);
        const dw = pdf.getStringUnitWidth("DATE") * 9 / pdf.internal.scaleFactor;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...GRAY_TEXT);
        const dateVal = ` : ${dateStr}`;
        pdf.text(dateVal, lineX + dw, y);
        lineX += dw + pdf.getStringUnitWidth(dateVal) * 9 / pdf.internal.scaleFactor + 8;
      }
      if (rex.horaire) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...YELLOW);
        pdf.text("HORAIRE", lineX, y);
        const hw = pdf.getStringUnitWidth("HORAIRE") * 9 / pdf.internal.scaleFactor;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...GRAY_TEXT);
        pdf.text(` : ${sanitize(rex.horaire)}`, lineX + hw, y);
      }
      y += 3.8;
    }

    // Type d'événement badge in header (if set)
    if (rex.type_evenement) {
      const evtType = EVENT_TYPES.find(t => t.value === rex.type_evenement);
      if (evtType) {
        y += 1;
        const evtLabel = sanitize(evtType.label);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        const evtW = pdf.getStringUnitWidth(evtLabel) * 7 / pdf.internal.scaleFactor + 6;
        pdf.setFillColor(...NAVY);
        pdf.roundedRect(mx, y - 3, evtW, 4.5, 1, 1, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.text(evtLabel, mx + 3, y);
        y += 4;
      }
    }

    y += 1;

    // Yellow-to-navy gradient separator
    const gradSteps = 20;
    const stepW = cw / gradSteps;
    for (let i = 0; i < gradSteps; i++) {
      const t = i / gradSteps;
      pdf.setFillColor(
        Math.round(245 + (11 - 245) * t),
        Math.round(158 + (54 - 158) * t),
        Math.round(11 + (85 - 11) * t),
      );
      pdf.rect(mx + i * stepW, y, stepW + 0.5, 1.2, "F");
    }
    y += 4;

  } else {
    // ---- OLD TEMPLATE HEADER ----
    y = 8;

    // Badge "FICHE REX" LEFT
    const bw = 28, bh = 18;
    pdf.setFillColor(...YELLOW);
    pdf.roundedRect(mx, y, bw, bh, 2.5, 2.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text("FICHE REX", mx + bw / 2, y + 6, { align: "center" });
    pdf.setFontSize(13);
    pdf.text(`${rex.rex_number || "-"}/${rex.rex_year || "-"}`, mx + bw / 2, y + 14, { align: "center" });

    // Company logo RIGHT
    const logoX = pageW - mx - 44;
    let logoOk = false;
    if (logoData) {
      try { pdf.addImage(logoData, "PNG", logoX, y, 42, 14); logoOk = true; } catch { /* fallback */ }
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

    // Title + metadata between badge and logo
    const ix = mx + bw + 4;
    const iw = logoX - ix - 4;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...YELLOW);
    const titleLabel = "TITRE DE L'\u00c9V\u00c9NEMENT";
    pdf.text(titleLabel, ix, y + 5);
    const tlW = pdf.getStringUnitWidth(titleLabel) * 10 / pdf.internal.scaleFactor;
    pdf.setTextColor(...NAVY);
    const titleText = sanitize(` -- ${rex.title}`);
    const titleLines = pdf.splitTextToSize(titleText, iw - tlW);
    pdf.text(titleLines, ix + tlW, y + 5);

    // Metadata
    pdf.setFontSize(8);
    let metaY = y + 10 + (titleLines.length > 1 ? (titleLines.length - 1) * 3.5 : 0);
    const metas: { label: string; value: string }[] = [
      { label: "Chantier", value: rex.chantier },
      { label: "Adresse", value: rex.lieu },
    ];
    for (const m of metas) {
      if (!m.value) continue;
      pdf.setTextColor(...YELLOW);
      pdf.setFont("helvetica", "bold");
      pdf.text(m.label, ix, metaY);
      const lw = pdf.getStringUnitWidth(m.label) * 8 / pdf.internal.scaleFactor;
      pdf.setTextColor(...GRAY_TEXT);
      pdf.setFont("helvetica", "normal");
      pdf.text(` : ${sanitize(m.value)}`, ix + lw, metaY);
      metaY += 3.5;
    }
    // Date + Horaire
    if (dateStr) {
      pdf.setTextColor(...YELLOW);
      pdf.setFont("helvetica", "bold");
      pdf.text("Date", ix, metaY);
      pdf.setTextColor(...GRAY_TEXT);
      pdf.setFont("helvetica", "normal");
      pdf.text(` : ${dateStr}`, ix + 9, metaY);
      if (rex.horaire) {
        const dEnd = ix + 9 + pdf.getStringUnitWidth(` : ${dateStr}`) * 8 / pdf.internal.scaleFactor + 4;
        pdf.setTextColor(...YELLOW);
        pdf.setFont("helvetica", "bold");
        pdf.text("Horaire", dEnd, metaY);
        pdf.setTextColor(...GRAY_TEXT);
        pdf.setFont("helvetica", "normal");
        pdf.text(` : ${sanitize(rex.horaire)}`, dEnd + 14, metaY);
      }
    }

    y += bh + 4;

    // Gradient separator
    const gradSteps = 20;
    const stepW = cw / gradSteps;
    for (let i = 0; i < gradSteps; i++) {
      const t = i / gradSteps;
      pdf.setFillColor(
        Math.round(245 + (11 - 245) * t),
        Math.round(158 + (54 - 158) * t),
        Math.round(11 + (85 - 11) * t),
      );
      pdf.rect(mx + i * stepW, y, stepW + 0.5, 1.2, "F");
    }
    y += 4;
  }

  // ==========================================
  // Calculate remaining space for sections + footer
  // to determine text size & spacing
  // ==========================================
  const footerEstimate = useNew
    ? (rex.conclusion_title && rex.conclusion_content ? 25 : 0)
    : ((rex.conclusion_title && rex.conclusion_content ? 22 : 0) + 30);
  const availableForSections = pageH - y - footerEstimate - 8;

  // Pre-calculate total section height at 8pt to check if everything fits
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  let totalSectionH = 0;
  const sectionData: { key: string; text: string; photo: string | null; lines: string[]; textH: number }[] = [];
  for (const sec of sections) {
    if (!sec.text && !sec.photo) continue;
    const hasPhoto = !!sec.photo;
    const textW = hasPhoto ? cw * 0.58 - 8 : cw - 8;
    const lines = pdf.splitTextToSize(sanitize(sec.text || ""), textW);
    const textH = Math.max(lines.length * 3.6 + 6, 16);
    totalSectionH += textH + 14; // badge(10) + gap(4)
    sectionData.push({ key: sec.key, text: sec.text || "", photo: sec.photo, lines, textH });
  }

  // Choose font size: 8pt if tight, 9pt if space allows
  const useSmallerFont = totalSectionH > availableForSections;
  const secFontSize = useSmallerFont ? 7.5 : 8;
  const secLineH = useSmallerFont ? 3.2 : 3.6;
  const secGap = useSmallerFont ? 2 : 4;
  const badgeGap = useSmallerFont ? 8 : 10;

  // Re-calculate with chosen font size
  if (useSmallerFont) {
    pdf.setFontSize(secFontSize);
    for (const sec of sectionData) {
      const hasPhoto = !!sec.photo;
      const textW = hasPhoto ? cw * 0.58 - 8 : cw - 8;
      sec.lines = pdf.splitTextToSize(sanitize(sec.text), textW);
      sec.textH = Math.max(sec.lines.length * secLineH + 6, 14);
    }
  }

  // ==========================================
  // SECTIONS
  // ==========================================

  for (const sec of sectionData) {
    // Badge image
    const badge = badges[sec.key];
    if (badge) {
      try {
        const bH = 8;
        const bW = sec.key === "faits" ? 34 : sec.key === "causes" ? 42 : sec.key === "actions" ? 44 : 38;
        pdf.addImage(badge, "PNG", mx, y, bW, bH);
      } catch {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...NAVY);
        pdf.text(sec.key.toUpperCase(), mx, y + 5);
      }
    }
    y += badgeGap;

    // Text content box
    const hasPhoto = !!sec.photo;
    const textW = hasPhoto ? cw * 0.58 : cw;

    // Background
    pdf.setFillColor(useNew ? CREAM_BG[0] : 255, useNew ? CREAM_BG[1] : 255, useNew ? CREAM_BG[2] : 255);
    pdf.roundedRect(mx, y, textW, sec.textH, 1.5, 1.5, "F");

    // Border
    pdf.setDrawColor(...GOLD_BORDER);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(mx, y, textW, sec.textH, 1.5, 1.5, "S");

    // Text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(secFontSize);
    pdf.setTextColor(...GRAY_TEXT);
    pdf.text(sec.lines, mx + 4, y + 4);

    // Photo
    if (sec.photo) {
      const px = mx + textW + 3;
      const pw = cw - textW - 3;
      const ph = Math.max(sec.textH, 22);
      try {
        pdf.addImage(sec.photo, "JPEG", px, y, pw, ph);
      } catch {
        // skip
      }
    }

    y += sec.textH + secGap;
  }

  // ==========================================
  // CONCLUSION / FOOTER
  // ==========================================

  if (useNew) {
    // ---- NEW TEMPLATE FOOTER: yellow box with rules ----
    if (rex.conclusion_title && rex.conclusion_content) {
      // Parse content lines
      const contentLines = sanitize(rex.conclusion_content)
        .split("\n")
        .map(l => l.replace(/^[\s\u2022\u25CF\u25A0\u2023*\-]+\s*/, "").trim())
        .filter(l => l.length > 0);

      // Calculate height
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      let contentH = 0;
      const wrappedLines: string[][] = [];
      for (const line of contentLines) {
        const wrapped = pdf.splitTextToSize(line, cw - 20);
        wrappedLines.push(wrapped);
        contentH += wrapped.length * 3.6 + 1.5;
      }
      const boxH = 10 + contentH + 4;

      // Yellow background
      pdf.setFillColor(...YELLOW_LIGHT);
      pdf.roundedRect(mx, y, cw, boxH, 2, 2, "F");
      pdf.setDrawColor(...YELLOW);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(mx, y, cw, boxH, 2, 2, "S");

      // Title — explicitly helvetica bold
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...NAVY);
      const footerTitle = sanitize(rex.conclusion_title.toUpperCase());
      const titleWrapped = pdf.splitTextToSize(footerTitle, cw - 12);
      pdf.text(titleWrapped, mx + 5, y + 6);

      // Bullet content
      let bulletY = y + 10 + (titleWrapped.length > 1 ? (titleWrapped.length - 1) * 4.5 : 0);
      for (const wrapped of wrappedLines) {
        // Navy square bullet
        pdf.setFillColor(...NAVY);
        pdf.rect(mx + 5, bulletY - 2.2, 2, 2, "F");

        // Bold navy text — explicitly helvetica
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(...NAVY);
        pdf.text(wrapped, mx + 10, bulletY);
        bulletY += wrapped.length * 3.6 + 1.5;
      }
    }

  } else {
    // ---- OLD TEMPLATE: Conclusion + Déjà arrivé/Type d'événement ----

    if (rex.conclusion_title && rex.conclusion_content) {
      // Red separator
      pdf.setFillColor(239, 68, 68);
      pdf.rect(mx, y, cw, 1, "F");
      y += 4;

      // Title underlined
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...NAVY);
      const cTitle = sanitize(`${rex.conclusion_title} :`);
      pdf.text(cTitle, mx, y);
      const tw = pdf.getStringUnitWidth(cTitle) * 9 / pdf.internal.scaleFactor;
      pdf.setDrawColor(...NAVY);
      pdf.setLineWidth(0.3);
      pdf.line(mx, y + 1, mx + tw, y + 1);
      y += 5;

      // Content — explicit helvetica normal
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...GRAY_TEXT);
      const cLines = pdf.splitTextToSize(sanitize(rex.conclusion_content), cw - 4);
      pdf.text(cLines, mx + 2, y);
      y += cLines.length * 3.5 + 4;
    }

    // Footer: Déjà arrivé + Type d'événement
    const footerY = y;

    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(mx, footerY, pageW - mx, footerY);

    const halfW = cw / 2 - 2;
    const fy = footerY + 4;

    // Left: Déjà arrivé
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...NAVY);
    pdf.text("D\u00c9J\u00c0 ARRIV\u00c9 ?", mx, fy);
    let leftY = fy + 4;

    if (rex.deja_arrive && rex.deja_arrive.length > 0) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...GRAY_TEXT);
      for (const item of rex.deja_arrive) {
        pdf.setFillColor(...YELLOW);
        pdf.circle(mx + 2, leftY - 0.5, 0.6, "F");
        const il = pdf.splitTextToSize(sanitize(item), halfW - 8);
        pdf.text(il, mx + 5, leftY);
        leftY += il.length * 3 + 1;
      }
    } else {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      pdf.setTextColor(160, 160, 160);
      pdf.text("Non renseign\u00e9", mx + 4, leftY);
    }

    // Right: Type d'événement
    const rx = mx + halfW + 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...NAVY);
    pdf.text("TYPE D'\u00c9V\u00c9NEMENT", rx, fy);
    let ty = fy + 4;

    for (const t of EVENT_TYPES) {
      const active = rex.type_evenement === t.value;
      if (active) {
        pdf.setFillColor(...NAVY);
        pdf.roundedRect(rx, ty - 2.5, halfW, 4.5, 1, 1, "F");
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
  }

  // ==========================================
  // DOWNLOAD
  // ==========================================
  pdf.save(filename);
}
