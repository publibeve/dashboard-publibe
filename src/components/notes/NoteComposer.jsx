import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  StickyNote,
  ListChecks,
  Tag,
} from "lucide-react";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { FloatingSelectionToolbar, ImageActionMenu, RichToolbar } from "./RichEditorToolbar";
import { NOTE_COLORS, NOTE_SIZES, NOTE_TAGS } from "../../utils/constants";
import { tagColor, uid } from "../../utils/helpers";
import { cleanChecklistHtml, handleCheckLineClick, handleChecklistEnterKey, handleEditorHistoryBeforeInput, handleEditorHistoryKeydown, handleNoteImageClick, handleNoteImagePaste, handleRichLinkClick, insertChecklistLine, resetEditorHistory, snapshotEditorHistoryDebounced } from "../../utils/richTextEditor";

export function NoteComposer({ open, onOpen, onClose, defaultClient, showClient, onCreate }) {
  const [titulo, setTitulo] = useState("");
  const [composerPreviewImg, setComposerPreviewImg] = useState(null);
  const [imgMenu, setImgMenu] = useState(null);
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [size, setSize] = useState("standard");
  const [tags, setTags] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagText, setNewTagText] = useState("");
  const bodyRef = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (open && ref.current && !ref.current.contains(e.target)) handleClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
    // eslint-disable-next-line
  }, [open, titulo]);

  function reset() {
    setTitulo("");
    setColor(NOTE_COLORS[0]);
    setSize("standard");
    setTags([]);
    setShowTagPicker(false);
    setNewTagText("");
    if (bodyRef.current) {
      bodyRef.current.innerHTML = "";
      resetEditorHistory(bodyRef.current);
    }
  }
  function addTag(t) {
    const clean = t.trim();
    if (!clean || tags.includes(clean)) return;
    setTags([...tags, clean]);
    setNewTagText("");
    setShowTagPicker(false);
  }
  function removeTag(t) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleClose() {
    const cuerpo = bodyRef.current ? cleanChecklistHtml(bodyRef.current.innerHTML) : "";
    const hasContent = titulo.trim() || cuerpo.replace(/<[^>]+>/g, "").trim();
    if (hasContent) {
      onCreate({
        id: uid(), empresa: defaultClient, titulo: titulo.trim(), tipo: "texto",
        cuerpo, items: [],
        color, size, pinned: false, tags, createdAt: new Date().toISOString(), orden: Date.now(),
      });
    }
    reset();
    onClose();
  }

  if (!open) {
    return (
      <button className="note-collapsed" onClick={onOpen}>
        <StickyNote size={15} />
        <span>Toma una nota…</span>
      </button>
    );
  }

  return (
    <div className="note-composer" ref={ref} style={{ background: color }}>
      <input
        className="note-title-input"
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        autoFocus
      />

      <div className="note-tag-row">
        {tags.map((t) => (
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
                const already = tags.includes(t.label);
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
        className="note-body-editable"
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Crea una nota…"
        onInput={(e) => snapshotEditorHistoryDebounced(e.currentTarget)}
        onPaste={(e) => handleNoteImagePaste(e, bodyRef, () => {})}
        onContextMenu={(e) => handleNoteImageClick(e, setImgMenu)}
        onBeforeInput={(e) => handleEditorHistoryBeforeInput(e, bodyRef.current)}
        onKeyDown={(e) => { if (handleEditorHistoryKeydown(e, bodyRef.current)) return; handleChecklistEnterKey(e, () => {}); }}
        onClick={(e) => { if (handleRichLinkClick(e)) return; if (!handleCheckLineClick(e, () => {})) handleNoteImageClick(e, setImgMenu); }}
      />
      <ImageActionMenu
        menu={imgMenu}
        onClose={() => setImgMenu(null)}
        onExpand={() => { setComposerPreviewImg(imgMenu.src); setImgMenu(null); }}
        onDelete={() => { imgMenu.el.remove(); setImgMenu(null); }}
      />

      <FloatingSelectionToolbar targetRef={bodyRef} onAfterCommand={() => {}} />
      <div className="note-composer-foot">
        <RichToolbar targetRef={bodyRef} onAfterCommand={() => {}} extraButton={
          <button type="button" title="Insertar casilla de tarea" onMouseDown={(e) => { e.preventDefault(); insertChecklistLine(bodyRef, () => {}); }}>
            <ListChecks size={14} />
          </button>
        } />
        <div className="note-color-row">
          {NOTE_COLORS.map((c) => (
            <button
              key={c} type="button" className={"note-swatch" + (color === c ? " note-swatch-active" : "")}
              style={{ background: c }} onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="note-size-row" title="Tamaño de nota">
          {NOTE_SIZES.map((s) => (
            <button
              key={s.value} type="button"
              className={"note-size-btn" + (size === s.value ? " note-size-btn-active" : "")}
              onClick={() => setSize(s.value)}
              title={s.label}
            >
              {s.short}
            </button>
          ))}
        </div>
        {showClient && <span className="note-composer-client">{defaultClient}</span>}
        <button className="btn-primary note-close-btn" onClick={handleClose}>Cerrar</button>
      </div>
      {composerPreviewImg && (
        <ImagePreviewModal file={{ url: composerPreviewImg, nombre: "Imagen de la nota" }} onClose={() => setComposerPreviewImg(null)} />
      )}
    </div>
  );
}
