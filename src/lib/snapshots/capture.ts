"use client";

/**
 * Utilitários de captura client-side. html2canvas-pro e jsPDF são pesados,
 * então são carregados via import dinâmico apenas quando usados.
 */

const BG = "#0b0f0d";

/** Captura um elemento do DOM e retorna um data URL PNG. */
export async function captureElement(el: HTMLElement): Promise<string> {
  const { default: html2canvas } = await import("html2canvas-pro");
  const canvas = await html2canvas(el, {
    backgroundColor: BG,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
  });
  return canvas.toDataURL("image/png");
}

/** Dispara o download de um data URL como arquivo. */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Gera e baixa um PDF (paisagem) a partir de um data URL de imagem. */
export async function downloadPdf(dataUrl: string, filename: string) {
  const { jsPDF } = await import("jspdf");
  const img = await loadImage(dataUrl);
  const orientation = img.width >= img.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [img.width, img.height] });
  pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
  pdf.save(filename);
}

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Converte a URL de uma imagem remota (ex.: Storage) em data URL PNG. */
export async function imageUrlToDataUrl(url: string): Promise<string> {
  const img = await loadImage(url, true);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Nome de arquivo seguro com timestamp. */
export function snapshotFilename(base: string, ext: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const safe = base.replace(/[^\w-]+/g, "-").replace(/-+/g, "-").toLowerCase();
  return `${safe}-${stamp}.${ext}`;
}
