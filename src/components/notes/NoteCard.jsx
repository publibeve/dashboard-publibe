import { useState, useEffect, useRef } from "react";
import {
  Pin,
  Square,
  CheckSquare,
} from "lucide-react";
import { clientMeta, fmtNoteDay, noteLinkColor, tagColor } from "../../utils/helpers";

export function NoteCard({ note, showClient, onOpen, onTogglePin }) {
  const cm = clientMeta(note.empresa);
  const CmIcon = cm.icon;
  const previewItems = (note.items || []).slice(0, 5);
  const extraItems = (note.items || []).length - previewItems.length;
  const htmlRef = useRef(null);
  const [overflowed, setOverflowed] = useState(false);

  useEffect(() => {
    if (note.tipo === "texto" && htmlRef.current) {
      setOverflowed(htmlRef.current.scrollHeight > htmlRef.current.clientHeight + 2);
    }
  }, [note.tipo, note.cuerpo]);

  const hasBody = (note.cuerpo || "").replace(/<[^>]+>/g, "").trim().length > 0;

  return (
    <button
      className="note-card note-card-preview"
      style={{ background: note.color || "#fff", "--note-link-color": noteLinkColor(note.color) }}
      onClick={onOpen}
    >
      <div className="note-card-head">
        <span className="note-card-title">{note.titulo || <span className="note-untitled">Sin título</span>}</span>
        <span
          className={"note-pin-btn" + (note.pinned ? " note-pin-active" : "")}
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          title={note.pinned ? "Quitar de fijadas" : "Fijar nota"}
        >
          <Pin size={14} />
        </span>
      </div>

      <div className="note-card-meta">
        {showClient && (
          <span className="note-card-empresa" style={{ color: cm.color }}><CmIcon size={11} />{note.empresa}</span>
        )}
        {note.createdAt && <span className="note-card-date">{fmtNoteDay(note.createdAt)}</span>}
      </div>

      {(note.tags || []).length > 0 && (
        <div className="note-tag-row">
          {note.tags.map((t) => (
            <span key={t} className="note-tag-chip" style={{ color: tagColor(t), background: tagColor(t) + "18" }}>{t}</span>
          ))}
        </div>
      )}

      {note.tipo === "texto" ? (
        <>
          {hasBody ? (
            <div className="note-preview-html" ref={htmlRef} dangerouslySetInnerHTML={{ __html: note.cuerpo }} />
          ) : (
            <span className="note-untitled">Sin contenido</span>
          )}
          {overflowed && <span className="note-expand-hint">Expandir para ver más…</span>}
        </>
      ) : (
        <div className="note-preview-list">
          {previewItems.length === 0 && <span className="note-untitled">Sin elementos</span>}
          {previewItems.map((it) => (
            <div className="note-preview-check-row" key={it.id}>
              {it.marcado ? <CheckSquare size={13} /> : <Square size={13} />}
              <span className={it.marcado ? "checked" : ""}>{it.texto}</span>
            </div>
          ))}
          {extraItems > 0 && <span className="note-expand-hint">+{extraItems} más — expandir para ver todo</span>}
        </div>
      )}
    </button>
  );
}
