import { useState } from "react";
import {
  Trash2,
  History,
  Clapperboard,
} from "lucide-react";
import { MasonryGrid } from "../notes/NotesView";
import { GuionCard } from "./GuionCard";
import { GuionDetailModal } from "./GuionDetailModal";
import { NewGuionModal } from "./NewGuionModal";

export function GuionesView({
  guiones = [], trashedGuiones = [], showClient, defaultClient,
  onAdd, onPatch, onTrash, onRestore, onPurge, showTrash,
  openGuionId: openGuionIdProp, onOpenGuion,
}) {
  const [showNew, setShowNew] = useState(false);
  const [openGuionIdLocal, setOpenGuionIdLocal] = useState(null);
  // Mismo patrón que openNoteId/subTab: controlado desde afuera (App.jsx,
  // para la URL) si se pasan las props; si no, estado propio.
  const openGuionId = openGuionIdProp !== undefined ? openGuionIdProp : openGuionIdLocal;
  const setOpenGuionId = onOpenGuion || setOpenGuionIdLocal;
  const openGuion = guiones.find((g) => g.id === openGuionId);

  function daysLeft(deletedAt) {
    const elapsed = Date.now() - new Date(deletedAt).getTime();
    return Math.max(0, 30 - Math.floor(elapsed / (24 * 60 * 60 * 1000)));
  }

  return (
    <main className="pane notes-pane">
      {!showTrash && (
        <div className="notes-top-row">
          <button type="button" className="btn-primary" onClick={() => setShowNew(true)}>
            <Clapperboard size={14} /> Nuevo guion
          </button>
        </div>
      )}

      {showTrash ? (
        trashedGuiones.length === 0 ? (
          <div className="empty-pane">La papelera está vacía.</div>
        ) : (
          <>
            <div className="hint trash-hint">Los guiones se eliminan definitivamente 30 días después de enviarlos a la papelera.</div>
            <MasonryGrid
              items={trashedGuiones}
              renderItem={(g) => (
                <div className="note-card note-card-trashed" style={{ background: g.color || "#fff" }}>
                  <span className="note-card-title">{g.titulo || <span className="note-untitled">Sin título</span>}</span>
                  <span className="trash-days-left">Se elimina en {daysLeft(g.deletedAt)} día(s)</span>
                  <div className="trash-actions">
                    <button className="btn-secondary" onClick={() => onRestore(g.id)}><History size={12} /> Restaurar</button>
                    <button className="btn-danger-ghost" onClick={() => onPurge(g.id)}><Trash2 size={12} /> Eliminar ya</button>
                  </div>
                </div>
              )}
            />
          </>
        )
      ) : guiones.length === 0 ? (
        <div className="empty-pane">Aún no hay guiones. Usa "Nuevo guion" para crear el primero.</div>
      ) : (
        <MasonryGrid
          items={guiones}
          renderItem={(g) => <GuionCard guion={g} showClient={showClient} onOpen={() => setOpenGuionId(g.id)} />}
        />
      )}

      {showNew && (
        <NewGuionModal
          empresa={defaultClient}
          onClose={() => setShowNew(false)}
          onCreate={(g) => { onAdd(g); setShowNew(false); setOpenGuionId(g.id); }}
        />
      )}

      {openGuion && (
        <GuionDetailModal
          guion={openGuion}
          showClient={showClient}
          onPatch={(patch) => onPatch(openGuion.id, patch)}
          onDelete={() => { onTrash(openGuion.id); setOpenGuionId(null); }}
          onClose={() => setOpenGuionId(null)}
        />
      )}
    </main>
  );
}
