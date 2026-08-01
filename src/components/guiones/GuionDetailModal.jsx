import { useState, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Printer,
  Clapperboard,
  Link2,
  Mic,
  Video,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { BloqueRow } from "./BloqueRow";
import { GuionPrintModal } from "./GuionPrintModal";
import { GUION_CATEGORIAS } from "../../utils/constants";
import { clientMeta, uid, guionCategoriaColor, guionProgreso } from "../../utils/helpers";

export function GuionDetailModal({ guion, showClient, onPatch, onDelete, onClose }) {
  const [titulo, setTitulo] = useState(guion.titulo || "");
  const [duracion, setDuracion] = useState(guion.duracionEstimada || "");
  const [linkReferencia, setLinkReferencia] = useState(guion.linkReferencia || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const bloques = guion.bloques || [];
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const cm = clientMeta(guion.empresa);
  const CmIcon = cm.icon;
  const color = guionCategoriaColor(guion.categoria);
  const progreso = guionProgreso(guion);

  function commitBloques(next) {
    onPatch({ bloques: next });
  }
  function updateBloque(id, patch) {
    commitBloques(bloques.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function deleteBloque(id) {
    commitBloques(bloques.filter((b) => b.id !== id));
  }
  function addBloque(tipo) {
    commitBloques([...bloques, {
      id: uid(), tipo, planoLugar: "", queSeRealiza: "", vozTexto: "", linkReferencia: "", completo: false,
    }]);
    setShowAddPicker(false);
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
    // Renumeración automática y continua entre los dos tipos de bloque: como
    // el número es solo la posición en el array (nunca un campo guardado),
    // reordenar ya "renumera" todo solo, sin importar si se mezclan Tomas y
    // Secuencias/Voz.
    const next = [...bloques];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    commitBloques(next);
  }
  function handleDragEnd() {
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal guion-detail-modal" style={{ background: color }}>
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

        {bloques.length > 0 && (
          <div className="guion-progress-bar-wrap">
            <div className="guion-progress-bar-track">
              <div className="guion-progress-bar-fill" style={{ width: `${(progreso.hechos / progreso.total) * 100}%` }} />
            </div>
            <span className="guion-progress-bar-label">{progreso.hechos}/{progreso.total}</span>
          </div>
        )}

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
            <span><Link2 size={11} /> Link de referencia del guion</span>
            <input
              type="text" value={linkReferencia} placeholder="https://…"
              onChange={(e) => setLinkReferencia(e.target.value)}
              onBlur={() => onPatch({ linkReferencia: linkReferencia.trim() })}
            />
          </label>
        </div>

        <div className="guion-categoria-row">
          {GUION_CATEGORIAS.map((c) => (
            <button
              key={c.value} type="button"
              className={"guion-categoria-chip" + (guion.categoria === c.value ? " guion-categoria-chip-active" : "")}
              style={{ background: c.color }}
              onClick={() => onPatch({ categoria: c.value })}
            >
              {c.value}
            </button>
          ))}
        </div>

        <div className="guion-tomas-list">
          {bloques.length === 0 && (
            <div className="empty-pane"><Clapperboard size={20} /> Todavía no hay bloques. Usa "Añadir" para empezar.</div>
          )}
          {bloques.map((b, i) => (
            <BloqueRow
              key={b.id}
              bloque={b}
              numero={i + 1}
              guionColor={color}
              dragging={draggingIndex === i}
              isDragOver={dragOverIndex === i && draggingIndex !== i}
              onUpdate={(patch) => updateBloque(b.id, patch)}
              onDelete={() => deleteBloque(b.id)}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={() => setDragOverIndex((d) => (d === i ? null : d))}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>

        <div className="guion-add-wrap">
          <button type="button" className="btn-secondary guion-add-toma-btn" onClick={() => setShowAddPicker((s) => !s)}>
            <Plus size={14} /> Añadir
          </button>
          {showAddPicker && (
            <div className="guion-add-picker">
              <button type="button" onClick={() => addBloque("toma")}><Video size={14} /> Toma</button>
              <button type="button" onClick={() => addBloque("secuenciaVoz")}><Mic size={14} /> Secuencia/Voz</button>
            </div>
          )}
        </div>

        <div className="modal-footer modal-footer-row">
          <button type="button" className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} /> Eliminar guion
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowPrint(true)}>
            <Printer size={14} /> Imprimir
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
