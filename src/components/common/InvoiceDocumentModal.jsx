import { useState, useEffect, useRef } from "react";
import { X, Printer, AlertTriangle } from "lucide-react";
import { Overlay } from "./Overlay";
import { PrintBrandLogo } from "./PrintBrandLogo";
import { ClientLogo } from "./ClientLogo";
import { waitForFontsReady } from "../../utils/printReady";
import { fmtMonto, fmtDate } from "../../utils/helpers";

/**
 * Documento imprimible compartido por Recibos de cliente y Nómina — mismo
 * mecanismo de impresión que ReportModal (mismo estado printFormat/
 * printHidden, mismo goImprimir, mismo afterprint), a propósito NO
 * reinventado: esos problemas (salto de tamaño, logo invisible, página en
 * blanco) ya se resolvieron ahí, con evidencia real.
 *
 * `variant`: "factura" | "nomina" — controla la etiqueta del destinatario
 * ("DIRIGIDO A" vs "PAGO A") y si se muestra el bloque de conversión a
 * bolívares (solo nómina).
 *
 * A diferencia de la primera versión, esta usa el color de marca del
 * cliente de verdad (no solo el logo) en el encabezado, la tabla de
 * ítems y el total — a pedido de Diego, que lo veía "muy plano" con todo
 * en negro sobre blanco.
 */
export function InvoiceDocumentModal({
  variant = "factura",
  titulo,
  numero,
  fechaDesde,
  fechaHasta,
  destinatarioNombre,
  destinatarioSub,
  clientLogo,
  accentColor,
  items = [],
  total,
  extraLinea, // { label, monto } — ej. "Extra/Abono" en nómina
  ajuste, // { label, monto } — descuento (monto negativo) o IVA/recargo (positivo), opcional
  bsInfo, // { montoBs, tasa } — conversión a bolívares, solo nómina
  referencia, // "REF. 8294", opcional
  fechaPago, // campo "FECHA" aparte del rango, opcional (nómina)
  paymentInfo = [],
  notaAlPie,
  onClose,
}) {
  const [pendingPrint, setPendingPrint] = useState(false);
  const [printHidden, setPrintHidden] = useState(false);
  const printableRef = useRef(null);
  const destinatarioTitulo = variant === "nomina" ? "PAGO A" : "DIRIGIDO A";
  const color = accentColor || clientLogo?.color || "#1D3557";

  useEffect(() => {
    if (pendingPrint) {
      let cancelled = false;
      const raf = requestAnimationFrame(async () => {
        await waitForFontsReady();
        if (!cancelled) { window.print(); setPendingPrint(false); }
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); };
    }
  }, [pendingPrint]);

  useEffect(() => {
    function handleAfterPrint() { setPrintHidden(false); }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  function goImprimir() {
    setPendingPrint(true);
    setPrintHidden(true);
    setTimeout(() => setPrintHidden(false), 4000);
  }

  const totalItems = items.reduce((s, it) => s + Number(it.monto || 0), 0);
  const totalFinal = total ?? (totalItems + Number(extraLinea?.monto || 0) + Number(ajuste?.monto || 0));

  return (
    <Overlay onClose={onClose}>
      <div
        className={"modal small report-modal format-carta-outer" + (printHidden ? " print-pending-hide" : "")}
        style={{ "--primary": color }}
      >
        <div className="modal-head no-print">
          <h3>{titulo}</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div ref={printableRef} className="report-printable format-carta invoice-doc">
          <div className="invoice-doc-topbar" />
          <div className="report-header">
            <div className="report-header-logos">
              <PrintBrandLogo />
              {clientLogo && <ClientLogo client={clientLogo} maxHeight={44} className="report-client-logo" />}
            </div>
            <h2>{titulo}</h2>
            <div className="invoice-doc-meta-row">
              <span className="invoice-doc-numero">N° {numero}</span>
              {fechaDesde && fechaHasta && (
                <span className="report-meta">Del {fmtDate(fechaDesde)} al {fmtDate(fechaHasta)}</span>
              )}
            </div>
          </div>

          <div className="invoice-doc-to">
            <span className="invoice-doc-to-label">{destinatarioTitulo}:</span>
            <span className="invoice-doc-to-name">{destinatarioNombre}</span>
            {destinatarioSub && <span className="invoice-doc-to-sub">{destinatarioSub}</span>}
          </div>

          <div className="invoice-doc-table">
            <div className="invoice-doc-table-head">
              <span>Descripción</span>
              <span>Total</span>
            </div>
            {items.map((it) => (
              <div key={it.id}>
                <div className="invoice-doc-row">
                  <span className="invoice-doc-row-desc">{it.descripcion}</span>
                  <span className="invoice-doc-row-monto">{fmtMonto(it.monto)}</span>
                </div>
                {(it.subitems || []).length > 0 && (
                  <div className="invoice-doc-subrows">
                    {it.subitems.map((si) => (
                      <div className="invoice-doc-subrow" key={si.id}>
                        <span>{si.descripcion}</span>
                        <span>{fmtMonto(si.monto)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {extraLinea && Number(extraLinea.monto) > 0 && (
              <div className="invoice-doc-row">
                <span className="invoice-doc-row-desc">{extraLinea.label || "Extra/Abono"}</span>
                <span className="invoice-doc-row-monto">{fmtMonto(extraLinea.monto)}</span>
              </div>
            )}
          </div>

          {ajuste && Number(ajuste.monto) !== 0 && (
            <div className="invoice-doc-row invoice-doc-ajuste">
              <span className="invoice-doc-row-desc">{ajuste.label || (Number(ajuste.monto) < 0 ? "Descuento" : "IVA / recargo")}</span>
              <span className="invoice-doc-row-monto">{Number(ajuste.monto) > 0 ? "+" : "−"}{fmtMonto(Math.abs(ajuste.monto))}</span>
            </div>
          )}

          <div className="invoice-doc-total-box">
            <span>Total</span>
            <b>{fmtMonto(totalFinal)}</b>
          </div>

          {bsInfo && bsInfo.tasa > 0 && (
            <div className="invoice-doc-bs">
              <span>Equivalente en bolívares (Tasa BCV 1 × {bsInfo.tasa})</span>
              <b>{Number(totalFinal * bsInfo.tasa).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs</b>
            </div>
          )}
          {referencia && <div className="invoice-doc-ref">Ref. {referencia}</div>}
          {fechaPago && <div className="invoice-doc-ref">Fecha de pago: {fmtDate(fechaPago)}</div>}

          {paymentInfo.length > 0 && (
            <div className="invoice-doc-payment-box">
              <div className="report-extra-title">Información de pago</div>
              <div className="invoice-doc-payment">
                {paymentInfo.map((it) => (
                  <div className="invoice-doc-payment-row" key={it.id}>
                    <b>{it.label}</b> — {it.valor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {notaAlPie && <div className="invoice-doc-footnote">{notaAlPie}</div>}
        </div>

        <div className="modal-footer modal-footer-row no-print">
          <button type="button" className="btn-primary" onClick={goImprimir}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    </Overlay>
  );
}
