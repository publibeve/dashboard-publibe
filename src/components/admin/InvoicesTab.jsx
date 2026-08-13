import { useState, useEffect } from "react";
import {
  Plus,
  X,
  CheckCircle2,
  Trash2,
  ExternalLink,
  AlertTriangle,
  FileType,
  PenTool,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
  ListPlus,
} from "lucide-react";
import { AttachmentsBlock } from "../common/AttachmentsBlock";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { LockGate } from "../common/LockGate";
import { Overlay } from "../common/Overlay";
import { CLIENTES } from "../../utils/constants";
import { fmtDate, fmtMonto, sumAbonos, todayISO, uid } from "../../utils/helpers";
import { nextInvoiceNumber } from "../../services/billing.service";

/**
 * Sub-líneas dentro de UN ítem — ej. "Gestión publicitaria ($60)" puede
 * abrirse en "5 imágenes ($20) + Redacción y programación ($25) + Trabajo
 * presencial ($15)". Mismo patrón de lista editable de siempre, un nivel
 * más adentro. Cuando el ítem tiene al menos una sub-línea, su monto deja
 * de escribirse a mano — se calcula solo, sumando las sub-líneas.
 */
function SubItemsEditor({ subitems, onChange, canSeeMontos = true }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const list = subitems || [];
  const mMonto = (v) => (canSeeMontos ? fmtMonto(v) : "•••");

  function add() {
    const n = Number(monto);
    if (!descripcion.trim() || !monto || isNaN(n) || n <= 0) return;
    onChange([...list, { id: uid(), descripcion: descripcion.trim(), monto: n }]);
    setDescripcion(""); setMonto("");
  }
  function remove(id) {
    onChange(list.filter((si) => si.id !== id));
  }

  return (
    <div className="item-subeditor">
      {list.map((si) => (
        <div className="cov-row cov-row-sub" key={si.id}>
          <span className="cov-row-semana">{si.descripcion}</span>
          <span className="cov-row-monto">{mMonto(si.monto)}</span>
          <button type="button" className="icon-btn subtle" onClick={() => remove(si.id)}><Trash2 size={12} /></button>
        </div>
      ))}
      <div className="add-cov add-cov-sub">
        <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder='Ej: "5 imágenes"' />
        <input type="number" step="0.01" min="0" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} />
        <button type="button" className="btn-secondary" onClick={add}><Plus size={12} /> Agregar sub-línea</button>
      </div>
    </div>
  );
}

/**
 * Lista de ítems del recibo — mismo patrón exacto que DesgloseEditor
 * (Inversión) y CoberturaEditor (Pagos), como pidió Diego explícitamente:
 * reusar la interacción "+ Agregar" que ya conoce, no inventar una nueva.
 * A diferencia de esos dos, acá cada ítem puede abrirse (chevron) para
 * cargarle su propio desglose interno (SubItemsEditor) — opcional: un
 * ítem sin sub-líneas es simplemente descripción + monto normal.
 */
export function InvoiceItemsEditor({ items, onChange, canSeeMontos = true }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const list = items || [];
  const total = list.reduce((s, it) => s + Number(it.monto || 0), 0);
  const mMonto = (v) => (canSeeMontos ? fmtMonto(v) : "•••");

  function add() {
    const n = Number(monto);
    if (!descripcion.trim() || !monto || isNaN(n) || n <= 0) return;
    onChange([...list, { id: uid(), descripcion: descripcion.trim(), monto: n, subitems: [] }]);
    setDescripcion(""); setMonto("");
  }
  function remove(id) {
    onChange(list.filter((it) => it.id !== id));
    if (editingId === id) setEditingId(null);
    if (expandedId === id) setExpandedId(null);
  }
  function startEdit(it) {
    setEditingId(it.id); setEditDescripcion(it.descripcion); setEditMonto(String(it.monto));
  }
  function saveEdit() {
    const n = Number(editMonto);
    if (!editDescripcion.trim() || !editMonto || isNaN(n) || n <= 0) return;
    onChange(list.map((it) => (it.id === editingId ? { ...it, descripcion: editDescripcion.trim(), monto: n } : it)));
    setEditingId(null);
  }
  function updateSubitems(itemId, subitems) {
    const sum = subitems.reduce((s, si) => s + Number(si.monto || 0), 0);
    onChange(list.map((it) => (it.id === itemId ? { ...it, subitems, monto: subitems.length > 0 ? sum : it.monto } : it)));
  }

  return (
    <div className="field">
      <span>Ítems del recibo</span>
      <div className="cov-list">
        {list.length === 0 && <div className="hint">Sin ítems todavía — agregá al menos uno.</div>}
        {list.map((it) => {
          const tieneSubitems = (it.subitems || []).length > 0;
          return (
            <div key={it.id}>
              {editingId === it.id ? (
                <div className="cov-row cov-row-editing">
                  <textarea rows={2} value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} autoFocus />
                  <input type="number" step="0.01" min="0" value={editMonto} onChange={(e) => setEditMonto(e.target.value)} disabled={tieneSubitems} title={tieneSubitems ? "Este ítem tiene sub-líneas — el monto se calcula solo" : ""} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }} />
                  <div className="cov-edit-actions">
                    <button type="button" className="btn-secondary cov-edit-save" onClick={saveEdit}><Check size={12} /> Guardar</button>
                    <button type="button" className="btn-secondary cov-edit-cancel" onClick={() => setEditingId(null)}><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <div className="cov-row">
                  <button type="button" className="icon-btn subtle" onClick={() => setExpandedId(expandedId === it.id ? null : it.id)} title="Desglosar este ítem">
                    {expandedId === it.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <span className="cov-row-semana" style={{ whiteSpace: "pre-line" }}>
                    {it.descripcion}
                    {tieneSubitems && <span className="item-subitems-count"> ({it.subitems.length} sub-línea{it.subitems.length !== 1 ? "s" : ""})</span>}
                  </span>
                  <span className="cov-row-monto">{mMonto(it.monto)}</span>
                  <button type="button" className="icon-btn subtle" onClick={() => startEdit(it)} title="Editar"><PenTool size={12} /></button>
                  <button type="button" className="icon-btn subtle" onClick={() => remove(it.id)} title="Eliminar"><Trash2 size={13} /></button>
                </div>
              )}
              {expandedId === it.id && (
                <SubItemsEditor subitems={it.subitems} onChange={(s) => updateSubitems(it.id, s)} canSeeMontos={canSeeMontos} />
              )}
            </div>
          );
        })}
      </div>
      <div className="add-cov">
        <textarea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder='Ej: "Gestión Social Media: Julio (full) — +6 Flyers, 0 Reels, 15 Storys…"' />
        <input type="number" step="0.01" min="0" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} />
        <button type="button" className="btn-secondary" onClick={add}><Plus size={13} /> Agregar</button>
      </div>
      <div className="hint" style={{ marginTop: 4 }}>
        <ListPlus size={11} /> Tocá la flechita de un ítem para desglosarlo en sub-líneas (ej. cuántas imágenes, storys, etc.) — es opcional.
      </div>
      {list.length > 0 && (
        <div className="cov-sum">Total: <b>{mMonto(total)}</b></div>
      )}
    </div>
  );
}

export function NewInvoiceModal({ onClose, onCreate }) {
  const [empresa, setEmpresa] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [numeroCargando, setNumeroCargando] = useState(true);
  const [fechaEmision, setFechaEmision] = useState(todayISO());
  const [fechaVencimiento, setFechaVencimiento] = useState(todayISO());
  const [items, setItems] = useState([]);
  const [notaAlPie, setNotaAlPie] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");

  // Numeración automática — se pide apenas se abre el formulario, para que
  // ya esté lista cuando Diego llegue a esa parte. Sigue siendo un campo
  // editable por si hace falta corregirla a mano en algún caso puntual.
  useEffect(() => {
    let cancelled = false;
    nextInvoiceNumber().then((n) => { if (!cancelled) { setNumeroFactura(n); setNumeroCargando(false); } });
    return () => { cancelled = true; };
  }, []);

  const totalItems = items.reduce((s, it) => s + Number(it.monto || 0), 0);

  function submit() {
    if (!empresa) { setError("Falta elegir el cliente."); return; }
    if (items.length === 0) { setError("Agregá al menos un ítem a la factura."); return; }
    onCreate({
      id: uid(), empresa, numeroFactura: numeroFactura.trim(),
      concepto: items.map((it) => it.descripcion).join(" · "), monto: totalItems,
      items, notaAlPie: notaAlPie.trim(),
      fechaEmision, fechaVencimiento, pdfUrl: pdfUrl.trim(), nota: nota.trim(), abonos: [],
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Nueva factura</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
        <label className="field">
          <span>Cliente</span>
          <CustomSelect
            value={empresa}
            onChange={setEmpresa}
            placeholder="Selecciona un cliente…"
            options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Número de factura</span>
            <input value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} placeholder={numeroCargando ? "Calculando…" : "Ej: 00008"} />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Emisión</span>
            <CustomDatePicker value={fechaEmision} onChange={setFechaEmision} />
          </label>
          <label className="field">
            <span>Vencimiento</span>
            <CustomDatePicker value={fechaVencimiento} onChange={setFechaVencimiento} />
          </label>
        </div>

        <InvoiceItemsEditor items={items} onChange={setItems} />

        <label className="field">
          <span>Nota al pie (opcional — específica de esta factura)</span>
          <textarea rows={2} value={notaAlPie} onChange={(e) => setNotaAlPie(e.target.value)} placeholder='Ej: "Desde el mes de marzo se implementó el uso de la IA en diferentes contenidos."' />
        </label>

        <label className="field">
          <span><FileType size={12} /> Enlace del PDF de la factura (opcional)</span>
          <input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="Solo si además vas a subir un archivo aparte (Drive, etc.)" />
        </label>
        <label className="field">
          <span>Nota interna (opcional, no sale en la factura)</span>
          <textarea rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: pagó por Zelle a nombre de Publibe" />
        </label>
        <button className="btn-primary full" type="button" onClick={submit}>Registrar factura</button>
      </div>
    </Overlay>
  );
}

export function InvoiceModal({ invoice, onClose, onPatch, onDelete, unlocked, onRequestUnlock, driveConnected, onPrint }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [draft, setDraft] = useState({
    empresa: invoice.empresa, numeroFactura: invoice.numeroFactura, concepto: invoice.concepto,
    monto: invoice.monto, fechaEmision: invoice.fechaEmision, fechaVencimiento: invoice.fechaVencimiento,
    pdfUrl: invoice.pdfUrl, nota: invoice.nota || "", items: invoice.items || [], notaAlPie: invoice.notaAlPie || "",
  });
  const abonado = sumAbonos(invoice.abonos);
  const saldo = Number(draft.monto || 0) - abonado;
  const dirty = Object.keys(draft).some((k) => JSON.stringify(draft[k]) !== JSON.stringify(invoice[k]));

  function addAbono() {
    const n = Number(abonoMonto);
    if (!abonoMonto || isNaN(n) || n <= 0) return;
    onPatch({ abonos: [...(invoice.abonos || []), { id: uid(), monto: n, fecha: todayISO() }] });
    setAbonoMonto("");
  }
  function removeAbono(id) {
    onPatch({ abonos: invoice.abonos.filter((a) => a.id !== id) });
  }
  function saveDraft() { onPatch(draft); onClose(); }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Editar factura</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <LockGate unlocked={unlocked} onRequestUnlock={onRequestUnlock}>
          <label className="field">
            <span>Cliente</span>
            <CustomSelect
              value={draft.empresa}
              onChange={(v) => setDraft({ ...draft, empresa: v })}
              options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Número de factura</span>
              <input value={draft.numeroFactura || ""} onChange={(e) => setDraft({ ...draft, numeroFactura: e.target.value })} placeholder="Ej: 0001" />
            </label>
            <label className="field">
              <span>Monto (USD)</span>
              <input type="number" step="0.01" min="0" value={draft.monto} onChange={(e) => setDraft({ ...draft, monto: Number(e.target.value) })} />
            </label>
          </div>
          <label className="field">
            <span>Concepto (resumen corto, opcional si ya cargaste ítems abajo)</span>
            <input value={draft.concepto} onChange={(e) => setDraft({ ...draft, concepto: e.target.value })} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Emisión</span>
              <CustomDatePicker value={draft.fechaEmision} onChange={(v) => setDraft({ ...draft, fechaEmision: v })} />
            </label>
            <label className="field">
              <span>Vencimiento</span>
              <CustomDatePicker value={draft.fechaVencimiento} onChange={(v) => setDraft({ ...draft, fechaVencimiento: v })} />
            </label>
          </div>

          <InvoiceItemsEditor
            items={draft.items}
            onChange={(items) => setDraft({ ...draft, items, monto: items.reduce((s, it) => s + Number(it.monto || 0), 0) })}
          />

          <label className="field">
            <span>Nota al pie (opcional — sale impresa en la factura)</span>
            <textarea rows={2} value={draft.notaAlPie} onChange={(e) => setDraft({ ...draft, notaAlPie: e.target.value })} />
          </label>

          <label className="field">
            <span><FileType size={12} /> Enlace del PDF de la factura</span>
            <div className="pdf-link-row">
              <input value={draft.pdfUrl || ""} onChange={(e) => setDraft({ ...draft, pdfUrl: e.target.value })} placeholder="Enlace del archivo" />
              {draft.pdfUrl && <a className="file-open" href={draft.pdfUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a>}
            </div>
          </label>

          <AttachmentsBlock
            title="Otros adjuntos"
            files={invoice.archivos || []}
            onAdd={(f) => onPatch({ archivos: [...(invoice.archivos || []), f] })}
            onRemove={(id) => onPatch({ archivos: (invoice.archivos || []).filter((f) => f.id !== id) })}
            driveConnected={driveConnected}
            driveFolderPath={`Administrativo / Facturas / ${draft.empresa}`}
            driveOnly
          />

          <label className="field">
            <span>Nota</span>
            <textarea rows={2} value={draft.nota || ""} onChange={(e) => setDraft({ ...draft, nota: e.target.value })} placeholder="Ej: pagó por Zelle a nombre de Publibe, factura enviada por correo" />
          </label>

          <div className="field">
            <span>Abonos recibidos (cobrado {fmtMonto(abonado)} · saldo {fmtMonto(saldo)})</span>
            <div className="cov-list">
              {(invoice.abonos || []).length === 0 && <div className="hint">Aún no hay abonos.</div>}
              {(invoice.abonos || []).map((a) => (
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
        </LockGate>

        {unlocked && (
          <div className="modal-footer modal-footer-row">
            {!confirmDelete ? (
              <>
                <button className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Eliminar factura</button>
                <button className="btn-secondary" type="button" onClick={() => onPrint(invoice)}><Printer size={13} /> Ver / imprimir recibo</button>
                <button className="btn-primary save-draft-btn" type="button" onClick={saveDraft} disabled={!dirty}>
                  <CheckCircle2 size={14} /> Guardar cambios
                </button>
              </>
            ) : (
              <div className="confirm-row">
                <span><AlertTriangle size={13} /> ¿Eliminar definitivamente?</span>
                <button className="btn-danger" onClick={onDelete}>Sí, eliminar</button>
                <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              </div>
            )}
          </div>
        )}
      </div>
    </Overlay>
  );
}
