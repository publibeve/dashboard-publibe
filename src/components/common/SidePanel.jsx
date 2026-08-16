import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Caparazón compartido para paneles flotantes tipo "chat" — Gemini y
 * Comentarios son el mismo tipo de elemento (panel fijo en la esquina,
 * con su propia lista de mensajes y una caja para escribir abajo), así
 * que comparten la MISMA base responsive en vez de que cada uno resuelva
 * "cómo no salirse de la pantalla en el celular" por su cuenta.
 *
 * Antes de este refactor, el panel de Comentarios (TaskChatPanel) se
 * posicionaba con JavaScript, anclado al botón que lo abría, con un
 * ancho fijo en píxeles — sin ningún ajuste para pantallas angostas. El
 * de Gemini (AIChatPanel) ya tenía la solución correcta: posición fija
 * en la esquina, con una regla aparte en móvil que lo estira de borde a
 * borde. Ese es el criterio que gana acá.
 *
 * Portal a document.body a propósito — el modal que lo contiene tiene
 * transform/backdrop-filter, cualquiera de las dos convierte a `.modal`
 * en el "contenedor" de un position:fixed de adentro, lo cual rompe el
 * posicionamiento respecto a la PANTALLA que este panel necesita.
 */
export function SidePanel({ title, icon: Icon, onClose, headerActions, className, style, children }) {
  return createPortal(
    <div className={"side-panel" + (className ? " " + className : "")} style={style}>
      <div className="side-panel-head">
        <span className="side-panel-title">{Icon && <Icon size={15} />} {title}</span>
        <div className="side-panel-head-actions">
          {headerActions}
          <button type="button" className="icon-btn subtle" onClick={onClose}><X size={16} /></button>
        </div>
      </div>
      <div className="side-panel-body">{children}</div>
    </div>,
    document.body
  );
}
