import { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { fmtNoteDayTime, tagColor } from "../../utils/helpers";
import { exportReciboPdf } from "../../utils/pdfExport";
import { waitForFontsReady } from "../../utils/printReady";

export function NotePrintModal({ note, onClose }) {
  // "recibo" (digital) es el default: pensado para leerse en pantalla o
  // mandarse por WhatsApp, sin pasar por el diálogo de impresión.
  const [printFormat, setPrintFormat] = useState("recibo");
  const [pendingPrint, setPendingPrint] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const printableRef = useRef(null);

  // Igual que en ReportModal: "Imprimir" cambia el formato Y recién en el
  // próximo frame dispara window.print(), después de esperar a que las
  // fuentes web hayan cargado de verdad (si no, en móvil puede salir con
  // una serif del sistema en vez de Space Grotesk/Inter).
  useEffect(() => {
    if (pendingPrint && printFormat === "carta") {
      let cancelled = false;
      const raf = requestAnimationFrame(async () => {
        await waitForFontsReady();
        if (!cancelled) { window.print(); setPendingPrint(false); }
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); };
    }
  }, [pendingPrint, printFormat]);

  async function goDigital() {
    setDownloadError("");
    setPrintFormat("recibo");
    setDownloading(true);
    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const safeName = ["publiBe", note.titulo || "Nota"].join(" - ").replace(/[\\/:*?"<>|]/g, "");
      await exportReciboPdf(printableRef.current, safeName);
    } catch (e) {
      setDownloadError("No se pudo generar el PDF: " + (e && e.message ? e.message : e));
    } finally {
      setDownloading(false);
    }
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

        <div ref={printableRef} className={"report-printable note-printable" + (printFormat === "carta" ? " format-carta" : " format-recibo")}>
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

        {downloadError && <div className="form-error no-print"><AlertTriangle size={13} /> {downloadError}</div>}

        <div className="modal-footer modal-footer-row no-print">
          <button type="button" className="btn-secondary" onClick={goDigital} disabled={downloading}>
            <Smartphone size={14} /> {downloading ? "Generando…" : "Digital"}
          </button>
          <button type="button" className="btn-primary" onClick={goImprimir}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    </Overlay>
  );
}
