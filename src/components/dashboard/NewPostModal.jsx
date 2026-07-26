import { useState } from "react";
import {
  X,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { EmpresaField } from "../common/EmpresaField";
import { Overlay } from "../common/Overlay";
import { FORMATOS, REDES } from "../../utils/constants";
import { clientMeta, todayISO, uid } from "../../utils/helpers";

export function NewPostModal({ onClose, onCreate, defaultClient, lockedClient, defaultDate }) {
  const [empresa, setEmpresa] = useState(lockedClient || defaultClient);
  const [fecha, setFecha] = useState(defaultDate || todayISO());
  const [hora, setHora] = useState("12:00");
  const [redSocial, setRedSocial] = useState(REDES[0].name);
  const [formato, setFormato] = useState(FORMATOS[0]);
  const [titulo, setTitulo] = useState("");
  const [copy, setCopy] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!empresa) { setError("Falta elegir la empresa."); return; }
    if (!fecha) { setError("Falta la fecha."); return; }
    if (!titulo.trim()) { setError("Falta el título indicativo de la publicación."); return; }
    try {
      onCreate({ id: uid(), empresa, fecha, hora, redSocial, formato, titulo: titulo.trim(), copy: copy.trim() });
    } catch (err) {
      setError("No se pudo crear la publicación: " + (err && err.message ? err.message : String(err)));
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small" style={{ "--primary": clientMeta(empresa).color }}>
        <div className="modal-head">
          <h3>Nueva publicación</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <EmpresaField locked={!!lockedClient} value={empresa} onChange={setEmpresa} />

        <div className="field-row">
          <label className="field">
            <span>Fecha</span>
            <CustomDatePicker value={fecha} onChange={setFecha} />
          </label>
          <label className="field">
            <span>Hora</span>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Red social</span>
            <CustomSelect
              value={redSocial}
              onChange={setRedSocial}
              options={REDES.map((r) => ({ value: r.name, label: r.name, icon: r.icon, color: r.color }))}
            />
          </label>
          <label className="field">
            <span>Formato</span>
            <CustomSelect value={formato} onChange={setFormato} options={FORMATOS} />
          </label>
        </div>

        <label className="field">
          <span>Título indicativo</span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Promo 50% repuestos de inyección" />
        </label>

        <label className="field">
          <span>Copy (descripción)</span>
          <textarea rows={3} value={copy} onChange={(e) => setCopy(e.target.value)} placeholder="Texto de la publicación…" />
        </label>

        <button className="btn-primary full" type="button" onClick={submit}>Programar publicación</button>
      </div>
    </Overlay>
  );
}
