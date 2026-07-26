import { useState } from "react";
import {
  X,
  User,
  Calendar,
  AlertTriangle,
  FolderKanban,
} from "lucide-react";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { Overlay } from "../common/Overlay";
import { DISENADORES, TAREA_ESTADOS } from "../../utils/constants";
import { todayISO, uid } from "../../utils/helpers";

export function NewTareaGeneralModal({ onClose, onCreate }) {
  const [asignado, setAsignado] = useState("");
  const [categoria, setCategoria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [estado, setEstado] = useState("pendiente");
  const [fecha, setFecha] = useState(todayISO());
  const [error, setError] = useState("");

  function submit() {
    if (!asignado) { setError("Falta elegir a quién se le asigna."); return; }
    if (!categoria.trim()) { setError("Falta la categoría (ej: Reuniones y Coordinación)."); return; }
    if (!titulo.trim()) { setError("Falta el título de la tarea."); return; }
    onCreate({
      id: uid(), asignado, categoria: categoria.trim(), titulo: titulo.trim(),
      estado, fecha, notas: "", createdAt: new Date().toISOString(),
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Nueva tarea general</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <label className="field">
          <span><User size={12} /> Asignado a</span>
          <CustomSelect value={asignado} onChange={setAsignado} options={DISENADORES} placeholder="Seleccionar…" />
        </label>
        <label className="field">
          <span><FolderKanban size={12} /> Categoría</span>
          <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej: Planificación y parte organizativa" />
        </label>
        <label className="field">
          <span>Título de la tarea</span>
          <textarea value={titulo} onChange={(e) => setTitulo(e.target.value)} rows={3} placeholder="Describe la tarea…" />
        </label>
        <div className="field-row">
          <label className="field">
            <span><Calendar size={12} /> Fecha de inicio</span>
            <CustomDatePicker value={fecha} onChange={setFecha} clearable />
          </label>
          <label className="field">
            <span>Estado</span>
            <CustomSelect value={estado} onChange={setEstado} options={TAREA_ESTADOS.map((e) => ({ value: e.id, label: e.label }))} />
          </label>
        </div>

        <button className="btn-primary full" type="button" onClick={submit}>Crear tarea</button>
      </div>
    </Overlay>
  );
}
