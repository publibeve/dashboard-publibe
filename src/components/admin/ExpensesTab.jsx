import { useState } from "react";
import {
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { AttachmentsBlock } from "../common/AttachmentsBlock";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { LockGate } from "../common/LockGate";
import { Overlay } from "../common/Overlay";
import { EXPENSE_CATEGORIAS, EXPENSE_FRECUENCIAS } from "../../utils/constants";
import { todayISO, uid } from "../../utils/helpers";

export function NewExpenseModal({ onClose, onCreate, defaultCategoria }) {
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState(defaultCategoria || EXPENSE_CATEGORIAS[0]);
  const [monto, setMonto] = useState("");
  const [frecuencia, setFrecuencia] = useState(EXPENSE_FRECUENCIAS[0]);
  const [proximoPago, setProximoPago] = useState(todayISO());
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const n = Number(monto);
    if (!concepto.trim()) { setError("Falta el concepto (a quién se le paga o qué servicio es)."); return; }
    if (!monto || isNaN(n) || n <= 0) { setError("El monto debe ser mayor a 0."); return; }
    onCreate({ id: uid(), concepto: concepto.trim(), categoria, monto: n, frecuencia, proximoPago, notas: notas.trim() });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Nuevo gasto</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
        <label className="field">
          <span>Concepto (a quién se le paga / qué servicio)</span>
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej: Ariana Martínez — nómina, o Canva Pro" />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Categoría</span>
            <CustomSelect value={categoria} onChange={setCategoria} options={EXPENSE_CATEGORIAS} />
          </label>
          <label className="field">
            <span>Frecuencia</span>
            <CustomSelect value={frecuencia} onChange={setFrecuencia} options={EXPENSE_FRECUENCIAS} />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Monto (USD)</span>
            <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
          </label>
          <label className="field">
            <span>Próximo pago</span>
            <CustomDatePicker value={proximoPago} onChange={setProximoPago} />
          </label>
        </div>
        <label className="field">
          <span>Notas (opcional)</span>
          <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>
        <button className="btn-primary full" type="button" onClick={submit}>Registrar gasto</button>
      </div>
    </Overlay>
  );
}

export function ExpenseModal({ expense, onClose, onPatch, onDelete, unlocked, onRequestUnlock, driveConnected }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({
    concepto: expense.concepto, categoria: expense.categoria, frecuencia: expense.frecuencia,
    monto: expense.monto, proximoPago: expense.proximoPago, notas: expense.notas,
  });
  const dirty = Object.keys(draft).some((k) => draft[k] !== expense[k]);
  function saveDraft() { onPatch(draft); onClose(); }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Editar gasto</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <LockGate unlocked={unlocked} onRequestUnlock={onRequestUnlock}>
          <label className="field">
            <span>Concepto</span>
            <input value={draft.concepto} onChange={(e) => setDraft({ ...draft, concepto: e.target.value })} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Categoría</span>
              <CustomSelect value={draft.categoria} onChange={(v) => setDraft({ ...draft, categoria: v })} options={EXPENSE_CATEGORIAS} />
            </label>
            <label className="field">
              <span>Frecuencia</span>
              <CustomSelect value={draft.frecuencia} onChange={(v) => setDraft({ ...draft, frecuencia: v })} options={EXPENSE_FRECUENCIAS} />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Monto (USD)</span>
              <input type="number" step="0.01" min="0" value={draft.monto} onChange={(e) => setDraft({ ...draft, monto: Number(e.target.value) })} />
            </label>
            <label className="field">
              <span>Próximo pago</span>
              <CustomDatePicker value={draft.proximoPago || ""} onChange={(v) => setDraft({ ...draft, proximoPago: v })} clearable />
            </label>
          </div>
          <label className="field">
            <span>Notas (opcional)</span>
            <textarea rows={2} value={draft.notas || ""} onChange={(e) => setDraft({ ...draft, notas: e.target.value })} />
          </label>

          <AttachmentsBlock
            title={draft.categoria === "Nómina" ? "Comprobante de pago" : "Recibo / factura"}
            files={expense.archivos || []}
            onAdd={(f) => onPatch({ archivos: [...(expense.archivos || []), f] })}
            onRemove={(id) => onPatch({ archivos: (expense.archivos || []).filter((f) => f.id !== id) })}
            driveConnected={driveConnected}
            driveFolderPath={`Administrativo / ${draft.categoria === "Nómina" ? "Nómina" : "Gastos operativos"}`}
            driveOnly
          />
        </LockGate>

        {unlocked && (
          <div className="modal-footer modal-footer-row">
            {!confirmDelete ? (
              <>
                <button className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Eliminar gasto</button>
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
