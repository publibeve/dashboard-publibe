import { useState } from "react";
import {
  X,
  Check,
  Copy,
  Printer,
} from "lucide-react";
import { Overlay } from "./Overlay";

export function PrintFormatToggle({ value, onChange }) {
  return (
    <div className="print-format-toggle no-print">
      <button type="button" className={value === "recibo" ? "active" : ""} onClick={() => onChange("recibo")}>Recibo (digital)</button>
      <button type="button" className={value === "carta" ? "active" : ""} onClick={() => onChange("carta")}>Hoja carta (imprimir)</button>
    </div>
  );
}

export function ReportModal({ title, empresaLabel, dateRangeLabel, groups, totalLabel, total, emptyText, onClose }) {
  const [copied, setCopied] = useState(false);
  const [printFormat, setPrintFormat] = useState("recibo");

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

  return (
    <Overlay onClose={onClose}>
      <div className={"modal small report-modal" + (printFormat === "carta" ? " format-carta-outer" : "")}>
        <div className="modal-head no-print">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <PrintFormatToggle value={printFormat} onChange={setPrintFormat} />

        <div className={"report-printable" + (printFormat === "carta" ? " format-carta" : " format-recibo")}>
          <div className="report-header">
            <div className="report-brand">publi<span className="brand-b">B</span>e</div>
            <div className="report-brand-sub">agencia gráfica</div>
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

        <div className="modal-footer modal-footer-row no-print">
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            {copied ? <><Check size={14} /> ¡Copiado!</> : <><Copy size={14} /> Copiar resumen</>}
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <Printer size={14} /> Imprimir / Guardar PDF
          </button>
        </div>
      </div>
    </Overlay>
  );
}
