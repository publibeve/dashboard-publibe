import { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { waitForFontsReady } from "../../utils/printReady";
import { bloqueLabelTipo, bloqueLabelCompleto } from "../../utils/helpers";

/**
 * Reusa exactamente la misma plantilla/infraestructura que Pagos y Notas
 * (.report-printable, waitForFontsReady) — nada de esto se reconstruye de
 * cero, así que hereda automáticamente el fix del bug de tipografía en
 * móvil sin tener que repetirlo acá.
 *
 * Por ahora, solo "Imprimir" (carta) — el formato Digital se retira de este
 * módulo hasta la próxima ronda (no estaba funcionando bien acá).
 */
export function GuionPrintModal({ guion, onClose }) {
  const [pendingPrint, setPendingPrint] = useState(false);
  const printableRef = useRef(null);
  const bloques = guion.bloques || [];

  useEffect(() => {
    if (!pendingPrint) return;
    let cancelled = false;
    const raf = requestAnimationFrame(async () => {
      await waitForFontsReady();
      if (!cancelled) { window.print(); setPendingPrint(false); }
    });
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [pendingPrint]);

  return (
    <Overlay onClose={onClose}>
      <div className="modal small report-modal format-carta-outer">
        <div className="modal-head no-print">
          <h3>Imprimir guion</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div ref={printableRef} className="report-printable guion-printable format-carta">
          <div className="report-header">
            <div className="report-brand">publi<span className="brand-b">B</span>e</div>
            <div className="report-brand-sub">agencia gráfica</div>
            <h2>{guion.titulo || "Guion sin título"}</h2>
            {guion.empresa && <div className="report-meta">{guion.empresa}</div>}
            {guion.duracionEstimada && <div className="report-meta">Duración estimada: {guion.duracionEstimada}</div>}
          </div>

          {bloques.length === 0 ? (
            <div className="report-empty">Este guion todavía no tiene bloques.</div>
          ) : (
            <div className="guion-print-tomas">
              {bloques.map((b, i) => (
                <div className={"guion-print-toma" + (b.completo ? " guion-print-toma-grabada" : "")} key={b.id}>
                  <div className="guion-print-toma-head">
                    <b>{bloqueLabelTipo(b.tipo)} {i + 1}</b>
                    {b.completo && <span className="guion-print-grabada-tag"><CheckCircle2 size={11} /> {bloqueLabelCompleto(b.tipo)}</span>}
                    {b.planoLugar && <span>{b.planoLugar}</span>}
                  </div>
                  {b.queSeRealiza && (
                    <div className="guion-print-toma-field">
                      <span>Qué se realiza:</span>
                      <div dangerouslySetInnerHTML={{ __html: b.queSeRealiza }} />
                    </div>
                  )}
                  {b.vozTexto && (
                    <div className="guion-print-toma-field">
                      <span>{b.tipo === "toma" ? "Voz/texto:" : "Texto de la voz en off:"}</span>
                      <div dangerouslySetInnerHTML={{ __html: b.vozTexto }} />
                    </div>
                  )}
                  {b.linkReferencia && (
                    <div className="guion-print-toma-field">
                      <span>Link de referencia:</span>
                      <div>{b.linkReferencia}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer modal-footer-row no-print">
          <button type="button" className="btn-primary" onClick={() => setPendingPrint(true)}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    </Overlay>
  );
}
