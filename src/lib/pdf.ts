import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function elementToPdfBlob(el: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;

  const imgW = usableW;
  const fullImgH = (canvas.height * imgW) / canvas.width;

  if (fullImgH <= usableH) {
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, imgW, fullImgH);
  } else {
    const sliceCanvasH = Math.floor((canvas.width * usableH) / usableW);
    let position = 0;
    while (position < canvas.height) {
      const sliceH = Math.min(sliceCanvasH, canvas.height - position);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, -position);
      const sliceImgH = (sliceH * imgW) / canvas.width;
      pdf.addImage(slice.toDataURL("image/png"), "PNG", margin, margin, imgW, sliceImgH);
      position += sliceH;
      if (position < canvas.height) pdf.addPage();
    }
  }

  return pdf.output("blob");
}

export function buildFilename(opts: {
  lastName: string;
  tripDates: string[]; // ISO yyyy-mm-dd
}): string {
  const today = new Date().toISOString().slice(0, 10);
  const safeName = opts.lastName.replace(/[^\p{L}\p{N}_-]+/gu, "");
  const dates = [...opts.tripDates].filter(Boolean).sort();
  if (dates.length > 1) {
    return `${today}_${safeName}_${dates[0]}—${dates[dates.length - 1]}.pdf`;
  }
  return `${today}_${safeName}.pdf`;
}

export function printElement(filenameNoExt: string) {
  const prev = document.title;
  document.title = filenameNoExt;
  window.print();
  setTimeout(() => {
    document.title = prev;
  }, 500);
}
