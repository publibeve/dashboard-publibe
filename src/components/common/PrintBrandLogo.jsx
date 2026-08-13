import publibeLogoSvg from "../../assets/publibe-logo.svg?raw";

/**
 * El logo real de la marca (texto convertido a paths vectoriales, con el
 * degradado multicolor real de la B) para usar en cualquier plantilla de
 * impresión — Guiones, reportes de Pagos, facturas, etc.
 *
 * Se inserta como SVG embebido en el propio HTML (no una imagen `<img>`
 * externa, y no un color plano de respaldo) a propósito: así siempre
 * aparece igual, sin depender de que el navegador imprima fondos, sin
 * ninguna carga de red de por medio (nada que timing pueda arruinar en una
 * captura con html2canvas), y sin el fallback de color sólido que se había
 * armado antes para cuando `background-clip: text` no imprimía la B.
 */
export function PrintBrandLogo({ className = "report-brand-logo" }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: publibeLogoSvg }} />;
}
