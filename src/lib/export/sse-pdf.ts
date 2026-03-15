import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Convert all modern CSS color functions (lab, oklch, oklab, etc.)
 * to rgb() format that html2canvas can parse.
 * Tailwind CSS v4 uses oklch/lab internally which html2canvas v1 doesn't support.
 */
function convertColorsToRgb(clonedDoc: Document, sourceDoc: Document) {
  const colorProps = [
    "color", "background-color", "border-color",
    "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
    "outline-color", "text-decoration-color", "box-shadow",
  ];

  const unsupportedColorPattern = /\b(lab|oklch|oklab|lch|color)\s*\(/i;

  // Walk all elements in the cloned document and fix their colors
  const clonedElements = clonedDoc.querySelectorAll("*");
  const sourceElements = sourceDoc.querySelectorAll("*");

  // Build a map of source elements to their computed styles
  // We need to read computed styles from the SOURCE document (live DOM)
  // and apply rgb equivalents to the CLONED document
  const sourceArray = Array.from(sourceElements);
  const clonedArray = Array.from(clonedElements);

  // Match elements by index (html2canvas clones preserve order)
  const len = Math.min(sourceArray.length, clonedArray.length);
  for (let i = 0; i < len; i++) {
    const sourceEl = sourceArray[i] as HTMLElement;
    const clonedEl = clonedArray[i] as HTMLElement;
    const computed = getComputedStyle(sourceEl);

    for (const prop of colorProps) {
      const value = computed.getPropertyValue(prop);
      if (value && unsupportedColorPattern.test(value)) {
        // The browser's computed style should already resolve to rgb()
        // but some browsers return the original lab/oklch format
        // Use a canvas trick to convert to rgb
        const rgbValue = cssColorToRgb(value);
        if (rgbValue) {
          clonedEl.style.setProperty(prop, rgbValue, "important");
        }
      }
    }
  }

  // Also fix CSS variables on :root
  const computedRoot = getComputedStyle(sourceDoc.documentElement);
  const rootStyle = clonedDoc.documentElement.style;
  for (let i = 0; i < computedRoot.length; i++) {
    const prop = computedRoot[i];
    if (prop.startsWith("--")) {
      const value = computedRoot.getPropertyValue(prop).trim();
      if (value && unsupportedColorPattern.test(value)) {
        const rgbValue = cssColorToRgb(value);
        if (rgbValue) {
          rootStyle.setProperty(prop, rgbValue);
        }
      }
    }
  }
}

/**
 * Convert any CSS color string to rgb() using a temporary canvas context.
 * The browser's canvas API handles all CSS color formats and always returns rgb/rgba.
 */
function cssColorToRgb(color: string): string | null {
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = color;
    // ctx.fillStyle normalizes to #rrggbb or rgba()
    const normalized = ctx.fillStyle;
    if (normalized.startsWith("#")) {
      // Convert hex to rgb
      const r = parseInt(normalized.slice(1, 3), 16);
      const g = parseInt(normalized.slice(3, 5), 16);
      const b = parseInt(normalized.slice(5, 7), 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return normalized;
  } catch {
    return null;
  }
}

export async function exportSsePdf(element: HTMLElement, filename: string) {
  if (!element) {
    throw new Error("Élément non trouvé pour l'export PDF");
  }

  // Temporarily adjust element for capture
  const originalStyles = {
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    overflow: element.style.overflow,
  };

  element.style.width = "1200px";
  element.style.maxWidth = "1200px";
  element.style.overflow = "visible";

  // Wait for fonts to load
  await document.fonts.ready;
  await new Promise((resolve) => setTimeout(resolve, 100));

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 1200,
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        // Convert modern CSS color functions (lab, oklch) to rgb
        // so html2canvas can parse them
        convertColorsToRgb(clonedDoc, document);
      },
    });
  } finally {
    // Restore original styles
    element.style.width = originalStyles.width;
    element.style.maxWidth = originalStyles.maxWidth;
    element.style.overflow = originalStyles.overflow;
  }

  // A4 landscape dimensions in mm
  const pageWidth = 297;
  const pageHeight = 210;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const imgData = canvas.toDataURL("image/png");

  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  } else {
    // Multi-page
    let y = 0;
    let pageNum = 0;
    while (y < imgHeight) {
      if (pageNum > 0) pdf.addPage();

      const sourceY = (y / imgHeight) * canvas.height;
      const sourceHeight = Math.min(
        (pageHeight / imgHeight) * canvas.height,
        canvas.height - sourceY
      );

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;
      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );
        const pageData = pageCanvas.toDataURL("image/png");
        const sliceHeight = (sourceHeight * imgWidth) / canvas.width;
        pdf.addImage(pageData, "PNG", 0, 0, imgWidth, sliceHeight);
      }

      y += pageHeight;
      pageNum++;
    }
  }

  // Download with fallback
  try {
    pdf.save(filename);
  } catch {
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
