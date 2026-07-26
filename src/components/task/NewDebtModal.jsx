import { useState } from "react";
import {
  X,
  AlertTriangle,
} from "lucide-react";
import { EmpresaField } from "../common/EmpresaField";
import { Overlay } from "../common/Overlay";
import { clientMeta, todayISO, uid } from "../../utils/helpers";

export function NewDebtModal({ onClose, onCreate, defaultClient, lockedClient }) {
  const [empresa, setEmpresa] = useState(lockedClient || defaultClient);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const n = Number(monto);
    if (!empresa) { setError("Falta elegir la empresa."); return; }
    if (!concepto.trim()) { setError("Falta describir qué se debe (ej: 'Semana del 15 al 21 jun')."); return; }
    if (!monto || isNaN(n) || n <= 0) { setError("El monto debe ser un número mayor a 0."); return; }
    try {
      onCreate({ id: uid(), empresa, concepto: concepto.trim(), monto: n, fecha: todayISO() });
    } catch (err) {
      setError("No se pudo registrar: " + (err && err.message ? err.message : String(err)));
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small" style={{ "--primary": clientMeta(empresa).color }}>
        <div className="modal-head">
          <h3>Nuevo pendiente</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <EmpresaField locked={!!lockedClient} value={empresa} onChange={setEmpresa} />

        <label className="field">
          <span>¿Qué se debe?</span>
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej: Semana del 15 al 21 de junio" />
        </label>

        <label className="field">
          <span>Monto (USD)</span>
          <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
        </label>

        <button className="btn-primary full" type="button" onClick={submit}>Registrar pendiente</button>
      </div>
    </Overlay>
  );
}
