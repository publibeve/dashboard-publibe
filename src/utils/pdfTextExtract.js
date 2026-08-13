/**
 * Extrae todo el texto de un PDF, página por página, del lado del cliente.
 * Mismo setup de pdfjs-dist (import dinámico + worker + polyfill de
 * Promise.withResolvers) que ya usa zoho.service.js para las miniaturas —
 * se repite acá en vez de compartir función porque esa está pensada para
 * renderizar a canvas, no para leer texto; el setup es idéntico, el uso
 * final es distinto.
 */
export async function extractPdfText(file) {
  if (typeof Promise.withResolvers !== "function") {
    Promise.withResolvers = function () {
      let resolve, reject;
      const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
      return { promise, resolve, reject };
    };
  }
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;

  let textoCompleto = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Los items de pdf.js vienen con su posición en la página, no en orden
    // de lectura garantizado — unir con espacio (no salto de línea) es lo
    // más seguro para no partir palabras/números a la mitad; los saltos de
    // línea reales no importan para lo que la IA necesita leer acá.
    const textoPagina = content.items.map((it) => it.str).join(" ");
    textoCompleto += textoPagina + "\n";
  }
  try { doc.destroy && doc.destroy(); } catch (e) { /* no crítico */ }

  if (!textoCompleto.trim()) {
    throw new Error("No se pudo leer texto de este PDF — puede ser una imagen escaneada sin texto real adentro.");
  }
  return textoCompleto.trim();
}
