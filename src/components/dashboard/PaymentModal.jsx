import { useState } from "react";
import {
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  CreditCard,
  Banknote,
} from "lucide-react";
import { AttachmentsBlock } from "../common/AttachmentsBlock";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { LockGate } from "../common/LockGate";
import { Overlay } from "../common/Overlay";
import { CLIENTES, METODOS_PAGO } from "../../utils/constants";
import { clientMeta, fmtMonto } from "../../utils/helpers";

export function PaymentModal({ payment, onClose, onPatch, onDelete, unlocked, onRequestUnlock, driveConnected }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({
    empresa: payment.empresa, fecha: payment.fecha, moneda: payment.moneda || "USD", monto: payment.monto,
    montoBs: payment.montoBs, tasaCambio: payment.tasaCambio, refBancaria: payment.refBancaria,
    metodoPago: payment.metodoPago, nota: payment.nota, cobertura: payment.cobertura || [],
  });
  const accent = clientMeta(draft.empresa).color;
  const dirty = Object.keys(draft).some((k) => JSON.stringify(draft[k]) !== JSON.stringify(payment[k]));

  function setMoneda(m) {
    setDraft({ ...draft, moneda: m });
  }
  function updateBs(patch) {
    const next = { ...draft, ...patch };
    const nuevoMonto = next.montoBs && next.tasaCambio ? Math.round((Number(next.montoBs) / Number(next.tasaCambio)) * 100) / 100 : draft.monto;
    setDraft({ ...next, monto: nuevoMonto });
  }
  function saveDraft() { onPatch(draft); onClose(); }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small" style={{ "--primary": accent }}>
        <div className="modal-head">
          <h3>Editar pago</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <LockGate unlocked={unlocked} onRequestUnlock={onRequestUnlock}>
        <label className="field">
          <span>Empresa</span>
          <CustomSelect
            value={draft.empresa}
            onChange={(v) => setDraft({ ...draft, empresa: v })}
            disabled={!unlocked}
            options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
          />
        </label>

        <label className="field">
          <span>Fecha</span>
          <CustomDatePicker value={draft.fecha} onChange={(v) => setDraft({ ...draft, fecha: v })} disabled={!unlocked} />
        </label>

        <label className="field">
          <span>Moneda del pago</span>
          <div className="status-pills">
            <button type="button" className={"pill" + (draft.moneda === "USD" ? " pill-active" : "")} onClick={() => setMoneda("USD")} disabled={!unlocked}>Dólares</button>
            <button type="button" className={"pill" + (draft.moneda === "Bs" ? " pill-active" : "")} onClick={() => setMoneda("Bs")} disabled={!unlocked}><Banknote size={13} /> Bolívares</button>
          </div>
        </label>

        {draft.moneda === "USD" ? (
          <label className="field">
            <span>Monto pagado (USD)</span>
            <input type="number" step="0.01" min="0" value={draft.monto} onChange={(e) => setDraft({ ...draft, monto: Number(e.target.value) })} disabled={!unlocked} />
          </label>
        ) : (
          <>
            <div className="field-row">
              <label className="field">
                <span>Monto en Bs.</span>
                <input type="number" step="0.01" min="0" value={draft.montoBs || ""} onChange={(e) => updateBs({ montoBs: e.target.value })} disabled={!unlocked} />
              </label>
              <label className="field">
                <span>Tasa de cambio</span>
                <input type="number" step="0.01" min="0" value={draft.tasaCambio || ""} onChange={(e) => updateBs({ tasaCambio: e.target.value })} disabled={!unlocked} />
              </label>
            </div>
            <label className="field">
              <span>Referencia bancaria</span>
              <input value={draft.refBancaria || ""} onChange={(e) => setDraft({ ...draft, refBancaria: e.target.value })} placeholder="Ej: 4671" disabled={!unlocked} />
            </label>
            <div className="bs-equiv">Equivalente: <b>{fmtMonto(draft.monto)}</b></div>
          </>
        )}

        <label className="field">
          <span><CreditCard size={12} /> Método de pago</span>
          <CustomSelect value={draft.metodoPago} onChange={(v) => setDraft({ ...draft, metodoPago: v })} disabled={!unlocked} options={METODOS_PAGO} />
        </label>

        <label className="field">
          <span>Nota (opcional)</span>
          <textarea rows={2} value={draft.nota || ""} onChange={(e) => setDraft({ ...draft, nota: e.target.value })} disabled={!unlocked} />
        </label>

        <AttachmentsBlock
          title="Comprobante / factura"
          files={payment.archivos || []}
          onAdd={(f) => onPatch({ archivos: [...(payment.archivos || []), f] })}
          onRemove={(id) => onPatch({ archivos: (payment.archivos || []).filter((f) => f.id !== id) })}
          driveConnected={driveConnected}
          driveFolderPath={`${draft.empresa} / Pagos publicitarios`}
          driveOnly
        />
        </LockGate>

        {unlocked && (
        <div className="modal-footer modal-footer-row">
          <button className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Eliminar pago</button>
          <button className="btn-primary save-draft-btn" type="button" onClick={saveDraft} disabled={!dirty}>
            <CheckCircle2 size={14} /> Guardar cambios
          </button>
        </div>
        )}
      </div>

      {confirmDelete && (
        <Overlay onClose={() => setConfirmDelete(false)}>
          <div className="modal small confirm-warning-modal" style={{ maxWidth: 340 }}>
            <div className="modal-head">
              <h3><AlertTriangle size={16} color="#B4432F" /> ¿Enviar a la papelera?</h3>
              <button type="button" className="icon-btn" onClick={() => setConfirmDelete(false)}><X size={16} /></button>
            </div>
            <p className="delete-client-warning">Este pago quedará en la papelera 30 días, por si te arrepientes — desde ahí puedes restaurarlo.</p>
            <button className="btn-danger full" type="button" onClick={onDelete}>Sí, enviar a la papelera</button>
          </div>
        </Overlay>
      )}
    </Overlay>
  );
}
