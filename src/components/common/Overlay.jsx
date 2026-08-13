
import { createPortal } from "react-dom";

export function Overlay({ onClose, children }) {
  // Portal a document.body a propósito: si no, el modal queda anidado
  // donde sea que se lo llame (adentro de .app), y cualquier cosa que
  // necesite ocultar SOLO el resto del dashboard (como el print de
  // reportes, que oculta .app entero para no arrastrar páginas en blanco)
  // se lleva puesto al modal también, porque técnicamente sigue siendo su
  // descendiente. Con el portal, el modal es un hermano real de .app en el
  // DOM — nunca lo afecta lo que le pase a .app.
  return createPortal(
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>,
    document.body
  );
}
