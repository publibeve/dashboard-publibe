import { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Save,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  LayoutTemplate,
} from "lucide-react";
import { Overlay } from "./Overlay";
import { PrintBrandLogo } from "./PrintBrandLogo";
import { ClientLogo } from "./ClientLogo";
import { CustomSelect } from "./CustomSelect";
import { CustomDatePicker } from "./CustomDatePicker";
import { waitForFontsReady } from "../../utils/printReady";
import { fmtMonto, fmtDate, todayISO, uid, clientMeta } from "../../utils/helpers";
import { CLIENTES } from "../../utils/constants";
import { nextInvoiceNumber, peekInvoiceNumber, nextNominaNumber, peekNominaNumber } from "../../services/billing.service";
import { templatesForClient } from "../../services/itemTemplates.service";

/** Ajusta la altura de un textarea a su contenido real — sin esto, una
 * descripción larga que se parte en 2 líneas queda recortada arriba
 * (la caja se queda en 1 línea de alto mientras el texto intenta ocupar 2). */
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

/**
 * El recibo/factura ES el formulario — a pedido explícito de Diego: "que
 * literal sea la factura tal cual... editable ahí mismo, como editando una
 * hoja de Word". No hay un formulario aparte que después arma una vista
 * previa distinta — lo que ves acá es exactamente lo que se va a imprimir,
 * con inputs en vez de texto fijo donde hace falta cargar datos.
 *
 * Mismo mecanismo de impresión que ya está resuelto y probado
 * (InvoiceDocumentModal/ReportModal) — no se reinventa nada de eso acá,
 * solo se le suma la edición en el lugar.
 *
 * `variant`: "factura" | "nomina" — Diego pidió armar Facturas primero y
 * usarla de base para Nómina, así que las diferencias entre las dos
 * (DIRIGIDO A vs PAGO A, el bloque de bolívares, referencia, fecha de
 * pago) están todas acá, activadas por este prop — un solo componente
 * para las dos, no dos por separado.
 */
export function InvoiceLiveEditor({
  variant = "factura",
  existing, // objeto existente si se está editando, null/undefined si es nuevo
  paymentInfo = [],
  itemTemplates = [],
  onClose,
  onSave, // (documento, { imprimir }) => Promise
  onDelete, // (id) => void — solo aplica editando uno existente
}) {
  const esNomina = variant === "nomina";
  const [empresa, setEmpresa] = useState(existing?.empresa || "");
  const [nombreLibre, setNombreLibre] = useState(existing?.nombreCompleto || ""); // nómina: nombre de la persona
  const [rol, setRol] = useState(existing?.rol || "");
  const [razonSocialOverride, setRazonSocialOverride] = useState(existing?.razonSocialUsada || "");
  const [direccionOverride, setDireccionOverride] = useState(existing?.direccionUsada || "");
  const [numero, setNumero] = useState(existing?.numeroFactura || existing?.numeroRecibo || "");
  const [numeroEditadoAMano, setNumeroEditadoAMano] = useState(!!existing);
  const [numeroCargando, setNumeroCargando] = useState(!existing);
  const [abonos, setAbonos] = useState(existing?.abonos || []);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [archivos, setArchivos] = useState(existing?.archivos || []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(existing?.fechaEmision || existing?.periodoDesde || todayISO());
  const [fechaHasta, setFechaHasta] = useState(existing?.fechaVencimiento || existing?.periodoHasta || todayISO());
  const [fechaPago, setFechaPago] = useState(existing?.fechaPago || todayISO());
  const [items, setItems] = useState(existing?.items?.length ? existing.items : [{ id: uid(), descripcion: "", monto: 0, subitems: [] }]);
  const [ajusteLabel, setAjusteLabel] = useState(existing?.ajusteLabel || "");
  const [ajusteMonto, setAjusteMonto] = useState(existing?.ajusteMonto ?? "");
  const [referencia, setReferencia] = useState(existing?.referencia || "");
  const [tasaBcv, setTasaBcv] = useState(existing?.tasaBcv || "");
  const [notaAlPie, setNotaAlPie] = useState(existing?.notaAlPie || "");
  const [metodosSeleccionados, setMetodosSeleccionados] = useState(
    existing?.metodosPagoSeleccionados || paymentInfo.map((p) => p.id)
  );
  const [expandedId, setExpandedId] = useState(null);
  const [mostrarPlantillas, setMostrarPlantillas] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(null); // "guardar" | "imprimir" | null
  const [pendingPrint, setPendingPrint] = useState(false);
  const [printHidden, setPrintHidden] = useState(false);
  const printableRef = useRef(null);

  const cli = empresa ? clientMeta(empresa) : null;
  const color = cli?.color || "#1D3557";
  const destinatarioTitulo = esNomina ? "PAGO A" : "DIRIGIDO A";
  const destinatarioNombre = esNomina ? nombreLibre : (razonSocialOverride || cli?.razonSocial || empresa);
  const destinatarioSub = esNomina ? rol : (direccionOverride || cli?.direccionFiscal || "");

  // Numeración — SOLO espía al abrir (nunca gasta el contador), igual que
  // se corrigió la ronda pasada. El número real se pide recién al guardar.
  useEffect(() => {
    if (existing) return;
    let cancelled = false;
    const peek = esNomina ? peekNominaNumber : peekInvoiceNumber;
    peek().then((n) => { if (!cancelled) { setNumero(n); setNumeroCargando(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function addItem() {
    setItems((list) => [...list, { id: uid(), descripcion: "", monto: 0, subitems: [] }]);
  }
  function insertarPlantilla(t) {
    // Sub-ítems con id nuevo (no el de la plantilla, para que dos
    // facturas que usaron la misma plantilla no compartan referencias) y
    // monto en 0 — la plantilla trae la descripción fija, el precio se
    // completa cada vez porque varía mes a mes.
    const subitems = (t.subitems || []).map((s) => ({ id: uid(), descripcion: s.descripcion, monto: 0 }));
    setItems((list) => [...list, { id: uid(), descripcion: t.descripcion, monto: 0, subitems }]);
    setMostrarPlantillas(false);
  }
  function patchItem(id, patch) {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function removeItem(id) {
    setItems((list) => list.filter((it) => it.id !== id));
    if (expandedId === id) setExpandedId(null);
  }
  function addSubitem(itemId) {
    setItems((list) => list.map((it) => (it.id === itemId ? { ...it, subitems: [...(it.subitems || []), { id: uid(), descripcion: "", monto: 0 }] } : it)));
  }
  function patchSubitem(itemId, subId, patch) {
    setItems((list) => list.map((it) => {
      if (it.id !== itemId) return it;
      const subitems = it.subitems.map((si) => (si.id === subId ? { ...si, ...patch } : si));
      const sum = subitems.reduce((s, si) => s + Number(si.monto || 0), 0);
      return { ...it, subitems, monto: sum };
    }));
  }
  function removeSubitem(itemId, subId) {
    setItems((list) => list.map((it) => {
      if (it.id !== itemId) return it;
      const subitems = it.subitems.filter((si) => si.id !== subId);
      const monto = subitems.length > 0 ? subitems.reduce((s, si) => s + Number(si.monto || 0), 0) : it.monto;
      return { ...it, subitems, monto };
    }));
  }

  const plantillasDisponibles = esNomina ? [] : templatesForClient(itemTemplates, empresa);
  const totalItems = items.reduce((s, it) => s + Number(it.monto || 0), 0);
  const ajusteNum = Number(ajusteMonto || 0);
  const totalFinal = totalItems + ajusteNum;
  const totalBs = tasaBcv > 0 ? totalFinal * Number(tasaBcv) : 0;
  const abonado = abonos.reduce((s, a) => s + Number(a.monto || 0), 0);
  const saldo = totalFinal - abonado;

  function addAbono() {
    const n = Number(abonoMonto);
    if (!abonoMonto || isNaN(n) || n <= 0) return;
    setAbonos((list) => [...list, { id: uid(), fecha: todayISO(), monto: n }]);
    setAbonoMonto("");
  }
  function removeAbono(id) {
    setAbonos((list) => list.filter((a) => a.id !== id));
  }

  function validar() {
    if (esNomina) {
      if (!nombreLibre.trim()) return "Falta el nombre de quién recibe el pago.";
    } else {
      if (!empresa) return "Falta elegir el cliente.";
    }
    if (items.filter((it) => it.descripcion.trim() && Number(it.monto) > 0).length === 0) return "Agregá al menos un ítem con descripción y monto.";
    return "";
  }

  async function guardar(imprimir) {
    const msg = validar();
    if (msg) { setError(msg); return; }
    setError("");
    setGuardando(imprimir ? "imprimir" : "guardar");
    try {
      const itemsLimpios = items.filter((it) => it.descripcion.trim() && Number(it.monto) > 0);
      let numeroFinal = numero.trim();
      if (!numeroEditadoAMano) {
        numeroFinal = esNomina ? await nextNominaNumber() : await nextInvoiceNumber();
      }
      const base = esNomina ? {
        nombreCompleto: nombreLibre.trim(), rol: rol.trim(), numeroRecibo: numeroFinal,
        fechaPago, periodoDesde: fechaDesde, periodoHasta: fechaHasta,
        items: itemsLimpios, ajusteLabel: ajusteLabel.trim(), ajusteMonto: ajusteNum,
        referencia: referencia.trim(), tasaBcv: Number(tasaBcv || 0),
        concepto: nombreLibre.trim(), monto: totalFinal, categoria: "Nómina",
        archivos, metodosPagoSeleccionados: metodosSeleccionados,
      } : {
        empresa, numeroFactura: numeroFinal, fechaEmision: fechaDesde, fechaVencimiento: fechaHasta,
        items: itemsLimpios, ajusteLabel: ajusteLabel.trim(), ajusteMonto: ajusteNum,
        razonSocialUsada: razonSocialOverride.trim(), direccionUsada: direccionOverride.trim(),
        notaAlPie: notaAlPie.trim(), concepto: itemsLimpios.map((it) => it.descripcion).join(" · "), monto: totalFinal,
        abonos, archivos, metodosPagoSeleccionados: metodosSeleccionados,
      };
      const documento = { id: existing?.id || uid(), ...base, notaAlPie: notaAlPie.trim(), createdAt: existing?.createdAt || new Date().toISOString() };
      await onSave(documento, { imprimir });
      if (imprimir) {
        setPendingPrint(true);
        setPrintHidden(true);
        setTimeout(() => setPrintHidden(false), 4000);
      } else {
        onClose();
      }
    } catch (e) {
      setError("No se pudo guardar: " + (e && e.message ? e.message : e));
    } finally {
      setGuardando(null);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div
        className={"modal small report-modal format-carta-outer invoice-live-editor" + (printHidden ? " print-pending-hide" : "")}
        style={{ "--primary": color }}
      >
        <div className="modal-head no-print">
          <h3>{existing ? "Editar" : "Nuevo"} {esNomina ? "recibo de nómina" : "recibo"}</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error no-print"><AlertTriangle size={13} /> {error}</div>}

        <div ref={printableRef} className="report-printable format-carta invoice-doc">
          <div className="invoice-doc-topbar" />
          <div className="report-header">
            <div className="report-header-logos">
              <PrintBrandLogo />
              {cli?.logoSvg && <ClientLogo client={cli} maxHeight={44} className="report-client-logo" />}
            </div>
            <div className="invoice-doc-title-row">
              <h2>{esNomina ? "Recibo de nómina" : "Recibo"}</h2>
              <input
                className="invoice-doc-input invoice-doc-input-numero"
                value={numero} onChange={(e) => { setNumero(e.target.value); setNumeroEditadoAMano(true); }}
                placeholder={numeroCargando ? "…" : "00000"}
              />
            </div>
            <div className="invoice-doc-meta-row">
              <span className="report-meta invoice-doc-fecha-editable">
                Del <CustomDatePicker value={fechaDesde} onChange={setFechaDesde} /> al <CustomDatePicker value={fechaHasta} onChange={setFechaHasta} />
              </span>
            </div>
          </div>

          <div className="invoice-doc-to invoice-doc-to-editable">
            <span className="invoice-doc-to-label">{destinatarioTitulo}:</span>
            {esNomina ? (
              <>
                <input className="invoice-doc-input invoice-doc-input-name" value={nombreLibre} onChange={(e) => setNombreLibre(e.target.value)} placeholder="Nombre completo de quién recibe el pago" />
                <input className="invoice-doc-input invoice-doc-input-sub" value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Rol / cargo (opcional)" />
              </>
            ) : (
              <>
                <div className="invoice-doc-client-select no-print">
                  <CustomSelect
                    value={empresa}
                    onChange={(v) => {
                      setEmpresa(v);
                      const nuevoCli = clientMeta(v);
                      setRazonSocialOverride(nuevoCli?.razonSocial || v);
                      setDireccionOverride(nuevoCli?.direccionFiscal || "");
                    }}
                    placeholder="Elegí el cliente…"
                    options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
                  />
                </div>
                {empresa && (
                  <>
                    <input className="invoice-doc-input invoice-doc-input-name" value={razonSocialOverride} onChange={(e) => setRazonSocialOverride(e.target.value)} />
                    <textarea
                      rows={2} className="invoice-doc-input invoice-doc-input-sub"
                      value={direccionOverride} onChange={(e) => { setDireccionOverride(e.target.value); autoResize(e.target); }}
                      ref={(el) => el && autoResize(el)}
                      placeholder="Dirección fiscal (se puede precargar en Configuración de empresas)"
                    />
                  </>
                )}
              </>
            )}
          </div>

          <div className="invoice-doc-table">
            <div className="invoice-doc-table-head">
              <span>Descripción</span>
              <span>Total</span>
            </div>
            {items.map((it) => (
              <div key={it.id}>
                <div className="invoice-doc-row invoice-doc-row-editable">
                  <button type="button" className="icon-btn subtle no-print invoice-doc-expand-btn" onClick={() => setExpandedId(expandedId === it.id ? null : it.id)} title="Desglosar en sub-líneas">
                    {expandedId === it.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <textarea
                    rows={1} className="invoice-doc-input invoice-doc-row-desc-input"
                    value={it.descripcion}
                    onChange={(e) => { patchItem(it.id, { descripcion: e.target.value }); autoResize(e.target); }}
                    ref={(el) => el && autoResize(el)}
                    placeholder='Ej: "Gestión Social Media — Julio"'
                  />
                  <input
                    type="number" step="0.01" min="0" className="invoice-doc-input invoice-doc-row-monto-input"
                    value={it.monto} onChange={(e) => patchItem(it.id, { monto: Number(e.target.value) })}
                    disabled={(it.subitems || []).length > 0}
                  />
                  <button type="button" className="icon-btn subtle no-print" onClick={() => removeItem(it.id)}><Trash2 size={12} /></button>
                </div>
                {expandedId === it.id && (
                  <div className="invoice-doc-subrows invoice-doc-subrows-editable">
                    {(it.subitems || []).map((si) => (
                      <div className="invoice-doc-subrow invoice-doc-subrow-editable" key={si.id}>
                        <input className="invoice-doc-input" value={si.descripcion} onChange={(e) => patchSubitem(it.id, si.id, { descripcion: e.target.value })} placeholder="Ej: 5 imágenes" />
                        <input type="number" step="0.01" min="0" className="invoice-doc-input" value={si.monto} onChange={(e) => patchSubitem(it.id, si.id, { monto: Number(e.target.value) })} />
                        <button type="button" className="icon-btn subtle no-print" onClick={() => removeSubitem(it.id, si.id)}><X size={11} /></button>
                      </div>
                    ))}
                    <button type="button" className="btn-secondary no-print invoice-doc-add-sub-btn" onClick={() => addSubitem(it.id)}>
                      <Plus size={11} /> Sub-línea
                    </button>
                  </div>
                )}
              </div>
            ))}
            {/* Líneas en blanco de relleno — a propósito SÍ se imprimen
                (no llevan no-print): la idea es que la hoja se vea como
                una plantilla de tamaño constante, tenga 2 ítems cargados
                o 5, en vez de un recibo que cambia de alto según cuánto
                se llenó. Si ya hay 5 o más ítems reales, esto no agrega
                nada — nunca recorta contenido real, solo rellena cuando
                falta. */}
            {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
              <div className="invoice-doc-row invoice-doc-row-blank" key={`blank-${i}`} aria-hidden="true">
                <span>&nbsp;</span>
                <span>&nbsp;</span>
              </div>
            ))}
            {plantillasDisponibles.length > 0 && (
              <div className="invoice-doc-templates-control no-print">
                <button type="button" className="invoice-doc-add-item-btn" onClick={() => setMostrarPlantillas((v) => !v)}>
                  <LayoutTemplate size={13} /> Insertar plantilla
                </button>
                {mostrarPlantillas && (
                  <div className="invoice-doc-templates-menu">
                    {plantillasDisponibles.map((t) => (
                      <button type="button" className="invoice-doc-templates-menu-item" key={t.id} onClick={() => insertarPlantilla(t)}>
                        <span className="invoice-doc-templates-menu-nombre">{t.nombre}</span>
                        <span className="invoice-doc-templates-menu-desc">{t.descripcion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button type="button" className="invoice-doc-add-item-btn no-print" onClick={addItem}>
              <Plus size={13} /> Agregar ítem
            </button>
          </div>

          <div className="invoice-doc-row invoice-doc-ajuste invoice-doc-row-editable">
            <input className="invoice-doc-input" value={ajusteLabel} onChange={(e) => setAjusteLabel(e.target.value)} placeholder="Descuento / IVA (opcional)" />
            <input type="number" step="0.01" className="invoice-doc-input invoice-doc-row-monto-input" value={ajusteMonto} onChange={(e) => setAjusteMonto(e.target.value)} placeholder="+/- 0.00" />
          </div>

          <div className="invoice-doc-total-box">
            <span>Total</span>
            <b>{fmtMonto(totalFinal)}</b>
          </div>

          {esNomina && (
            <>
              <div className="invoice-doc-row invoice-doc-row-editable invoice-doc-bs-editable">
                <span>Tasa BCV (opcional, si se pagó en Bs)</span>
                <input type="number" step="0.01" className="invoice-doc-input invoice-doc-row-monto-input" value={tasaBcv} onChange={(e) => setTasaBcv(e.target.value)} placeholder="0.00" />
              </div>
              {totalBs > 0 && (
                <div className="invoice-doc-bs">
                  <span>Equivalente en bolívares (Tasa BCV 1 × {tasaBcv})</span>
                  <b>{totalBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs</b>
                </div>
              )}
              <label className="invoice-doc-ref-editable no-print">
                <span>Referencia del pago (opcional)</span>
                <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej: 8294" />
              </label>
              <label className="invoice-doc-ref-editable no-print">
                <span>Fecha del pago</span>
                <CustomDatePicker value={fechaPago} onChange={setFechaPago} />
              </label>
              {referencia && <div className="invoice-doc-ref only-print-value">Ref. {referencia}</div>}
              <div className="invoice-doc-ref only-print-value">Fecha de pago: {fmtDate(fechaPago)}</div>
            </>
          )}

          {paymentInfo.length > 0 && (
            <div className="invoice-doc-payment-box">
              <div className="report-extra-title">Información de pago</div>
              <div className="invoice-doc-payment">
                {paymentInfo.map((it) => {
                  const seleccionado = metodosSeleccionados.includes(it.id);
                  return (
                    <div className={"invoice-doc-payment-row" + (seleccionado ? "" : " invoice-doc-payment-row-excluded")} key={it.id}>
                      <label className="invoice-doc-payment-check no-print" title={seleccionado ? "Se imprime en este documento" : "No se imprime en este documento"}>
                        <input
                          type="checkbox" checked={seleccionado}
                          onChange={() => setMetodosSeleccionados((list) => (
                            seleccionado ? list.filter((id) => id !== it.id) : [...list, it.id]
                          ))}
                        />
                      </label>
                      <span><b>{it.label}</b> — {it.valor}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <textarea
            rows={2} className="invoice-doc-input invoice-doc-footnote-input"
            value={notaAlPie} onChange={(e) => { setNotaAlPie(e.target.value); autoResize(e.target); }}
            ref={(el) => el && autoResize(el)}
            placeholder='Nota al pie (opcional) — ej: "Desde el mes de marzo se implementó el uso de la IA…"'
          />
        </div>

        {/* Gestión — abonos, adjuntos, eliminar. Fuera de .report-printable
            a propósito: es información de seguimiento interno, no algo
            que tenga que salir en el papel. Solo aparece editando algo
            que ya existe — antes de guardarlo por primera vez no hay
            nada que adjuntar, abonar, ni eliminar todavía. */}
        {existing && (
          <div className="invoice-doc-management no-print">
            {!esNomina && (
              <div className="field">
                <span>Abonos recibidos (cobrado {fmtMonto(abonado)} · saldo {fmtMonto(saldo)})</span>
                <div className="cov-list">
                  {abonos.length === 0 && <div className="hint">Aún no hay abonos.</div>}
                  {abonos.map((a) => (
                    <div className="cov-row" key={a.id}>
                      <span className="cov-row-semana">{fmtDate(a.fecha)}</span>
                      <span className="cov-row-monto">{fmtMonto(a.monto)}</span>
                      <button type="button" className="icon-btn subtle" onClick={() => removeAbono(a.id)}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
                <div className="add-cov">
                  <input type="number" step="0.01" min="0" placeholder="Monto abonado" value={abonoMonto} onChange={(e) => setAbonoMonto(e.target.value)} />
                  <button type="button" className="btn-secondary" onClick={addAbono}><Plus size={13} /> Agregar abono</button>
                </div>
              </div>
            )}

            {onDelete && (
              !confirmDelete ? (
                <button type="button" className="btn-danger-ghost invoice-doc-delete-btn" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={13} /> Eliminar {esNomina ? "recibo" : "factura"}
                </button>
              ) : (
                <div className="confirm-row">
                  <span><AlertTriangle size={13} /> ¿Eliminar definitivamente?</span>
                  <button className="btn-danger" onClick={() => onDelete(existing.id)}>Sí, eliminar</button>
                  <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                </div>
              )
            )}
          </div>
        )}

        <div className="modal-footer modal-footer-row no-print">
          <button type="button" className="btn-secondary" onClick={() => guardar(false)} disabled={!!guardando}>
            {guardando === "guardar" ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Guardar
          </button>
          <button type="button" className="btn-primary" onClick={() => guardar(true)} disabled={!!guardando}>
            {guardando === "imprimir" ? <Loader2 size={14} className="spin" /> : <Printer size={14} />} Imprimir
          </button>
        </div>
      </div>
    </Overlay>
  );
}
