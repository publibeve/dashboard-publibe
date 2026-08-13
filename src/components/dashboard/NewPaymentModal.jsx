import { useState } from "react";
import {
  X,
  AlertTriangle,
  CreditCard,
  Banknote,
} from "lucide-react";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { EmpresaField } from "../common/EmpresaField";
import { Overlay } from "../common/Overlay";
import { CoberturaEditor } from "./PagosView";
import { METODOS_PAGO } from "../../utils/constants";
import { clientMeta, fmtMonto, todayISO, uid } from "../../utils/helpers";

const METODOS_ESTANDAR = METODOS_PAGO.filter((m) => m !== "Otro");

export function NewPaymentModal({ onClose, onCreate, defaultClient, lockedClient, canSeeMontos = false, duplicateFrom }) {
  const d = duplicateFrom || null;
  const dMetodoEsPersonalizado = d && d.metodoPago && !METODOS_ESTANDAR.includes(d.metodoPago);
  const [empresa, setEmpresa] = useState(d ? d.empresa : (lockedClient || defaultClient));
  const [fecha, setFecha] = useState(d ? d.fecha : todayISO());
  const [moneda, setMoneda] = useState(d ? (d.moneda || "USD") : "USD");
  const [monto, setMonto] = useState(d && d.moneda !== "Bs" ? String(d.monto ?? "") : "");
  const [montoBs, setMontoBs] = useState(d && d.moneda === "Bs" ? String(d.montoBs ?? "") : "");
  const [tasaCambio, setTasaCambio] = useState(d && d.moneda === "Bs" ? String(d.tasaCambio ?? "") : "");
  const [refBancaria, setRefBancaria] = useState(d ? (d.refBancaria || "") : "");
  const [metodoPago, setMetodoPago] = useState(d ? (dMetodoEsPersonalizado ? "Otro" : (d.metodoPago || "")) : "");
  const [metodoOtro, setMetodoOtro] = useState(d && dMetodoEsPersonalizado ? d.metodoPago : "");
  const [nota, setNota] = useState(d ? (d.nota || "") : "");
  const [cobertura, setCobertura] = useState(d ? (d.cobertura || []).map((c) => ({ ...c, id: uid() })) : []);
  const [error, setError] = useState("");

  const montoCalculado = moneda === "Bs" && montoBs && tasaCambio ? (Number(montoBs) / Number(tasaCambio)) : null;
  const montoFinal = moneda === "Bs" ? montoCalculado : Number(monto);

  function submit() {
    if (!empresa) { setError("Falta elegir la empresa."); return; }
    if (!fecha) { setError("Falta la fecha."); return; }
    if (!metodoPago) { setError("Falta elegir el método de pago."); return; }
    if (metodoPago === "Otro" && !metodoOtro.trim()) { setError("Especificá cuál es el método de pago."); return; }
    if (moneda === "Bs") {
      if (!montoBs || Number(montoBs) <= 0) { setError("Falta el monto en bolívares."); return; }
      if (!tasaCambio || Number(tasaCambio) <= 0) { setError("Falta la tasa de cambio."); return; }
    } else if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      setError("El monto debe ser un número mayor a 0."); return;
    }
    try {
      const payload = {
        id: uid(), empresa, fecha, monto: Math.round(montoFinal * 100) / 100, metodoPago: metodoPago === "Otro" ? metodoOtro.trim() : metodoPago,
        moneda, nota: nota.trim(), cobertura,
      };
      if (moneda === "Bs") {
        payload.montoBs = Number(montoBs);
        payload.tasaCambio = Number(tasaCambio);
        payload.refBancaria = refBancaria.trim();
      }
      onCreate(payload);
    } catch (err) {
      setError("No se pudo crear el pago: " + (err && err.message ? err.message : String(err)));
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small" style={{ "--primary": clientMeta(empresa).color }}>
        <div className="modal-head">
          <h3>{d ? "Duplicar pago" : "Nuevo pago"}</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <EmpresaField locked={!!lockedClient} value={empresa} onChange={setEmpresa} />

        <label className="field">
          <span>Fecha</span>
          <CustomDatePicker value={fecha} onChange={setFecha} />
        </label>

        <label className="field">
          <span>Moneda del pago</span>
          <div className="status-pills">
            <button type="button" className={"pill" + (moneda === "USD" ? " pill-active" : "")} onClick={() => setMoneda("USD")}>Dólares</button>
            <button type="button" className={"pill" + (moneda === "Bs" ? " pill-active" : "")} onClick={() => setMoneda("Bs")}><Banknote size={13} /> Bolívares</button>
          </div>
        </label>

        {moneda === "USD" ? (
          <label className="field">
            <span>Monto pagado (USD)</span>
            <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
          </label>
        ) : (
          <>
            <div className="field-row">
              <label className="field">
                <span>Monto en Bs.</span>
                <input type="number" step="0.01" min="0" value={montoBs} onChange={(e) => setMontoBs(e.target.value)} placeholder="0,00" />
              </label>
              <label className="field">
                <span>Tasa de cambio</span>
                <input type="number" step="0.01" min="0" value={tasaCambio} onChange={(e) => setTasaCambio(e.target.value)} placeholder="Bs. por $1" />
              </label>
            </div>
            <label className="field">
              <span>Referencia bancaria</span>
              <input value={refBancaria} onChange={(e) => setRefBancaria(e.target.value)} placeholder="Ej: 4671" />
            </label>
            {montoCalculado !== null && (
              <div className="bs-equiv">Equivalente: <b>{fmtMonto(montoCalculado)}</b></div>
            )}
          </>
        )}

        <label className="field">
          <span><CreditCard size={12} /> Método de pago</span>
          <CustomSelect value={metodoPago} onChange={setMetodoPago} options={METODOS_PAGO} placeholder="Seleccionar…" />
        </label>
        {metodoPago === "Otro" && (
          <label className="field">
            <span>Especificar método</span>
            <input value={metodoOtro} onChange={(e) => setMetodoOtro(e.target.value)} placeholder="Ej: Cheque, Binance…" autoFocus />
          </label>
        )}

        <label className="field">
          <span>Nota (opcional)</span>
          <textarea rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: abono temporal mientras pasaba la tarjeta" />
        </label>

        <CoberturaEditor cobertura={cobertura} onChange={setCobertura} montoTotal={montoFinal} canSeeMontos={canSeeMontos} />

        <button className="btn-primary full" type="button" onClick={submit}>{d ? "Crear pago duplicado" : "Registrar pago"}</button>
      </div>
    </Overlay>
  );
}
