import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportSsePdf(element: HTMLElement, filename: string) {
  // Temporarily adjust element for capture
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  const originalOverflow = element.style.overflow;

  element.style.width = "1200px";
  element.style.maxWidth = "1200px";
  element.style.overflow = "visible";

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: 1200,
    windowWidth: 1200,
  });

  // Restore original styles
  element.style.width = originalWidth;
  element.style.maxWidth = originalMaxWidth;
  element.style.overflow = originalOverflow;

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

  pdf.save(filename);
}
