import { useState, useEffect } from "react";
import {
  X,
  Printer,
  Smartphone,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { fmtNoteDayTime, tagColor } from "../../utils/helpers";

export function NotePrintModal({ note, onClose }) {
  // "recibo" (digital) es el default: pensado para leerse en pantalla o
  // mandarse por WhatsApp, sin pasar por el diálogo de impresión.
  const [printFormat, setPrintFormat] = useState("recibo");
  const [pendingPrint, setPendingPrint] = useState(false);

  // Igual que en ReportModal: "Imprimir" cambia el formato Y recién en el
  // próximo frame dispara window.print(), para asegurarse de que el
  // navegador ya pintó el layout de carta antes de abrir el diálogo.
  useEffect(() => {
    if (pendingPrint && printFormat === "carta") {
      const raf = requestAnimationFrame(() => { window.print(); setPendingPrint(false); });
      return () => cancelAnimationFrame(raf);
    }
  }, [pendingPrint, printFormat]);

  function goDigital() {
    setPrintFormat("recibo");
  }
  function goImprimir() {
    setPrintFormat("carta");
    setPendingPrint(true);
  }

  return (
    <Overlay onClose={onClose}>
      <div className={"modal small report-modal" + (printFormat === "carta" ? " format-carta-outer" : "")}>
        <div className="modal-head no-print">
          <h3>Imprimir nota</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className={"report-printable note-printable" + (printFormat === "carta" ? " format-carta" : " format-recibo")}>
          <div className="report-header">
            <div className="report-brand">publi<span className="brand-b">B</span>e</div>
            <div className="report-brand-sub">agencia gráfica</div>
            <h2>{note.titulo || "Nota sin título"}</h2>
            {note.empresa && <div className="report-meta">{note.empresa}</div>}
            {note.createdAt && <div className="report-meta">{fmtNoteDayTime(note.createdAt)}</div>}
          </div>

          {(note.tags || []).length > 0 && (
            <div className="note-print-tags">
              {note.tags.map((t) => (
                <span key={t} className="note-tag-chip" style={{ color: tagColor(t), background: tagColor(t) + "18" }}>{t}</span>
              ))}
            </div>
          )}

          <div className="note-print-body note-preview-html" dangerouslySetInnerHTML={{ __html: note.cuerpo || "<p><i>Nota vacía.</i></p>" }} />
        </div>

        <div className="modal-footer modal-footer-row no-print">
          <button type="button" className="btn-secondary" onClick={goDigital}>
            <Smartphone size={14} /> Digital
          </button>
          <button type="button" className="btn-primary" onClick={goImprimir}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    </Overlay>
  );
}
