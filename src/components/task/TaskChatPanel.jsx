import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  PenTool,
  CheckCircle2,
  Trash2,
  Send,
} from "lucide-react";
import { SidePanel } from "../common/SidePanel";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { ImageActionMenu, MiniRichToolbar } from "../notes/RichEditorToolbar";
import { darkenHex, initial } from "../../utils/helpers";
import { handleNoteImageClick, handleNoteImagePaste, handleRichLinkClick } from "../../utils/richTextEditor";

export function TaskChatPanel({
  title, comentarios, onClose, currentUser, accentColor,
  editingCommentId, onAddComment, onStartEdit, onCancelEdit, onSaveEdit, onDeleteComment,
}) {
  const listRef = useRef(null);
  const composeRef = useRef(null);
  const editRef = useRef(null);
  const [composeEmpty, setComposeEmpty] = useState(true);
  const [editEmpty, setEditEmpty] = useState(true);
  const [imgMenu, setImgMenu] = useState(null);
  const [previewImgUrl, setPreviewImgUrl] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function canStillDelete(c) {
    return Date.now() - new Date(c.fecha).getTime() < 30 * 60 * 1000;
  }

  function hasContent(el) {
    if (!el) return false;
    if (el.querySelector("img")) return true;
    return !!el.textContent.trim();
  }

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comentarios]);

  useEffect(() => {
    if (editingCommentId && editRef.current) {
      const c = (comentarios || []).find((x) => x.id === editingCommentId);
      editRef.current.innerHTML = c ? c.texto : "";
      setEditEmpty(!hasContent(editRef.current));
      editRef.current.focus();
    }
  }, [editingCommentId]);

  function submitCompose() {
    const el = composeRef.current;
    if (!hasContent(el)) return;
    onAddComment(el.innerHTML, currentUser?.nombre || "Alguien");
    if (el) el.innerHTML = "";
    setComposeEmpty(true);
  }
  function submitEdit() {
    const el = editRef.current;
    if (!hasContent(el)) return;
    onSaveEdit(el.innerHTML);
  }

  return (
    <SidePanel
      title={title}
      icon={MessageSquare}
      onClose={onClose}
      className="comments-side-panel"
      style={accentColor ? { "--primary": accentColor } : undefined}
    >
      <div className="comment-list task-chat-messages" ref={listRef}>
        {(comentarios || []).length === 0 && <div className="hint">Sin comentarios todavía.</div>}
        {(comentarios || []).map((c) => {
          const isMine = c.autor === currentUser?.nombre;
          const canDelete = canStillDelete(c);
          const hora = new Date(c.fecha).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
          return (
            <div className={"chat-msg-row" + (isMine ? " chat-msg-row-mine" : "")} key={c.id}>
              <span className="avatar small chat-msg-avatar" style={{ background: isMine ? (accentColor || "var(--primary)") : "#8A8578" }} title={c.autor}>
                {initial(c.autor)}
              </span>
              <div className="chat-msg-col">
                <div className="chat-msg-meta">
                  <span className="chat-msg-time">{hora}</span>
                  <span className="chat-msg-name">{c.autor}</span>
                </div>
                {editingCommentId === c.id ? (
                  <div className="comment-edit-box">
                    <MiniRichToolbar targetRef={editRef} onAfterCommand={() => setEditEmpty(!hasContent(editRef.current))} />
                    <div
                      className="comment-editable"
                      ref={editRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={() => setEditEmpty(!hasContent(editRef.current))}
                      onPaste={(e) => handleNoteImagePaste(e, editRef, () => setEditEmpty(!hasContent(editRef.current)))}
                      onContextMenu={(e) => handleNoteImageClick(e, setImgMenu)}
                      onClick={(e) => { if (handleRichLinkClick(e)) return; handleNoteImageClick(e, setImgMenu); }}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitEdit(); }}
                    />
                    <div className="comment-edit-actions">
                      <button type="button" className="btn-primary comment-edit-save" onClick={submitEdit} disabled={editEmpty}>
                        <CheckCircle2 size={12} /> Guardar
                      </button>
                      <button type="button" className="btn-secondary comment-edit-cancel" onClick={onCancelEdit}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className={"chat-msg-bubble" + (isMine ? " chat-msg-bubble-mine" : " chat-msg-bubble-other")}
                      style={isMine ? { background: `linear-gradient(135deg, ${accentColor || "#1D3557"}, ${darkenHex(accentColor || "#1D3557", 0.18)})` } : {}}
                      dangerouslySetInnerHTML={{ __html: c.texto }}
                      onClick={(e) => { if (handleRichLinkClick(e)) return; handleNoteImageClick(e, setImgMenu); }}
                    />
                    {c.editedAt && <span className="comment-edited-tag">editado</span>}
                    <div className="chat-msg-actions">
                      <button type="button" onClick={() => onStartEdit(c)}><PenTool size={10} /> Editar</button>
                      {canDelete && (
                        confirmDeleteId === c.id ? (
                          <>
                            <span className="chat-msg-confirm-text">¿Eliminar?</span>
                            <button type="button" className="chat-msg-confirm-yes" onClick={() => { onDeleteComment(c.id); setConfirmDeleteId(null); }}>Sí</button>
                            <button type="button" onClick={() => setConfirmDeleteId(null)}>No</button>
                          </>
                        ) : (
                          <button type="button" onClick={() => setConfirmDeleteId(c.id)}><Trash2 size={10} /> Eliminar</button>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="add-comment task-chat-input">
        <MiniRichToolbar targetRef={composeRef} onAfterCommand={() => setComposeEmpty(!hasContent(composeRef.current))} forceUp />
        <div className="comment-input-row">
          <div
            className="comment-editable comment-compose"
            ref={composeRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Escribe una corrección o comentario… (puedes pegar una imagen)"
            onInput={() => setComposeEmpty(!hasContent(composeRef.current))}
            onPaste={(e) => handleNoteImagePaste(e, composeRef, () => setComposeEmpty(!hasContent(composeRef.current)))}
            onContextMenu={(e) => handleNoteImageClick(e, setImgMenu)}
            onClick={(e) => { if (handleRichLinkClick(e)) return; handleNoteImageClick(e, setImgMenu); }}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitCompose(); }}
          />
          <button type="button" className="btn-primary comment-send-btn" onClick={submitCompose} disabled={composeEmpty}>
            <Send size={13} />
          </button>
        </div>
      </div>

      <ImageActionMenu
        menu={imgMenu}
        onClose={() => setImgMenu(null)}
        onExpand={() => { setPreviewImgUrl(imgMenu.src); setImgMenu(null); }}
        onDelete={() => { imgMenu.el.remove(); setImgMenu(null); setComposeEmpty(!hasContent(composeRef.current)); setEditEmpty(!hasContent(editRef.current)); }}
      />
      {previewImgUrl && (
        <ImagePreviewModal file={{ url: previewImgUrl, nombre: "Imagen del comentario" }} onClose={() => setPreviewImgUrl(null)} />
      )}
    </SidePanel>
  );
}
