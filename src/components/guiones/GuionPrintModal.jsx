import { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { exportReciboPdf } from "../../utils/pdfExport";
import { waitForFontsReady } from "../../utils/printReady";

/**
 * Reusa exactamente la misma plantilla/infraestructura que Pagos y Notas
 * (.report-printable, waitForFontsReady, exportReciboPdf) — nada de esto se
 * reconstruye de cero, así que hereda automáticamente el fix del bug de
 * tipografía en móvil (ver printReady.js) sin tener que repetirlo acá.
 */
export function GuionPrintModal({ guion, onClose }) {
  const [printFormat, setPrintFormat] = useState("recibo");
  const [pendingPrint, setPendingPrint] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const printableRef = useRef(null);
  const tomas = guion.tomas || [];

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
      const safeName = ["publiBe", "Guion", guion.titulo].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]/g, "");
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
          <h3>Imprimir guion</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div ref={printableRef} className={"report-printable guion-printable" + (printFormat === "carta" ? " format-carta" : " format-recibo")}>
          <div className="report-header">
            <div className="report-brand">publi<span className="brand-b">B</span>e</div>
            <div className="report-brand-sub">agencia gráfica</div>
            <h2>{guion.titulo || "Guion sin título"}</h2>
            {guion.empresa && <div className="report-meta">{guion.empresa}</div>}
            {guion.duracionEstimada && <div className="report-meta">Duración estimada: {guion.duracionEstimada}</div>}
          </div>

          {tomas.length === 0 ? (
            <div className="report-empty">Este guion todavía no tiene tomas.</div>
          ) : (
            <div className="guion-print-tomas">
              {tomas.map((t, i) => (
                <div className={"guion-print-toma" + (t.grabada ? " guion-print-toma-grabada" : "")} key={t.id}>
                  <div className="guion-print-toma-head">
                    <b>Toma {i + 1}</b>
                    {t.grabada && <span className="guion-print-grabada-tag"><CheckCircle2 size={11} /> Grabada</span>}
                    {t.planoLugar && <span>{t.planoLugar}</span>}
                  </div>
                  {t.queSeRealiza && (
                    <div className="guion-print-toma-field">
                      <span>Qué se realiza:</span>
                      <div dangerouslySetInnerHTML={{ __html: t.queSeRealiza }} />
                    </div>
                  )}
                  {t.vozTexto && (
                    <div className="guion-print-toma-field">
                      <span>Voz/texto:</span>
                      <div dangerouslySetInnerHTML={{ __html: t.vozTexto }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
