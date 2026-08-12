import { useState } from "react";
import {
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { CategoriaPicker } from "./CategoriaPicker";
import { GUION_CATEGORIAS } from "../../utils/constants";
import { uid } from "../../utils/helpers";

export function NewGuionModal({ empresa, pautas, defaultPautaId, customCategorias, canAddCategoria, onAddCategoria, onClose, onCreate }) {
  const [titulo, setTitulo] = useState("");
  const [duracion, setDuracion] = useState("");
  const [tema, setTema] = useState("");
  const [pautaId, setPautaId] = useState(defaultPautaId || "");
  const [categoria, setCategoria] = useState(GUION_CATEGORIAS[0].value);
  const [error, setError] = useState("");

  function submit() {
    if (!titulo.trim()) { setError("Falta el título del guion."); return; }
    onCreate({
      id: uid(), empresa, pautaId: pautaId || null, titulo: titulo.trim(), duracionEstimada: duracion.trim(),
      tema: tema.trim(), categoria, linkReferencia: "", archivosFinal: [], bloques: [],
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
          <span>Producto, referencia o tema principal</span>
          <input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ej: Combo verano, Modelo X200" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </label>
        <label className="field">
          <span>Pauta</span>
          <select value={pautaId} onChange={(e) => setPautaId(e.target.value)}>
            <option value="">Sin pauta</option>
            {(pautas || []).map((p) => <option key={p.id} value={p.id}>{p.etiqueta}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Categoría</span>
          <CategoriaPicker
            value={categoria}
            customCategorias={customCategorias}
            canAddCategoria={canAddCategoria}
            onChange={setCategoria}
            onAddCategoria={onAddCategoria}
          />
        </label>

        <button type="button" className="btn-primary full" onClick={submit} style={{ marginTop: 8 }}>Crear guion</button>
      </div>
    </Overlay>
  );
}
