import { useState, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Printer,
  Clapperboard,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { TomaRow } from "./TomaRow";
import { GuionPrintModal } from "./GuionPrintModal";
import { NOTE_COLORS } from "../../utils/constants";
import { clientMeta, uid } from "../../utils/helpers";

export function GuionDetailModal({ guion, showClient, onPatch, onDelete, onClose }) {
  const [titulo, setTitulo] = useState(guion.titulo || "");
  const [duracion, setDuracion] = useState(guion.duracionEstimada || "");
  const [categoria, setCategoria] = useState(guion.categoria || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const tomas = guion.tomas || [];
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const cm = clientMeta(guion.empresa);
  const CmIcon = cm.icon;

  function commitTomas(next) {
    onPatch({ tomas: next });
  }
  function updateToma(id, patch) {
    commitTomas(tomas.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function deleteToma(id) {
    commitTomas(tomas.filter((t) => t.id !== id));
  }
  function addToma() {
    commitTomas([...tomas, { id: uid(), planoLugar: "", queSeRealiza: "", vozTexto: "", grabada: false }]);
  }

  function handleDragStart(index) {
    dragIndexRef.current = index;
    setDraggingIndex(index);
  }
  function handleDragOver(e, index) {
    e.preventDefault();
    setDragOverIndex(index);
  }
  function handleDrop(e, index) {
    e.preventDefault();
    const from = dragIndexRef.current;
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragIndexRef.current = null;
    if (from === null || from === index) return;
    // Renumeración automática: como el número de toma es solo la posición
    // (nunca un campo guardado), reordenar el array ya "renumera" todo solo.
    const next = [...tomas];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    commitTomas(next);
  }
  function handleDragEnd() {
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal guion-detail-modal">
        <div className="modal-head">
          <div className="guion-detail-head-main">
            {showClient && <span className="note-card-empresa" style={{ color: cm.color }}><CmIcon size={11} />{guion.empresa}</span>}
            <input
              type="text" className="guion-titulo-input" value={titulo} placeholder="Título del guion"
              onChange={(e) => setTitulo(e.target.value)}
              onBlur={() => onPatch({ titulo })}
            />
          </div>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="guion-meta-row">
          <label className="field">
            <span>Duración estimada</span>
            <input
              type="text" value={duracion} placeholder="Ej: 45 seg"
              onChange={(e) => setDuracion(e.target.value)}
              onBlur={() => onPatch({ duracionEstimada: duracion })}
            />
          </label>
          <label className="field">
            <span>Categoría</span>
            <input
              type="text" value={categoria} placeholder="Ej: Contenido de valor"
              onChange={(e) => setCategoria(e.target.value)}
              onBlur={() => onPatch({ categoria })}
            />
          </label>
          <div className="note-color-row">
            {NOTE_COLORS.map((c) => (
              <button
                key={c} type="button" className={"note-swatch" + (guion.color === c ? " note-swatch-active" : "")}
                style={{ background: c }} onClick={() => onPatch({ color: c })}
              />
            ))}
          </div>
        </div>

        <div className="guion-tomas-list">
          {tomas.length === 0 && (
            <div className="empty-pane"><Clapperboard size={20} /> Todavía no hay tomas. Usa "Agregar toma" para empezar.</div>
          )}
          {tomas.map((t, i) => (
            <TomaRow
              key={t.id}
              toma={t}
              numero={i + 1}
              guionColor={guion.color}
              dragging={draggingIndex === i}
              isDragOver={dragOverIndex === i && draggingIndex !== i}
              onUpdate={(patch) => updateToma(t.id, patch)}
              onDelete={() => deleteToma(t.id)}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={() => setDragOverIndex((d) => (d === i ? null : d))}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>

        <button type="button" className="btn-secondary guion-add-toma-btn" onClick={addToma}>
          <Plus size={14} /> Agregar toma
        </button>

        <div className="modal-footer modal-footer-row">
          <button type="button" className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} /> Eliminar guion
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowPrint(true)}>
            <Printer size={14} /> Imprimir / Compartir
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
            <p className="delete-client-warning">Este guion quedará en la papelera 30 días, por si te arrepientes — desde ahí puedes restaurarlo.</p>
            <button className="btn-danger full" type="button" onClick={() => { onDelete(); setConfirmDelete(false); onClose(); }}>Sí, enviar a la papelera</button>
          </div>
        </Overlay>
      )}

      {showPrint && <GuionPrintModal guion={{ ...guion, titulo }} onClose={() => setShowPrint(false)} />}
    </Overlay>
  );
}
