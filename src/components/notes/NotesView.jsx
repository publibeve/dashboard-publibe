import { useState, useEffect, useRef } from "react";
import {
  Trash2,
  History,
  Pin,
} from "lucide-react";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { NoteCard } from "./NoteCard";
import { NoteComposer } from "./NoteComposer";
import { NoteDetailModal } from "./NoteDetailModal";

export function NotesView({ notes, trashedNotes, showClient, defaultClient, onAdd, onPatch, onTrash, onRestore, onPurge, showTrash, tagFilter, driveConnected }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [openNoteId, setOpenNoteId] = useState(null);
  const [previewImgUrl, setPreviewImgUrl] = useState(null);

  const tagFiltered = tagFilter === "Todas" ? notes : notes.filter((n) => (n.tags || []).includes(tagFilter));
  const pinned = tagFiltered.filter((n) => n.pinned);
  const others = tagFiltered.filter((n) => !n.pinned);
  const openNote = notes.find((n) => n.id === openNoteId);

  function daysLeft(deletedAt) {
    const elapsed = Date.now() - new Date(deletedAt).getTime();
    return Math.max(0, 30 - Math.floor(elapsed / (24 * 60 * 60 * 1000)));
  }

  return (
    <main className="pane notes-pane">
      {!showTrash && (
        <div className="notes-top-row">
          <div className="note-composer-wrap">
            <NoteComposer
              open={composerOpen}
              onOpen={() => setComposerOpen(true)}
              onClose={() => setComposerOpen(false)}
              defaultClient={defaultClient}
              showClient={showClient}
              onCreate={(n) => { onAdd(n); setComposerOpen(false); }}
            />
          </div>
        </div>
      )}

      {showTrash ? (
        trashedNotes.length === 0 ? (
          <div className="empty-pane">La papelera está vacía.</div>
        ) : (
          <>
            <div className="hint trash-hint">Las notas se eliminan definitivamente 30 días después de enviarlas a la papelera.</div>
            <MasonryGrid
              items={trashedNotes}
              renderItem={(n) => (
                <div className="note-card note-card-trashed" style={{ background: n.color || "#fff" }}>
                  <span className="note-card-title">{n.titulo || <span className="note-untitled">Sin título</span>}</span>
                  <span className="trash-days-left">Se elimina en {daysLeft(n.deletedAt)} día(s)</span>
                  <div className="trash-actions">
                    <button className="btn-secondary" onClick={() => onRestore(n.id)}><History size={12} /> Restaurar</button>
                    <button className="btn-danger-ghost" onClick={() => onPurge(n.id)}><Trash2 size={12} /> Eliminar ya</button>
                  </div>
                </div>
              )}
            />
          </>
        )
      ) : notes.length === 0 ? (
        <div className="empty-pane">Aún no hay notas. Usa el cuadro de arriba para crear la primera.</div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="notes-section">
              <div className="notes-section-label"><Pin size={12} /> Fijadas</div>
              <MasonryGrid
                items={pinned}
                renderItem={(n) => (
                  <NoteCard note={n} showClient={showClient} onOpen={() => setOpenNoteId(n.id)} onTogglePin={() => onPatch(n.id, { pinned: !n.pinned })} />
                )}
              />
            </div>
          )}
          {others.length > 0 && (
            <div className="notes-section">
              {pinned.length > 0 && <div className="notes-section-label">Otras</div>}
              <MasonryGrid
                items={others}
                renderItem={(n) => (
                  <NoteCard note={n} showClient={showClient} onOpen={() => setOpenNoteId(n.id)} onTogglePin={() => onPatch(n.id, { pinned: !n.pinned })} />
                )}
              />
            </div>
          )}
        </>
      )}

      {openNote && (
        <NoteDetailModal
          note={openNote}
          showClient={showClient}
          onPatch={(patch) => onPatch(openNote.id, patch)}
          onDelete={() => { onTrash(openNote.id); setOpenNoteId(null); }}
          onClose={() => setOpenNoteId(null)}
          onPreviewImage={setPreviewImgUrl}
        />
      )}

      {previewImgUrl && (
        <ImagePreviewModal file={{ url: previewImgUrl, nombre: "Imagen de la nota" }} onClose={() => setPreviewImgUrl(null)} />
      )}
    </main>
  );
}

export function MasonryGrid({ items, gap = 16, minColWidth = 320, renderItem }) {
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const [containerWidth, setContainerWidth] = useState(0);
  const [heights, setHeights] = useState({});

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width));
    ro.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const colCount = Math.max(1, Math.floor((containerWidth + gap) / (minColWidth + gap)));
  const colWidth = colCount > 0 ? (containerWidth - gap * (colCount - 1)) / colCount : containerWidth;
  const allIds = items.map((i) => i.id);

  // Cada tarjeta tiene su propio observador de tamaño — así, si una imagen adentro
  // termina de cargar después (o cualquier otro contenido cambia de alto), el
  // acomodo se recalcula solo, sin depender de que la ventana se redimensione.
  useEffect(() => {
    const observers = [];
    allIds.forEach((id) => {
      const el = itemRefs.current[id];
      if (!el) return;
      const ro = new ResizeObserver((entries) => {
        const h = entries[0].contentRect.height;
        setHeights((prev) => (Math.abs((prev[id] || 0) - h) > 1 ? { ...prev, [id]: h } : prev));
      });
      ro.observe(el);
      observers.push(ro);
    });
    return () => observers.forEach((ro) => ro.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIds.join(","), colWidth]);

  // Empaqueta cada tarjeta en la columna más corta según su altura real (estilo Tetris), en el orden dado (cronológico).
  const positions = {};
  const colHeights = new Array(colCount).fill(0);
  allIds.forEach((id) => {
    const h = heights[id] || 180;
    let col = 0;
    for (let c = 1; c < colHeights.length; c++) if (colHeights[c] < colHeights[col]) col = c;
    positions[id] = { left: col * (colWidth + gap), top: colHeights[col] };
    colHeights[col] += h + gap;
  });
  const containerHeight = Math.max(0, ...colHeights) - (allIds.length ? gap : 0);

  return (
    <div ref={containerRef} className="masonry-grid" style={{ height: containerHeight > 0 ? containerHeight : undefined }}>
      {allIds.map((id) => {
        const item = items.find((i) => i.id === id);
        if (!item) return null;
        const pos = positions[id] || { left: 0, top: 0 };
        return (
          <div
            key={id}
            ref={(el) => { itemRefs.current[id] = el; }}
            className="masonry-item"
            style={{ transform: `translate(${pos.left}px, ${pos.top}px)`, width: colWidth || "auto" }}
          >
            {renderItem(item)}
          </div>
        );
      })}
    </div>
  );
}
