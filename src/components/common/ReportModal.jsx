import { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Copy,
  Printer,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { Overlay } from "./Overlay";
import { PrintBrandLogo } from "./PrintBrandLogo";
import { waitForFontsReady } from "../../utils/printReady";
import { exportReciboPdf } from "../../utils/pdfExport";

export function ReportModal({ title, empresaLabel, dateRangeLabel, groups, totalLabel, total, emptyText, onClose, showDigital = true }) {
  const [copied, setCopied] = useState(false);
  // "recibo" (digital) es el default: es el formato pensado para leerse en
  // pantalla / mandarse por WhatsApp, y no requiere ninguna acción extra
  // para verse — a diferencia de "carta", que solo tiene sentido en el
  // instante de imprimir.
  const [printFormat, setPrintFormat] = useState("recibo");
  const [pendingPrint, setPendingPrint] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const printableRef = useRef(null);

  // "Imprimir" fuerza el formato carta y ADEMÁS dispara window.print() — pero
  // recién en el próximo frame, para asegurarse de que el navegador ya pintó
  // el layout de carta antes de abrir el diálogo de impresión (si se llama
  // print() en el mismo instante que el cambio de estado, se arriesga a
  // imprimir todavía con el formato anterior). Además espera a que las
  // fuentes web hayan terminado de cargar de verdad — si no, en móvil el
  // motor de impresión puede caer a una serif del sistema en vez de
  // Space Grotesk/Inter.
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

  function buildText() {
    let text = `publiBe — ${title}\n`;
    if (empresaLabel) text += `${empresaLabel}\n`;
    if (dateRangeLabel) text += `${dateRangeLabel}\n`;
    text += `\n`;
    groups.forEach((g) => {
      text += `${g.label}: ${g.value}\n`;
      (g.items || []).forEach((it) => { text += `   • ${it.label}${it.value ? ": " + it.value : ""}\n`; });
    });
    text += `\n${totalLabel}: ${total}`;
    return text;
  }

  function handleCopy() {
    const text = buildText();
    const showCopied = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };
    function fallbackCopy() {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed"; ta.style.left = "-9999px"; ta.style.top = "0";
        document.body.appendChild(ta); ta.focus(); ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) showCopied();
      } catch (e) { /* no se pudo copiar */ }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  // Dos acciones totalmente independientes, sin lógica compartida entre
  // ambas: "Digital" genera y descarga un PDF con el layout angosto de
  // recibo (nunca pasa por window.print(), así que no hereda ningún tamaño
  // de página fijo); "Imprimir" cambia el formato Y dispara el diálogo de
  // impresión del navegador, en carta.
  async function goDigital() {
    setDownloadError("");
    setPrintFormat("recibo");
    setDownloading(true);
    try {
      // Doble frame: si el formato todavía estaba en "carta", hay que
      // esperar a que el navegador pinte el layout angosto antes de
      // capturarlo — si no, el PDF podría salir con el layout viejo.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const safeName = ["publiBe", title, empresaLabel].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]/g, "");
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
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div ref={printableRef} className={"report-printable" + (printFormat === "carta" ? " format-carta" : " format-recibo")}>
          <div className="report-header">
            <PrintBrandLogo />
            <h2>{title}</h2>
            {empresaLabel && <div className="report-meta">{empresaLabel}</div>}
            {dateRangeLabel && <div className="report-meta">{dateRangeLabel}</div>}
          </div>

          {groups.length === 0 ? (
            <div className="report-empty">{emptyText || "No hay información en ese rango."}</div>
          ) : (
            <div className="report-groups">
              {groups.map((g, i) => (
                <div className="report-group" key={i}>
                  <div className="report-group-head">
                    <span>{g.label}</span>
                    {g.value && <b>{g.value}</b>}
                  </div>
                  {(g.items || []).length > 0 && (
                    <div className="report-group-items">
                      {g.items.map((it, j) => (
                        <div className="report-item" key={j}>
                          <span>{it.label}</span>
                          {it.value && <b>{it.value}</b>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="report-total">
            <span>{totalLabel}</span>
            <b>{total}</b>
          </div>
        </div>

        {downloadError && <div className="form-error no-print"><AlertTriangle size={13} /> {downloadError}</div>}

        <div className="modal-footer modal-footer-row no-print">
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            {copied ? <><Check size={14} /> ¡Copiado!</> : <><Copy size={14} /> Copiar resumen</>}
          </button>
          {showDigital && (
            <button type="button" className="btn-secondary" onClick={goDigital} disabled={downloading}>
              <Smartphone size={14} /> {downloading ? "Generando…" : "Digital"}
            </button>
          )}
          <button type="button" className="btn-primary" onClick={goImprimir}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    </Overlay>
  );
}
