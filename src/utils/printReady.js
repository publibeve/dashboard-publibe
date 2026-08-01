/**
 * Espera a que las fuentes web (Space Grotesk/Inter, cargadas vía @import
 * en index.css) terminen de cargar de verdad antes de disparar cualquier
 * flujo de impresión o generación de documento — mismo patrón que ya se usa
 * para esperar el pintado real del overlay en la transición del login
 * (ahí con doble requestAnimationFrame; acá con la API que existe
 * específicamente para esto: document.fonts.ready).
 *
 * Causa del bug que esto evita: en móvil, si se dispara window.print() (o
 * se captura el DOM con html2canvas) ANTES de que la fuente haya terminado
 * de descargarse, el motor de impresión cae a su serif por defecto del
 * sistema (tipo Times New Roman) en vez de Space Grotesk/Inter — pasa sobre
 * todo en móvil porque ahí la descarga de la fuente suele ir más lenta y el
 * usuario dispara "Imprimir" casi al instante de abrir la vista previa.
 *
 * Se usa desde CUALQUIER flujo de impresión/exportación de la app (Pagos,
 * Notas, y el que se construya después para Guiones) — un solo lugar, para
 * no tener que acordarse de repetir este `await` en cada módulo nuevo.
 */
export async function waitForFontsReady() {
  if (typeof document === "undefined" || !document.fonts || !document.fonts.ready) return;
  try {
    await document.fonts.ready;
  } catch (e) {
    // Si el navegador tiene algún problema puntual con esta API, seguimos
    // igual — es una espera de robustez, no algo que deba trabar la
    // impresión si falla por algún motivo raro.
  }
}
