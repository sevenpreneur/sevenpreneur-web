import jsPDF from "jspdf";

const CERTIFICATE_CANVAS_URL =
  "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur/certificate_canvas.png";

interface GenerateCohortCertificateParams {
  fullName: string;
  cohortName: string;
}

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch certificate canvas: ${response.status}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("Failed to load certificate canvas"));
    img.src = dataUrl;
  });
}

export async function generateCohortCertificate(
  params: GenerateCohortCertificateParams
): Promise<Blob> {
  const dataUrl = await fetchImageAsDataUrl(CERTIFICATE_CANVAS_URL);
  const { width: imgW, height: imgH } = await getImageDimensions(dataUrl);

  // PDF size = A4 landscape width, height scaled to canvas aspect ratio
  const pageWidth = 297;
  const pageHeight = (imgH / imgW) * pageWidth;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageWidth, pageHeight],
  });

  doc.addImage(dataUrl, "PNG", 0, 0, pageWidth, pageHeight);

  // Full name — centered above the name underline (around 50% vertical).
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 30, 60);
  const maxNameWidth = pageWidth * 0.7;
  let nameFontSize = 36;
  const minNameFontSize = 18;
  doc.setFontSize(nameFontSize);
  while (
    doc.getTextWidth(params.fullName) > maxNameWidth &&
    nameFontSize > minNameFontSize
  ) {
    nameFontSize -= 1;
    doc.setFontSize(nameFontSize);
  }
  doc.text(params.fullName, pageWidth / 2, pageHeight * 0.5 + 7, {
    align: "center",
  });

  // Completion paragraph — centered below the name underline
  const paragraph = `For successfully completing the ${params.cohortName}, demonstrating commitment, perseverance, and excellence in entrepreneurial learning and practice.`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  const wrapped = doc.splitTextToSize(paragraph, pageWidth * 0.6);
  doc.text(wrapped, pageWidth / 2, pageHeight * 0.6 + 3, { align: "center" });

  return doc.output("blob");
}
