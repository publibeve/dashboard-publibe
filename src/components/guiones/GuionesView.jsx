import { useState } from "react";
import {
  Trash2,
  History,
  Plus,
  Check,
  X,
  ListVideo,
} from "lucide-react";
import { MasonryGrid } from "../notes/NotesView";
import { GuionCard } from "./GuionCard";
import { GuionDetailModal } from "./GuionDetailModal";
import { NewGuionModal } from "./NewGuionModal";
import { ImportGuionesModal } from "./ImportGuionesModal";
import { CustomSelect } from "../common/CustomSelect";
import { uid } from "../../utils/helpers";

export function GuionesView({
  guiones = [], trashedGuiones = [], showClient, defaultClient,
  onAdd, onPatch, onTrash, onRestore, onPurge, showTrash,
  openGuionId: openGuionIdProp, onOpenGuion,
  customCategorias, canAddCategoria, onAddCategoria,
  pautas, onAddPauta, pautaFiltro, onChangePautaFiltro,
  showNew: showNewProp, onOpenNew, onCloseNew,
  showImport: showImportProp, onOpenImport, onCloseImport,
  geminiKey,
  driveConnected,
}) {
  const [showNewLocal, setShowNewLocal] = useState(false);
  const showNew = showNewProp !== undefined ? showNewProp : showNewLocal;
  const closeNew = onCloseNew || (() => setShowNewLocal(false));

  const [showImportLocal, setShowImportLocal] = useState(false);
  const showImport = showImportProp !== undefined ? showImportProp : showImportLocal;
  const closeImport = onCloseImport || (() => setShowImportLocal(false));

  const [openGuionIdLocal, setOpenGuionIdLocal] = useState(null);
  const openGuionId = openGuionIdProp !== undefined ? openGuionIdProp : openGuionIdLocal;
  const setOpenGuionId = onOpenGuion || setOpenGuionIdLocal;
  const openGuion = guiones.find((g) => g.id === openGuionId);

  const [addingPauta, setAddingPauta] = useState(false);
  const [nuevaPautaTexto, setNuevaPautaTexto] = useState("");

  function daysLeft(deletedAt) {
    const elapsed = Date.now() - new Date(deletedAt).getTime();
    return Math.max(0, 30 - Math.floor(elapsed / (24 * 60 * 60 * 1000)));
  }

  function confirmAddPauta() {
    const clean = nuevaPautaTexto.trim();
    if (!clean) { setAddingPauta(false); return; }
    const p = { id: uid(), empresa: defaultClient, etiqueta: clean, createdAt: new Date().toISOString() };
    onAddPauta(p);
    onChangePautaFiltro(p.id); // te deja parado en la que acabás de crear
    setNuevaPautaTexto("");
    setAddingPauta(false);
  }

  const pautaOptions = [
    { value: "todas", label: "Todas las pautas" },
    ...(pautas || []).map((p) => ({ value: p.id, label: p.etiqueta })),
  ];

  return (
    <main className="pane notes-pane">
      {!showTrash && (
        <div className="notes-top-row guion-pauta-row">
          <ListVideo size={15} className="guion-pauta-icon" />
          <div className="toolbar-select guion-pauta-select">
            <CustomSelect value={pautaFiltro || "todas"} onChange={onChangePautaFiltro} options={pautaOptions} />
          </div>
          {!addingPauta ? (
            <button type="button" className="icon-btn subtle" onClick={() => setAddingPauta(true)} title="Crear una pauta nueva">
              <Plus size={15} />
            </button>
          ) : (
            <div className="guion-pauta-add-inline">
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
                  {/* Identificación de la pauta de origen, para no tener que adivinar de cuál es. */}
                  <span className="guion-trash-pauta-tag">Pauta: {(pautas || []).find((p) => p.id === g.pautaId)?.etiqueta || "Sin pauta"}</span>
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
        <div className="empty-pane">Aún no hay guiones acá. Usa "Nuevo guion" para crear el primero.</div>
      ) : (
        <MasonryGrid
          items={guiones}
          renderItem={(g) => <GuionCard guion={g} showClient={showClient} customCategorias={customCategorias} onOpen={() => setOpenGuionId(g.id)} />}
        />
      )}

      {showNew && (
        <NewGuionModal
          empresa={defaultClient}
          pautaId={pautaFiltro && pautaFiltro !== "todas" ? pautaFiltro : null}
          customCategorias={customCategorias}
          canAddCategoria={canAddCategoria}
          onAddCategoria={onAddCategoria}
          onClose={closeNew}
          onCreate={(g) => { onAdd(g); closeNew(); setOpenGuionId(g.id); }}
        />
      )}

      {showImport && (
        <ImportGuionesModal
          empresa={defaultClient}
          pautas={pautas}
          defaultPautaId={pautaFiltro && pautaFiltro !== "todas" ? pautaFiltro : ""}
          customCategorias={customCategorias}
          canAddCategoria={canAddCategoria}
          onAddCategoria={onAddCategoria}
          geminiKey={geminiKey}
          onClose={closeImport}
          onImport={onAdd}
        />
      )}

      {openGuion && (
        <GuionDetailModal
          guion={openGuion}
          showClient={showClient}
          customCategorias={customCategorias}
          canAddCategoria={canAddCategoria}
          onAddCategoria={onAddCategoria}
          pautaLabel={(pautas || []).find((p) => p.id === openGuion.pautaId)?.etiqueta || "Sin pauta"}
          driveConnected={driveConnected}
          onPatch={(patch) => onPatch(openGuion.id, patch)}
          onDelete={() => { onTrash(openGuion.id); setOpenGuionId(null); }}
          onClose={() => setOpenGuionId(null)}
        />
      )}
    </main>
  );
}
