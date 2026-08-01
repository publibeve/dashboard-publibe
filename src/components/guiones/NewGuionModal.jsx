import { useState } from "react";
import {
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { NOTE_COLORS } from "../../utils/constants";
import { uid } from "../../utils/helpers";

export function NewGuionModal({ empresa, onClose, onCreate }) {
  const [titulo, setTitulo] = useState("");
  const [duracion, setDuracion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [error, setError] = useState("");

  function submit() {
    if (!titulo.trim()) { setError("Falta el título del guion."); return; }
    onCreate({
      id: uid(), empresa, titulo: titulo.trim(), duracionEstimada: duracion.trim(),
      categoria: categoria.trim(), color, tomas: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Nuevo guion</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <label className="field">
          <span>Título</span>
          <input value={titulo} autoFocus onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Reel — Cómo reservar tu traslado" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </label>
        <label className="field">
          <span><Clock size={12} /> Duración estimada</span>
          <input value={duracion} onChange={(e) => setDuracion(e.target.value)} placeholder="Ej: 45 seg" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </label>
        <label className="field">
          <span>Categoría</span>
          <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej: Contenido de valor" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </label>
        <label className="field">
          <span>Color</span>
          <div className="note-color-row">
            {NOTE_COLORS.map((c) => (
              <button
                key={c} type="button" className={"note-swatch" + (color === c ? " note-swatch-active" : "")}
                style={{ background: c }} onClick={() => setColor(c)}
              />
            ))}
          </div>
        </label>

        <button type="button" className="btn-primary full" onClick={submit} style={{ marginTop: 8 }}>Crear guion</button>
      </div>
    </Overlay>
  );
}
