import { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  StickyNote,
  History,
  ListChecks,
  FolderKanban,
} from "lucide-react";
import { AttachmentsBlock } from "../common/AttachmentsBlock";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { LockGate } from "../common/LockGate";
import { Overlay } from "../common/Overlay";
import { UnsavedChangesModal } from "../common/UnsavedChangesModal";
import { FloatingSelectionToolbar, ImageActionMenu, RichToolbar } from "../notes/RichEditorToolbar";
import { TaskChatPanel } from "./TaskChatPanel";
import { DISENADORES, TAREA_ESTADOS } from "../../utils/constants";
import { uid, monthFolderName } from "../../utils/helpers";
import { cleanChecklistHtml, handleCheckLineClick, handleChecklistEnterKey, handleEditorHistoryBeforeInput, handleEditorHistoryKeydown, handleNoteImageClick, handleNoteImagePaste, handleRichLinkClick, insertChecklistLine, markLinksOpenInNewTab, resetEditorHistory, snapshotEditorHistoryDebounced } from "../../utils/richTextEditor";

export function TareaGeneralModal({ tarea, unlocked, onRequestUnlock, onClose, onPatch, onDelete, currentUser, driveConnected, onMarkSeen }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [imgMenu, setImgMenu] = useState(null);
  const [previewImgUrl, setPreviewImgUrl] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [draft, setDraft] = useState({
    asignado: tarea.asignado, categoria: tarea.categoria, titulo: tarea.titulo, estado: tarea.estado, fecha: tarea.fecha,
  });
  const bodyRef = useRef(null);
  const dirty = Object.keys(draft).some((k) => draft[k] !== tarea[k]) || bodyDirty;

  useEffect(() => {
    if (onMarkSeen) onMarkSeen(tarea.id);
    // eslint-disable-next-line
  }, [tarea.id]);

  function addComment(html, autorNombre) {
    const c = { id: uid(), autor: autorNombre, texto: html, fecha: new Date().toISOString() };
    onPatch({ comentarios: [...(tarea.comentarios || []), c] });
  }
  function startEditComment(c) {
    setEditingCommentId(c.id);
  }
  function cancelEditComment() {
    setEditingCommentId(null);
  }
  function saveEditComment(html) {
    onPatch({
      comentarios: (tarea.comentarios || []).map((c) =>
        c.id === editingCommentId ? { ...c, texto: html, editedAt: new Date().toISOString() } : c
      ),
    });
    setEditingCommentId(null);
  }
  function deleteComment(id) {
    onPatch({ comentarios: (tarea.comentarios || []).filter((c) => c.id !== id) });
  }

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = cleanChecklistHtml(tarea.notas || "");
      markLinksOpenInNewTab(bodyRef.current);
      resetEditorHistory(bodyRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveDraft() {
    const patch = { ...draft };
    if (bodyRef.current) patch.notas = cleanChecklistHtml(bodyRef.current.innerHTML);
    onPatch(patch);
    setBodyDirty(false);
  }
  function attemptClose() {
    // Antes se guardaba solo, sin preguntar. Ahora, si hay cambios sin guardar,
    // se le pregunta al usuario qué hacer — tanto si cierra con la X como si hace clic afuera.
    if (dirty) { setShowUnsavedConfirm(true); return; }
    onClose();
  }
  function saveAndClose() { saveDraft(); setShowUnsavedConfirm(false); onClose(); }
  function discardAndClose() { setShowUnsavedConfirm(false); onClose(); }
  const [showChat, setShowChat] = useState(false);
  const chatBtnRef = useRef(null);

  return (
    <Overlay onClose={attemptClose}>
      <div className="modal large">
        <div className="modal-head">
          <h3>Tarea general</h3>
          <button type="button" className="icon-btn" onClick={attemptClose}><X size={16} /></button>
        </div>

        <div className={"task-modal-split" + (showChat ? "" : " task-modal-split-solo")}>
          <div className="task-modal-main">
            <LockGate unlocked={unlocked} onRequestUnlock={onRequestUnlock} blur={false}>
              <div className="detail-grid">
                <label className="field">
                  <span><User size={12} /> Asignado a</span>
                  <CustomSelect value={draft.asignado} onChange={(v) => setDraft({ ...draft, asignado: v })} disabled={!unlocked} options={DISENADORES} />
                </label>
                <label className="field">
                  <span><FolderKanban size={12} /> Categoría</span>
                  <input value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })} disabled={!unlocked} />
                </label>
                <label className="field">
                  <span><Calendar size={12} /> Fecha de inicio</span>
                  <CustomDatePicker value={draft.fecha} onChange={(v) => setDraft({ ...draft, fecha: v })} disabled={!unlocked} clearable />
                </label>
                {tarea.updatedAt && (
                  <label className="field">
                    <span><History size={12} /> Última corrección</span>
                    <div className="tareagen-readonly-date">
                      {new Date(tarea.updatedAt).toLocaleDateString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </label>
                )}
                <label className="field span2">
                  <span>Título</span>
                  <textarea value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} disabled={!unlocked} rows={2} />
                </label>
              </div>
            </LockGate>

            <label className="field span2 tareagen-estado-field">
              <span>Estado</span>
              <div className="status-pills">
                {TAREA_ESTADOS.map((e) => {
                  const active = draft.estado === e.id;
                  return (
                    <button
                      key={e.id} type="button" className={"pill" + (active ? " pill-active" : "")}
                      style={active ? { background: e.color + "cc", borderColor: e.color, color: "#fff" } : {}}
                      onClick={() => setDraft({ ...draft, estado: e.id })}
                    >
                      {e.label}
                    </button>
                  );
                })}
              </div>
            </label>

            <div className="detail-block">
              <h4><StickyNote size={13} /> Notas / detalle expandido</h4>
              <div
                className="note-body-editable tareagen-body"
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Guiones, ideas, links de referencia…"
                onInput={(e) => { setBodyDirty(true); snapshotEditorHistoryDebounced(e.currentTarget); }}
                onPaste={(e) => handleNoteImagePaste(e, bodyRef, () => setBodyDirty(true))}
                onContextMenu={(e) => handleNoteImageClick(e, setImgMenu)}
                onBeforeInput={(e) => handleEditorHistoryBeforeInput(e, bodyRef.current)}
                onKeyDown={(e) => { if (handleEditorHistoryKeydown(e, bodyRef.current)) return; handleChecklistEnterKey(e, () => setBodyDirty(true)); }}
                onClick={(e) => { if (handleRichLinkClick(e)) return; if (!handleCheckLineClick(e, () => setBodyDirty(true))) handleNoteImageClick(e, setImgMenu); }}
              />
              <ImageActionMenu
                menu={imgMenu}
                onClose={() => setImgMenu(null)}
                onExpand={() => { setPreviewImgUrl(imgMenu.src); setImgMenu(null); }}
                onDelete={() => { imgMenu.el.remove(); setBodyDirty(true); setImgMenu(null); }}
              />
              <RichToolbar targetRef={bodyRef} onAfterCommand={() => setBodyDirty(true)} extraButton={
                <button type="button" title="Insertar casilla de tarea" onMouseDown={(e) => { e.preventDefault(); insertChecklistLine(bodyRef, () => setBodyDirty(true)); }}>
                  <ListChecks size={14} />
                </button>
              } />
              <FloatingSelectionToolbar targetRef={bodyRef} onAfterCommand={() => setBodyDirty(true)} />
            </div>

            <AttachmentsBlock
              files={tarea.archivos || []}
              onAdd={(f) => onPatch({ archivos: [...(tarea.archivos || []), f] })}
              onRemove={(id) => onPatch({ archivos: (tarea.archivos || []).filter((f) => f.id !== id) })}
              onPreviewImage={(f) => setPreviewImgUrl(f.url)}
              driveConnected={driveConnected}
              driveFolderPath={`Administrativo / Tareas generales / ${draft.categoria || "General"} / ${monthFolderName(draft.fecha)}`}
              driveOnly
            />
          </div>
        </div>

        {previewImgUrl && (
          <ImagePreviewModal file={{ url: previewImgUrl, nombre: "Imagen de la tarea" }} onClose={() => setPreviewImgUrl(null)} />
        )}

        <div className="modal-footer modal-footer-row">
          {unlocked && (
            <button className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Eliminar</button>
          )}
          {!unlocked && <span />}
          <div className="modal-footer-right">
            <button
              type="button"
              ref={chatBtnRef}
              className={"chat-anchor-btn" + (showChat ? " chat-anchor-btn-active" : "")}
              onClick={() => setShowChat((s) => !s)}
              title="Comentarios y correcciones"
            >
              <MessageSquare size={16} />
              {(tarea.comentarios || []).length > 0 && <span className="chat-fab-badge">{tarea.comentarios.length}</span>}
            </button>
            <button className="btn-primary save-draft-btn" type="button" onClick={saveDraft} disabled={!dirty}>
              <CheckCircle2 size={14} /> Confirmar cambios
            </button>
          </div>
        </div>

        {showChat && (
          <TaskChatPanel
            title="Comentarios y correcciones"
            comentarios={tarea.comentarios}
            onClose={() => setShowChat(false)}
            currentUser={currentUser}
            anchorRef={chatBtnRef}
            editingCommentId={editingCommentId}
            onAddComment={addComment} onStartEdit={startEditComment} onCancelEdit={cancelEditComment} onSaveEdit={saveEditComment} onDeleteComment={deleteComment}
          />
        )}
      </div>

      {confirmDelete && (
        <Overlay onClose={() => setConfirmDelete(false)}>
          <div className="modal small confirm-warning-modal" style={{ maxWidth: 340 }}>
            <div className="modal-head">
              <h3><AlertTriangle size={16} color="#B4432F" /> ¿Eliminar esta tarea?</h3>
              <button type="button" className="icon-btn" onClick={() => setConfirmDelete(false)}><X size={16} /></button>
            </div>
            <p className="delete-client-warning">Esta acción es permanente y no se puede deshacer.</p>
            <button className="btn-danger full" type="button" onClick={onDelete}>Sí, eliminarla</button>
          </div>
        </Overlay>
      )}
      {showUnsavedConfirm && (
        <UnsavedChangesModal
          onSave={saveAndClose}
          onDiscard={discardAndClose}
          onCancel={() => setShowUnsavedConfirm(false)}
        />
      )}
    </Overlay>
  );
}
