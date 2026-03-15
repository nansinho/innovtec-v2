import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportSsePdf(element: HTMLElement, filename: string) {
  if (!element) {
    throw new Error("Élément non trouvé pour l'export PDF");
  }

  // Temporarily adjust element for capture
  const originalStyles = {
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    overflow: element.style.overflow,
    position: element.style.position,
  };

  element.style.width = "1200px";
  element.style.maxWidth = "1200px";
  element.style.overflow = "visible";

  // Wait for fonts and images to load
  await document.fonts.ready;

  // Small delay to ensure styles are applied
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
        // Resolve CSS variables in cloned document
        const clonedElement = clonedDoc.body.querySelector("[data-pdf-capture]") || clonedDoc.body.firstElementChild;
        if (clonedElement) {
          const computedStyle = getComputedStyle(document.documentElement);
          const cssVars = [
            "--navy", "--heading", "--text", "--text-secondary", "--text-muted",
            "--yellow", "--border-1", "--border-2", "--hover", "--card",
            "--radius", "--radius-sm", "--radius-xs",
          ];
          cssVars.forEach((v) => {
            const value = computedStyle.getPropertyValue(v);
            if (value) {
              clonedDoc.documentElement.style.setProperty(v, value);
            }
          });
        }
      },
    });
  } finally {
    // Restore original styles
    element.style.width = originalStyles.width;
    element.style.maxWidth = originalStyles.maxWidth;
    element.style.overflow = originalStyles.overflow;
    element.style.position = originalStyles.position;
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
    // Fits on a single page
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  } else {
    // Multi-page
    let y = 0;
    let pageNum = 0;
    while (y < imgHeight) {
      if (pageNum > 0) pdf.addPage();

      // Calculate the portion of the canvas to render on this page
      const sourceY = (y / imgHeight) * canvas.height;
      const sourceHeight = Math.min(
        (pageHeight / imgHeight) * canvas.height,
        canvas.height - sourceY
      );

      // Create a temporary canvas for this page slice
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

  // Use blob-based download as fallback for better browser compatibility
  try {
    pdf.save(filename);
  } catch {
    // Fallback: create blob and trigger download manually
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
