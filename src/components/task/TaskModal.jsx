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
  ListChecks,
} from "lucide-react";
import { AttachmentsBlock } from "../common/AttachmentsBlock";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { EmpresaField } from "../common/EmpresaField";
import { LockGate } from "../common/LockGate";
import { Overlay } from "../common/Overlay";
import { FloatingSelectionToolbar, ImageActionMenu, RichToolbar } from "../notes/RichEditorToolbar";
import { TaskChatPanel } from "./TaskChatPanel";
import { DISENADORES, ESTADOS } from "../../utils/constants";
import { clientMeta, uid } from "../../utils/helpers";
import { cleanChecklistHtml, handleCheckLineClick, handleChecklistEnterKey, handleEditorHistoryBeforeInput, handleEditorHistoryKeydown, handleNoteImageClick, handleNoteImagePaste, handleRichLinkClick, insertChecklistLine, markLinksOpenInNewTab, resetEditorHistory, snapshotEditorHistoryDebounced } from "../../utils/richTextEditor";

export function TaskModal({ task, onClose, onPatch, onDelete, unlocked, onRequestUnlock, onPreviewImage, currentUser, driveConnected, onMarkSeen }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [notasDirty, setNotasDirty] = useState(false);
  const [imgMenu, setImgMenu] = useState(null);
  const notasBodyRef = useRef(null);
  const [draft, setDraft] = useState({
    titulo: task.titulo, empresa: task.empresa, asignado: task.asignado,
    fechaSolicitud: task.fechaSolicitud, fechaEntrega: task.fechaEntrega,
    estado: task.estado,
  });
  const accent = clientMeta(task.empresa).color;
  const dirty = Object.keys(draft).some((k) => draft[k] !== task[k]) || notasDirty;

  useEffect(() => {
    if (onMarkSeen) onMarkSeen(task.id);
    // eslint-disable-next-line
  }, [task.id]);

  useEffect(() => {
    if (notasBodyRef.current) {
      notasBodyRef.current.innerHTML = cleanChecklistHtml(task.notas || "");
      markLinksOpenInNewTab(notasBodyRef.current);
      resetEditorHistory(notasBodyRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addComment(html, autorNombre) {
    const c = { id: uid(), autor: autorNombre, texto: html, fecha: new Date().toISOString() };
    onPatch({ comentarios: [...(task.comentarios || []), c] });
  }
  function startEditComment(c) {
    setEditingCommentId(c.id);
  }
  function cancelEditComment() {
    setEditingCommentId(null);
  }
  function saveEditComment(html) {
    onPatch({
      comentarios: (task.comentarios || []).map((c) =>
        c.id === editingCommentId ? { ...c, texto: html, editedAt: new Date().toISOString() } : c
      ),
    });
    setEditingCommentId(null);
  }
  function deleteComment(id) {
    onPatch({ comentarios: (task.comentarios || []).filter((c) => c.id !== id) });
  }
  function saveDraft() {
    const patch = { ...draft };
    if (notasBodyRef.current) patch.notas = cleanChecklistHtml(notasBodyRef.current.innerHTML);
    onPatch(patch);
    setNotasDirty(false);
    onClose();
  }

  const [showChat, setShowChat] = useState(false);
  const chatBtnRef = useRef(null);

  return (
    <Overlay onClose={onClose}>
      <div className="modal large" style={{ "--primary": accent }}>
        <div className="modal-head">
          {unlocked ? (
            <input className="title-input" value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} />
          ) : (
            <span className="title-input title-readonly">{task.titulo}</span>
          )}
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <LockGate unlocked={unlocked} onRequestUnlock={onRequestUnlock} blur={false}>
          <div className={"task-modal-split" + (showChat ? "" : " task-modal-split-solo")}>
            <div className="task-modal-main">
              <div className="detail-grid">
                <EmpresaField locked value={draft.empresa} onChange={() => {}} />

                <label className="field">
                  <span><User size={12} /> Asignado a</span>
                  <CustomSelect value={draft.asignado} onChange={(v) => setDraft({ ...draft, asignado: v })} disabled={!unlocked} options={DISENADORES} />
                </label>

                <label className="field">
                  <span><Calendar size={12} /> Solicitado</span>
                  <CustomDatePicker value={draft.fechaSolicitud || ""} onChange={(v) => setDraft({ ...draft, fechaSolicitud: v })} disabled={!unlocked} clearable />
                </label>

                <label className="field">
                  <span><Calendar size={12} /> Entrega</span>
                  <CustomDatePicker value={draft.fechaEntrega || ""} onChange={(v) => setDraft({ ...draft, fechaEntrega: v })} disabled={!unlocked} clearable />
                </label>

                <div className="field span2 detail-block">
                  <span><StickyNote size={12} /> Notas de diseño</span>
                  <div
                    className={"note-body-editable tareagen-body" + (!unlocked ? " locked-editable" : "")}
                    ref={notasBodyRef}
                    contentEditable={unlocked}
                    suppressContentEditableWarning
                    data-placeholder="Información esencial que sí o sí debe aparecer. Ej: el flyer debe decir en grande 'Promoción 50%'."
                    onInput={(e) => { setNotasDirty(true); snapshotEditorHistoryDebounced(e.currentTarget); }}
                    onPaste={(e) => handleNoteImagePaste(e, notasBodyRef, () => setNotasDirty(true))}
                    onBeforeInput={(e) => handleEditorHistoryBeforeInput(e, notasBodyRef.current)}
                    onKeyDown={(e) => { if (handleEditorHistoryKeydown(e, notasBodyRef.current)) return; handleChecklistEnterKey(e, () => setNotasDirty(true)); }}
                    onClick={(e) => { if (handleRichLinkClick(e)) return; if (!handleCheckLineClick(e, () => setNotasDirty(true))) handleNoteImageClick(e, setImgMenu); }}
                  />
                  {unlocked && (
                    <>
                      <ImageActionMenu
                        menu={imgMenu}
                        onClose={() => setImgMenu(null)}
                        onExpand={() => { onPreviewImage({ url: imgMenu.src }); setImgMenu(null); }}
                        onDelete={() => { imgMenu.el.remove(); setNotasDirty(true); setImgMenu(null); }}
                      />
                      <RichToolbar targetRef={notasBodyRef} onAfterCommand={() => setNotasDirty(true)} extraButton={
                        <button type="button" title="Insertar casilla de tarea" onMouseDown={(e) => { e.preventDefault(); insertChecklistLine(notasBodyRef, () => setNotasDirty(true)); }}>
                          <ListChecks size={14} />
                        </button>
                      } />
                      <FloatingSelectionToolbar targetRef={notasBodyRef} onAfterCommand={() => setNotasDirty(true)} />
                    </>
                  )}
                </div>

                <label className="field span2">
                  <span>Estado</span>
                  <div className="status-pills">
                    {ESTADOS.map((s) => {
                      const Icon = s.icon;
                      const active = draft.estado === s.id;
                      return (
                        <button key={s.id} type="button" className={"pill" + (active ? " pill-active" : "")}
                          style={active ? { background: s.dot, borderColor: s.dot, color: "#fff", boxShadow: `0 4px 12px ${s.dot}55` } : {}}
                          onClick={() => setDraft({ ...draft, estado: s.id })} disabled={!unlocked}>
                          <Icon size={13} /> {s.label}
                        </button>
                      );
                    })}
                  </div>
                </label>
              </div>

              <AttachmentsBlock
                files={task.archivos || []}
                onAdd={(f) => onPatch({ archivos: [...(task.archivos || []), f] })}
                onRemove={(id) => onPatch({ archivos: (task.archivos || []).filter((f) => f.id !== id) })}
                onPreviewImage={onPreviewImage}
                driveConnected={driveConnected}
                driveFolderPath={`${task.empresa} / Creativos`}
                driveOnly
              />
            </div>
          </div>
        </LockGate>

        <div className="modal-footer modal-footer-row">
          {unlocked && !confirmDelete && (
            <button className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Eliminar tarea</button>
          )}
          {unlocked && confirmDelete && (
            <div className="confirm-row">
              <span><AlertTriangle size={13} /> ¿Enviar a la papelera?</span>
              <button className="btn-danger" onClick={onDelete}>Sí, eliminar</button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
            </div>
          )}
          {!unlocked && <span />}
          <div className="modal-footer-right">
            <button
              type="button"
              ref={chatBtnRef}
              className={"chat-anchor-btn" + (showChat ? " chat-anchor-btn-active" : "")}
              style={{ background: accent }}
              onClick={() => setShowChat((s) => !s)}
              title="Comentarios y correcciones"
            >
              <MessageSquare size={16} />
              {(task.comentarios || []).length > 0 && <span className="chat-fab-badge">{task.comentarios.length}</span>}
            </button>
            {unlocked && (
              <button className="btn-primary save-draft-btn" type="button" onClick={saveDraft} disabled={!dirty}>
                <CheckCircle2 size={14} /> Guardar cambios
              </button>
            )}
          </div>
        </div>

        {showChat && (
          <TaskChatPanel
            title="Comentarios y correcciones"
            comentarios={task.comentarios}
            onClose={() => setShowChat(false)}
            currentUser={currentUser}
            accentColor={accent}
            anchorRef={chatBtnRef}
            editingCommentId={editingCommentId}
            onAddComment={addComment} onStartEdit={startEditComment} onCancelEdit={cancelEditComment} onSaveEdit={saveEditComment} onDeleteComment={deleteComment}
          />
        )}
      </div>
    </Overlay>
  );
}
