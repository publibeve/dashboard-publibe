import { useState } from "react";
import {
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { Overlay } from "../common/Overlay";
import { DesgloseEditor } from "./PagosView";
import { CLIENTES } from "../../utils/constants";
import { uid } from "../../utils/helpers";

export function NewInversionModal({ onClose, onCreate, defaultClient, lockedClient, canSeeMontos = false, duplicateFrom }) {
  const d = duplicateFrom || null;
  const [empresa, setEmpresa] = useState(d ? d.empresa : (lockedClient || defaultClient));
  const [semana, setSemana] = useState(d ? (d.semana || "") : "");
  const [fecha, setFecha] = useState(d ? (d.fecha || "") : "");
  const [monto, setMonto] = useState(d ? String(d.monto ?? "") : "");
  const [desglose, setDesglose] = useState(d ? (d.desglose || []).map((it) => ({ ...it, id: uid() })) : []);
  const [nota, setNota] = useState(d ? (d.nota || "") : "");
  const [error, setError] = useState("");

  function submit() {
    const n = Number(monto);
    if (!empresa) { setError("Falta elegir el cliente."); return; }
    if (!semana.trim()) { setError("Falta indicar de qué semana a qué semana."); return; }
    if (!fecha) { setError("Falta la fecha de esa semana."); return; }
    if (!monto || isNaN(n) || n <= 0) { setError("El monto debe ser mayor a 0."); return; }
    onCreate({ id: uid(), empresa, semana: semana.trim(), fecha, monto: n, desglose, nota: nota.trim(), createdAt: new Date().toISOString() });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>{d ? "Duplicar inversión semanal" : "Nueva inversión semanal"}</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        {!lockedClient && (
          <label className="field">
            <span>Cliente</span>
            <CustomSelect
              value={empresa} onChange={setEmpresa} placeholder="Selecciona un cliente…"
              options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
            />
          </label>
        )}

        <div className="field-row">
          <label className="field">
            <span>Fecha de esa semana</span>
            <CustomDatePicker value={fecha} onChange={setFecha} />
          </label>
          <label className="field">
            <span>Monto total</span>
            <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
          </label>
        </div>
        <label className="field">
          <span>¿De qué semana a qué semana?</span>
          <input value={semana} onChange={(e) => setSemana(e.target.value)} placeholder="Ej: 6 al 12 de abril" />
        </label>

        <label className="field">
          <span>Nota (opcional)</span>
          <textarea rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: 5 elementos — Gasolina conjuntos, amortiguadores KYB… — 555 Japón" />
        </label>

        <DesgloseEditor desglose={desglose} onChange={setDesglose} montoTotal={monto} canSeeMontos={canSeeMontos} />

        <button className="btn-primary full" type="button" onClick={submit}>{d ? "Crear inversión duplicada" : "Registrar inversión"}</button>
      </div>
    </Overlay>
  );
}

export function InversionModal({ inversion, onClose, onPatch, onDelete, onDuplicate, canSeeMontos = false }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({
    empresa: inversion.empresa, semana: inversion.semana, fecha: inversion.fecha, monto: inversion.monto,
    desglose: inversion.desglose || [], nota: inversion.nota || "",
  });
  const dirty = Object.keys(draft).some((k) => JSON.stringify(draft[k]) !== JSON.stringify(inversion[k]));
  function saveDraft() { onPatch(draft); }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Editar inversión semanal</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <label className="field">
          <span>Cliente</span>
          <CustomSelect
            value={draft.empresa} onChange={(v) => setDraft({ ...draft, empresa: v })}
            options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Fecha de esa semana</span>
            <CustomDatePicker value={draft.fecha} onChange={(v) => setDraft({ ...draft, fecha: v })} />
          </label>
          <label className="field">
            <span>Monto total</span>
            <input type="number" step="0.01" min="0" value={draft.monto} onChange={(e) => setDraft({ ...draft, monto: Number(e.target.value) })} />
          </label>
        </div>
        <label className="field">
          <span>¿De qué semana a qué semana?</span>
          <input value={draft.semana} onChange={(e) => setDraft({ ...draft, semana: e.target.value })} />
        </label>

        <label className="field">
          <span>Nota (opcional)</span>
          <textarea rows={2} value={draft.nota} onChange={(e) => setDraft({ ...draft, nota: e.target.value })} placeholder="Ej: 5 elementos — Gasolina conjuntos, amortiguadores KYB… — 555 Japón" />
        </label>

        <DesgloseEditor desglose={draft.desglose} onChange={(d) => setDraft({ ...draft, desglose: d })} montoTotal={draft.monto} canSeeMontos={canSeeMontos} />

        <div className="modal-footer modal-footer-row">
          <button className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Eliminar</button>
          <button className="btn-secondary" type="button" onClick={() => onDuplicate(inversion)}><Copy size={13} /> Duplicar</button>
          <button className="btn-primary save-draft-btn" type="button" onClick={saveDraft} disabled={!dirty}>
            <CheckCircle2 size={14} /> Guardar cambios
          </button>
        </div>
      </div>

      {confirmDelete && (
        <Overlay onClose={() => setConfirmDelete(false)}>
          <div className="modal small confirm-warning-modal" style={{ maxWidth: 340 }}>
            <div className="modal-head">
              <h3><AlertTriangle size={16} color="#B4432F" /> ¿Enviar a la papelera?</h3>
              <button type="button" className="icon-btn" onClick={() => setConfirmDelete(false)}><X size={16} /></button>
            </div>
            <p className="delete-client-warning">Esta inversión quedará en la papelera 30 días, por si te arrepientes — desde ahí puedes restaurarla.</p>
            <button className="btn-danger full" type="button" onClick={onDelete}>Sí, enviar a la papelera</button>
          </div>
        </Overlay>
      )}
    </Overlay>
  );
}
