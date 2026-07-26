import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  CheckCircle2,
  Trash2,
  ListChecks,
  Pin,
  Tag,
  Printer,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { UnsavedChangesModal } from "../common/UnsavedChangesModal";
import { NotePrintModal } from "./NotePrintModal";
import { FloatingSelectionToolbar, ImageActionMenu, RichToolbar } from "./RichEditorToolbar";
import { NOTE_COLORS, NOTE_SIZES, NOTE_TAGS } from "../../utils/constants";
import { clientMeta, fmtNoteDayTime, noteDetailMaxWidth, noteLinkColor, tagColor } from "../../utils/helpers";
import { cleanChecklistHtml, handleCheckLineClick, handleChecklistEnterKey, handleEditorHistoryBeforeInput, handleEditorHistoryKeydown, handleNoteImageClick, handleNoteImagePaste, handleRichLinkClick, insertChecklistLine, itemsToChecklistHTML, markLinksOpenInNewTab, resetEditorHistory, snapshotEditorHistoryDebounced } from "../../utils/richTextEditor";

export function NoteDetailModal({ note, showClient, onPatch, onDelete, onClose, onPreviewImage }) {
  const [titulo, setTitulo] = useState(note.titulo);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagText, setNewTagText] = useState("");
  const [imgMenu, setImgMenu] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const bodyRef = useRef(null);
  const cm = clientMeta(note.empresa);
  const CmIcon = cm.icon;
  const dirty = titulo !== note.titulo || bodyDirty;

  function addTag(t) {
    const clean = t.trim();
    if (!clean) return;
    const tags = note.tags || [];
    if (!tags.includes(clean)) onPatch({ tags: [...tags, clean] });
    setNewTagText("");
  }
  function removeTag(t) {
    onPatch({ tags: (note.tags || []).filter((x) => x !== t) });
  }

  useEffect(() => {
    // Las notas viejas en modo "solo lista" se migran una vez a casillas dentro del mismo texto libre.
    const initialHtml = cleanChecklistHtml(note.tipo === "lista" ? itemsToChecklistHTML(note.items) : (note.cuerpo || ""));
    if (bodyRef.current) {
      bodyRef.current.innerHTML = initialHtml;
      markLinksOpenInNewTab(bodyRef.current);
      resetEditorHistory(bodyRef.current);
    }
    if (note.tipo === "lista") onPatch({ tipo: "texto", cuerpo: initialHtml, items: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveDraft() {
    const patch = { titulo };
    if (bodyRef.current) patch.cuerpo = cleanChecklistHtml(bodyRef.current.innerHTML);
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

  return (
    <Overlay onClose={attemptClose}>
      <div
        className="modal small note-detail-modal"
        style={{ background: note.color || "#fff", "--note-link-color": noteLinkColor(note.color), maxWidth: noteDetailMaxWidth(note.size) }}
      >
        <div className="modal-head note-detail-head">
          <input
            className="note-title-input note-detail-title"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título"
          />
          <span
            className={"note-pin-btn" + (note.pinned ? " note-pin-active" : "")}
            onClick={() => onPatch({ pinned: !note.pinned })}
            title={note.pinned ? "Quitar de fijadas" : "Fijar nota"}
          >
            <Pin size={16} />
          </span>
          <button className="icon-btn" onClick={attemptClose}><X size={16} /></button>
        </div>

        {showClient && (
          <span className="note-card-empresa note-detail-empresa" style={{ color: cm.color }}><CmIcon size={12} />{note.empresa}</span>
        )}

        {note.createdAt && <div className="note-detail-date">{fmtNoteDayTime(note.createdAt)}</div>}

        <div className="note-tag-row note-detail-tags">
          {(note.tags || []).map((t) => (
            <span key={t} className="note-tag-chip note-tag-chip-removable" style={{ color: tagColor(t), background: tagColor(t) + "18" }}>
              {t}
              <button type="button" onClick={() => removeTag(t)}><X size={10} /></button>
            </span>
          ))}
          <div className="note-tag-add-wrap">
            <button type="button" className="note-tag-add-btn" onClick={() => setShowTagPicker((s) => !s)}><Tag size={11} /> Etiqueta</button>
            {showTagPicker && (
              <div className="note-tag-picker">
                {NOTE_TAGS.map((t) => {
                  const already = (note.tags || []).includes(t.label);
                  return (
                    <button key={t.key} type="button" className="note-tag-picker-item" style={{ color: t.color, opacity: already ? 0.4 : 1 }} disabled={already} onClick={() => addTag(t.label)}>{t.label}</button>
                  );
                })}
                <div className="note-tag-picker-divider">Crear nueva</div>
                <div className="note-tag-picker-new">
                  <input
                    className="note-tag-picker-input"
                    placeholder="Nombre de la etiqueta…"
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(newTagText); } }}
                  />
                  <button type="button" className="note-tag-picker-add" onClick={() => addTag(newTagText)} disabled={!newTagText.trim()}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="note-body-editable note-detail-body"
          ref={bodyRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => { setBodyDirty(true); snapshotEditorHistoryDebounced(e.currentTarget); }}
          onPaste={(e) => handleNoteImagePaste(e, bodyRef, () => setBodyDirty(true))}
          onContextMenu={(e) => handleNoteImageClick(e, setImgMenu)}
          onBeforeInput={(e) => handleEditorHistoryBeforeInput(e, bodyRef.current)}
          onKeyDown={(e) => { if (handleEditorHistoryKeydown(e, bodyRef.current)) return; handleChecklistEnterKey(e, () => setBodyDirty(true)); }}
          onClick={(e) => { if (handleRichLinkClick(e)) return; if (!handleCheckLineClick(e, () => setBodyDirty(true))) handleNoteImageClick(e, setImgMenu); }}
        />
        <FloatingSelectionToolbar targetRef={bodyRef} onAfterCommand={() => setBodyDirty(true)} />
        <ImageActionMenu
          menu={imgMenu}
          onClose={() => setImgMenu(null)}
          onExpand={() => { onPreviewImage(imgMenu.src); setImgMenu(null); }}
          onDelete={() => { imgMenu.el.remove(); setBodyDirty(true); setImgMenu(null); }}
        />

        <div className="note-card-foot">
          <RichToolbar targetRef={bodyRef} onAfterCommand={() => setBodyDirty(true)} />
          <div className="note-card-actions">
            <button type="button" className="icon-btn subtle" title="Insertar casilla de tarea" onClick={() => insertChecklistLine(bodyRef, () => setBodyDirty(true))}>
              <ListChecks size={14} />
            </button>
            <div className="note-color-row">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c} type="button" className={"note-swatch" + (note.color === c ? " note-swatch-active" : "")}
                  style={{ background: c }} onClick={() => onPatch({ color: c })}
                />
              ))}
            </div>
            <div className="note-size-row" title="Tamaño de nota">
              {NOTE_SIZES.map((s) => (
                <button
                  key={s.value} type="button"
                  className={"note-size-btn" + ((note.size || "standard") === s.value ? " note-size-btn-active" : "")}
                  onClick={() => onPatch({ size: s.value })}
                  title={s.label}
                >
                  {s.short}
                </button>
              ))}
            </div>
            <span className="note-detail-right-actions">
              <button type="button" className="icon-btn subtle" title="Imprimir / Compartir" onClick={() => setShowPrint(true)}><Printer size={14} /></button>
              <button type="button" className="btn-primary note-save-btn" onClick={saveDraft} disabled={!dirty}>
                <CheckCircle2 size={13} /> Guardar
              </button>
              <button type="button" className="icon-btn subtle" title="Enviar a la papelera" onClick={onDelete}><Trash2 size={14} /></button>
            </span>
          </div>
        </div>
      </div>
      {showPrint && <NotePrintModal note={note} onClose={() => setShowPrint(false)} />}
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
