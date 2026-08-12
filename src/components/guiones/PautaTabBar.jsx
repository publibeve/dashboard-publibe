import { useState, useRef } from "react";
import {
  Plus,
  Pencil,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Overlay } from "../common/Overlay";

function PautaTab({ pauta, active, onSelect, onRename, onDelete, dragging, isDragOver, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }) {
  const [editing, setEditing] = useState(false);
  const [texto, setTexto] = useState(pauta.etiqueta);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function commitRename() {
    const clean = texto.trim();
    if (clean && clean !== pauta.etiqueta) onRename(clean);
    else setTexto(pauta.etiqueta);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="pauta-tab pauta-tab-editing">
        <input
          type="text" autoFocus value={texto} onChange={(e) => setTexto(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setTexto(pauta.etiqueta); setEditing(false); } }}
        />
      </div>
    );
  }

  return (
    <div
      className={"pauta-tab" + (active ? " pauta-tab-active" : "") + (dragging ? " pauta-tab-dragging" : "") + (isDragOver ? " pauta-tab-dragover" : "")}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <button type="button" className="pauta-tab-label" onClick={onSelect} title="Arrastrar para reordenar">{pauta.etiqueta}</button>
      <button type="button" className="pauta-tab-icon-btn" onClick={() => setEditing(true)} title="Renombrar"><Pencil size={11} /></button>
      <button type="button" className="pauta-tab-icon-btn" onClick={() => setConfirmDelete(true)} title="Eliminar pauta"><X size={12} /></button>

      {confirmDelete && (
        <Overlay onClose={() => setConfirmDelete(false)}>
          <div className="modal small confirm-warning-modal" style={{ maxWidth: 340 }}>
            <div className="modal-head">
              <h3><AlertTriangle size={16} color="#B4432F" /> ¿Eliminar esta pauta?</h3>
              <button type="button" className="icon-btn" onClick={() => setConfirmDelete(false)}><X size={16} /></button>
            </div>
            <p className="delete-client-warning">
              "{pauta.etiqueta}" se va a eliminar. Los guiones que tenía asociados NO se borran — quedan como "Sin pauta", podés reasignarlos después.
            </p>
            <button className="btn-danger full" type="button" onClick={() => { onDelete(); setConfirmDelete(false); }}>Sí, eliminar la pauta</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

export function PautaTabBar({ pautas, pautaFiltro, onChangePautaFiltro, onAddPauta, onRenamePauta, onDeletePauta, onReorderPautas }) {
  const [addingPauta, setAddingPauta] = useState(false);
  const [nuevaPautaTexto, setNuevaPautaTexto] = useState("");
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);

  function confirmAddPauta() {
    const clean = nuevaPautaTexto.trim();
    if (!clean) { setAddingPauta(false); return; }
    onAddPauta(clean);
    setNuevaPautaTexto("");
    setAddingPauta(false);
  }

  function handleDragStart(index) { dragIndexRef.current = index; setDraggingIndex(index); }
  function handleDragOver(e, index) { e.preventDefault(); setDragOverIndex(index); }
  function handleDrop(e, index) {
    e.preventDefault();
    const from = dragIndexRef.current;
    setDraggingIndex(null); setDragOverIndex(null); dragIndexRef.current = null;
    if (from === null || from === index) return;
    const next = [...pautas];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    onReorderPautas(next);
  }
  function handleDragEnd() { setDraggingIndex(null); setDragOverIndex(null); dragIndexRef.current = null; }

  return (
    <div className="tabbar pauta-tabbar">
      <button type="button" className={"tab" + (pautaFiltro === "todas" ? " tab-active" : "")} onClick={() => onChangePautaFiltro("todas")}>
        Todas las pautas
      </button>
      {(pautas || []).map((p, i) => (
        <PautaTab
          key={p.id}
          pauta={p}
          active={pautaFiltro === p.id}
          onSelect={() => onChangePautaFiltro(p.id)}
          onRename={(etiqueta) => onRenamePauta(p.id, etiqueta)}
          onDelete={() => onDeletePauta(p.id)}
          dragging={draggingIndex === i}
          isDragOver={dragOverIndex === i && draggingIndex !== i}
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragLeave={() => setDragOverIndex((d) => (d === i ? null : d))}
          onDrop={(e) => handleDrop(e, i)}
          onDragEnd={handleDragEnd}
        />
      ))}
      {!addingPauta ? (
        <button type="button" className="pauta-tab-add-btn" onClick={() => setAddingPauta(true)} title="Nueva pauta"><Plus size={14} /></button>
      ) : (
        <div className="pauta-tab-add-inline">
          <input
            type="text" autoFocus value={nuevaPautaTexto} placeholder='Ej: "1 de agosto — Modelo Astrid"'
            onChange={(e) => setNuevaPautaTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") confirmAddPauta(); if (e.key === "Escape") setAddingPauta(false); }}
          />
          <button type="button" className="icon-btn subtle" onClick={confirmAddPauta}><Check size={14} /></button>
          <button type="button" className="icon-btn subtle" onClick={() => { setAddingPauta(false); setNuevaPautaTexto(""); }}><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
