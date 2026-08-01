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
  Save,
  Check,
  BadgeCheck,
  Film,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { AttachmentsBlock } from "../common/AttachmentsBlock";
import { BloqueRow } from "./BloqueRow";
import { CategoriaPicker } from "./CategoriaPicker";
import { GuionPrintModal } from "./GuionPrintModal";
import { clientMeta, uid, guionCategoriaColor, guionProgreso, guionEstaGrabado, guionEstaCompletado } from "../../utils/helpers";

export function GuionDetailModal({ guion, showClient, customCategorias, canAddCategoria, onAddCategoria, pautaLabel, driveConnected, onPatch, onDelete, onClose }) {
  const [titulo, setTitulo] = useState(guion.titulo || "");
  const [tema, setTema] = useState(guion.tema || "");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [duracion, setDuracion] = useState(guion.duracionEstimada || "");
  const [linkReferencia, setLinkReferencia] = useState(guion.linkReferencia || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const bloques = guion.bloques || [];
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const cm = clientMeta(guion.empresa);
  const CmIcon = cm.icon;
  const color = guionCategoriaColor(guion.categoria, customCategorias);
  const progreso = guionProgreso(guion);

  // El guion ya se autoguarda de inmediato en cada cambio — esto no es la
  // única vía de guardado, es un reaseguro visual para quien está usando la
  // app en vivo durante una grabación. Antes de cerrar (por la X, por click
  // afuera, o al tocar este botón), se fuerza el blur del campo enfocado
  // para que cualquier cambio recién tipeado se confirme (onBlur) antes de
  // que el popup desaparezca — sin esto, un click afuera justo después de
  // escribir podía perder ese último cambio si el navegador procesa el
  // cierre antes que el blur.
  function flushPendingEdits() {
    if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }
  // Pedido a propósito aunque el guion ya se autoguarda solo — es un paso de
  // confirmación visual, no algo que haga falta para que el dato quede
  // guardado (eso ya pasó). "Sí" confirma y cierra; "No" cancela y te deja
  // seguir editando.
  function handleClose() {
    flushPendingEdits();
    setShowCloseConfirm(true);
  }
  function confirmCloseYes() {
    setShowCloseConfirm(false);
    onClose();
  }
  function confirmCloseNo() {
    setShowCloseConfirm(false);
  }
  function handleGuardarClick() {
    flushPendingEdits();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  }

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
      id: uid(), tipo, planoLugar: "", queSeRealiza: "", vozTexto: "", nota: "", linkReferencia: "", completo: false,
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
    <Overlay onClose={handleClose}>
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
          <button type="button" className="icon-btn" onClick={handleClose}><X size={16} /></button>
        </div>

        {bloques.length > 0 && (
          <div className="guion-progress-bar-wrap">
            <div className="guion-progress-bar-track">
              <div className="guion-progress-bar-fill" style={{ width: `${(progreso.hechos / progreso.total) * 100}%` }} />
            </div>
            <span className="guion-progress-bar-label">{progreso.hechos}/{progreso.total}</span>
          </div>
        )}

        <div className="guion-estado-row">
          <span className={"guion-estado-pill" + (guionEstaGrabado(guion) ? " guion-estado-pill-on" : "")}>
            <Check size={11} /> {guionEstaGrabado(guion) ? "Grabado" : "No grabado"}
          </span>
          <span className={"guion-estado-pill" + (guionEstaCompletado(guion) ? " guion-estado-pill-on" : "")}>
            <BadgeCheck size={11} /> {guionEstaCompletado(guion) ? "Completado" : "Sin completar"}
          </span>
        </div>

        <div className="guion-duracion-tema-row">
          <label className="field guion-duracion-field">
            <span>Duración estimada</span>
            <input
              type="text" value={duracion} placeholder="Ej: 45 seg"
              onChange={(e) => setDuracion(e.target.value)}
              onBlur={() => onPatch({ duracionEstimada: duracion })}
            />
          </label>
          <label className="field guion-tema-field">
            <span>Producto, referencia o tema principal</span>
            <input
              type="text" value={tema} placeholder="Ej: Combo verano, Modelo X200"
              onChange={(e) => setTema(e.target.value)}
              onBlur={() => onPatch({ tema })}
            />
          </label>
        </div>

        <CategoriaPicker
          value={guion.categoria}
          customCategorias={customCategorias}
          canAddCategoria={canAddCategoria}
          onChange={(categoria) => onPatch({ categoria })}
          onAddCategoria={onAddCategoria}
        />

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

        <label className="field guion-link-general-field">
          <span><Link2 size={11} /> Link de referencia del guion (opcional)</span>
          <input
            type="text" value={linkReferencia} placeholder="https://…"
            onChange={(e) => setLinkReferencia(e.target.value)}
            onBlur={() => onPatch({ linkReferencia: linkReferencia.trim() })}
          />
          {guion.linkReferencia && (
            <a href={guion.linkReferencia} target="_blank" rel="noopener noreferrer" className="toma-link-open">Abrir link ↗</a>
          )}
        </label>

        <div className="guion-cierre-section">
          <div className="guion-cierre-head"><Film size={13} /> Cierre — archivo final del reel</div>
          <p className="hint" style={{ marginTop: 0 }}>
            Al adjuntar el archivo terminado acá, el guion pasa a "Completado" solo — no hace falta tildar nada a mano.
          </p>
          <AttachmentsBlock
            files={guion.archivosFinal || []}
            onAdd={(f) => onPatch({ archivosFinal: [...(guion.archivosFinal || []), f] })}
            onRemove={(id) => onPatch({ archivosFinal: (guion.archivosFinal || []).filter((f) => f.id !== id) })}
            driveConnected={driveConnected}
            driveFolderPath={`Guiones / ${pautaLabel} / ${titulo || "Sin título"}`}
            driveOnly
          />
        </div>

        <div className="modal-footer modal-footer-row">
          <button type="button" className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} /> Eliminar guion
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={handleGuardarClick}>
              {justSaved ? <Check size={14} /> : <Save size={14} />} {justSaved ? "Guardado" : "Guardar cambios"}
            </button>
            <button type="button" className="btn-primary" onClick={() => setShowPrint(true)}>
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </div>
      </div>

      {showCloseConfirm && (
        <Overlay onClose={confirmCloseNo}>
          <div className="modal small confirm-warning-modal" style={{ maxWidth: 320 }}>
            <div className="modal-head">
              <h3>¿Desea guardar cambios?</h3>
            </div>
            <p className="delete-client-warning">Los cambios ya se guardaron solos mientras editabas — esto es solo para confirmar antes de cerrar.</p>
            <div className="modal-footer-row" style={{ padding: 0, marginBottom: 0 }}>
              <button className="btn-secondary" type="button" onClick={confirmCloseNo}>No</button>
              <button className="btn-primary" type="button" onClick={confirmCloseYes}>Sí</button>
            </div>
          </div>
        </Overlay>
      )}

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
