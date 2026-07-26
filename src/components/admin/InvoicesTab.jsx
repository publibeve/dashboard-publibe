import { useState } from "react";
import {
  Plus,
  X,
  CheckCircle2,
  Trash2,
  ExternalLink,
  AlertTriangle,
  FileType,
} from "lucide-react";
import { AttachmentsBlock } from "../common/AttachmentsBlock";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { LockGate } from "../common/LockGate";
import { Overlay } from "../common/Overlay";
import { CLIENTES } from "../../utils/constants";
import { fmtDate, fmtMonto, sumAbonos, todayISO, uid } from "../../utils/helpers";

export function NewInvoiceModal({ onClose, onCreate }) {
  const [empresa, setEmpresa] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaEmision, setFechaEmision] = useState(todayISO());
  const [fechaVencimiento, setFechaVencimiento] = useState(todayISO());
  const [pdfUrl, setPdfUrl] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const n = Number(monto);
    if (!empresa) { setError("Falta elegir el cliente."); return; }
    if (!concepto.trim()) { setError("Falta el concepto de la factura."); return; }
    if (!monto || isNaN(n) || n <= 0) { setError("El monto debe ser mayor a 0."); return; }
    onCreate({
      id: uid(), empresa, numeroFactura: numeroFactura.trim(), concepto: concepto.trim(), monto: n,
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
            <input value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} placeholder="Ej: 0001" />
          </label>
          <label className="field">
            <span>Monto (USD)</span>
            <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
          </label>
        </div>
        <label className="field">
          <span>Concepto</span>
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej: Diseño gráfico — mensualidad julio" />
        </label>
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
        <label className="field">
          <span><FileType size={12} /> Enlace del PDF de la factura</span>
          <input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="Enlace del archivo (Drive, OneDrive, etc.)" />
        </label>
        <label className="field">
          <span>Nota (opcional)</span>
          <textarea rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: pagó por Zelle a nombre de Publibe, factura enviada por correo" />
        </label>
        <button className="btn-primary full" type="button" onClick={submit}>Registrar factura</button>
      </div>
    </Overlay>
  );
}

export function InvoiceModal({ invoice, onClose, onPatch, onDelete, unlocked, onRequestUnlock, driveConnected }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [draft, setDraft] = useState({
    empresa: invoice.empresa, numeroFactura: invoice.numeroFactura, concepto: invoice.concepto,
    monto: invoice.monto, fechaEmision: invoice.fechaEmision, fechaVencimiento: invoice.fechaVencimiento,
    pdfUrl: invoice.pdfUrl, nota: invoice.nota || "",
  });
  const abonado = sumAbonos(invoice.abonos);
  const saldo = Number(draft.monto || 0) - abonado;
  const dirty = Object.keys(draft).some((k) => draft[k] !== invoice[k]);

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
            <span>Concepto</span>
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
