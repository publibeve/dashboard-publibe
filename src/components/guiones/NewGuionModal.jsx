import { useState } from "react";
import {
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { GUION_CATEGORIAS } from "../../utils/constants";
import { uid } from "../../utils/helpers";

export function NewGuionModal({ empresa, pautaId, onClose, onCreate }) {
  const [titulo, setTitulo] = useState("");
  const [duracion, setDuracion] = useState("");
  const [categoria, setCategoria] = useState(GUION_CATEGORIAS[0].value);
  const [error, setError] = useState("");

  function submit() {
    if (!titulo.trim()) { setError("Falta el título del guion."); return; }
    onCreate({
      id: uid(), empresa, pautaId: pautaId || null, titulo: titulo.trim(), duracionEstimada: duracion.trim(),
      categoria, linkReferencia: "", archivoFinal: null, bloques: [],
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
          <div className="guion-categoria-row">
            {GUION_CATEGORIAS.map((c) => (
              <button
                key={c.value} type="button"
                className={"guion-categoria-chip" + (categoria === c.value ? " guion-categoria-chip-active" : "")}
                style={{ background: c.color }}
                onClick={() => setCategoria(c.value)}
              >
                {c.value}
              </button>
            ))}
          </div>
        </label>

        <button type="button" className="btn-primary full" onClick={submit} style={{ marginTop: 8 }}>Crear guion</button>
      </div>
    </Overlay>
  );
}
