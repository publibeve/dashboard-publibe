/**
 * Muestra el logo SVG de una empresa (si tiene uno cargado) — a color tal
 * cual en fondos claros, o convertido a silueta blanca en fondos oscuros
 * vía `filter: brightness(0) invert(1)`, sin necesitar un segundo archivo.
 * La decisión de qué fondo hay en cada lugar SIEMPRE la da quien usa este
 * componente (prop `dark`) — nunca se intenta adivinar en tiempo real, ya
 * que los fondos donde esto se usa (colores propios de la app, o el color
 * de marca de la empresa) ya se conocen de antemano en el código.
 *
 * Si la empresa no tiene logo cargado, no renderiza nada — quien lo usa
 * decide el respaldo (ícono, texto, lo que corresponda en ese lugar).
 */
export function ClientLogo({ client, dark = false, className = "", maxWidth, maxHeight }) {
  if (!client || !client.logoSvg) return null;
  return (
    <div
      className={"client-logo" + (dark ? " client-logo-dark" : "") + (className ? " " + className : "")}
      style={{ maxWidth, maxHeight }}
      dangerouslySetInnerHTML={{ __html: client.logoSvg }}
    />
  );
}
