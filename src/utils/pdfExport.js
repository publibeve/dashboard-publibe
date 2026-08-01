import { waitForFontsReady } from "./printReady";

/**
 * Genera y descarga un PDF a partir del recibo digital tal como está
 * renderizado en pantalla en ESE momento (el layout angosto tipo teléfono
 * que ya se ve en la vista previa) — NO pasa por window.print(), así que no
 * hereda ningún tamaño de página fijo (carta/A4). El PDF resultante tiene
 * una sola página, con el ancho y el alto exactos del contenido real (un
 * recibo largo y angosto, sin cortes de página), lista para adjuntar en
 * WhatsApp o donde sea.
 *
 * @param {HTMLElement} el - el nodo del recibo (".report-printable"), YA
 *   renderizado en formato "recibo" (angosto) al momento de llamar esto.
 * @param {string} filename - nombre del archivo, sin extensión.
 */
export async function exportReciboPdf(el, filename) {
  if (!el) throw new Error("No se encontró el contenido del recibo para exportar.");
  // Mismo motivo que en window.print(): si html2canvas captura el DOM antes
  // de que la fuente web haya cargado de verdad, el PDF sale con una serif
  // del sistema en vez de Space Grotesk/Inter — pasa sobre todo en móvil.
  await waitForFontsReady();

  // Import bajo demanda: html2pdf.js empaqueta html2canvas + jsPDF, que
  // pesan bastante — cargarlo solo al tocar "Digital" evita que toda la app
  // arrastre ese peso desde el arranque para una función que se usa
  // ocasionalmente.
  const { default: html2pdf } = await import("html2pdf.js");

  // Medidas reales del contenido renderizado (incluye todo el alto, aunque
  // no entre en el viewport) — esto es lo que fija el tamaño de página del
  // PDF, en vez de un tamaño de papel estándar.
  const width = Math.ceil(el.scrollWidth);
  const height = Math.ceil(el.scrollHeight);

  await html2pdf()
    .set({
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2, // nitidez para pantallas de celular (retina)
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: width,
        // html2canvas no sabe renderizar texto con degradado vía
        // background-clip:text (lo convierte en una mancha de color). El
        // respaldo de @media print no aplica acá: html2canvas captura el DOM
        // como se ve en pantalla (screen), nunca dispara reglas de print.
        // Por eso el cambio se hace en el CLON del DOM que html2canvas usa
        // internamente para renderizar — la B pasa a azul marino sólido
        // SOLO en el PDF; en pantalla nunca deja de verse el degradado.
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll(".brand-b").forEach((b) => {
            b.style.background = "none";
            b.style.webkitBackgroundClip = "initial";
            b.style.backgroundClip = "initial";
            b.style.color = "#1D3557"; // --primary, azul marino de la marca
            b.style.webkitTextFillColor = "#1D3557";
          });
        },
      },
      // Página única, ancho/alto exactos del contenido — sin esto, html2pdf
      // usa A4 por default y pagina el recibo en varias hojas.
      jsPDF: { unit: "px", format: [width, height], orientation: "portrait" },
      pagebreak: { mode: ["avoid-all"] },
    })
    .from(el)
    .save();
}
