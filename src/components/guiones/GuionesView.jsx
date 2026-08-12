import { useState } from "react";
import {
  Trash2,
  History,
} from "lucide-react";
import { MasonryGrid } from "../notes/NotesView";
import { GuionCard } from "./GuionCard";
import { GuionDetailModal } from "./GuionDetailModal";
import { NewGuionModal } from "./NewGuionModal";
import { ImportGuionesModal } from "./ImportGuionesModal";
import { PautaTabBar } from "./PautaTabBar";
import { uid } from "../../utils/helpers";

const ESTADO_OPCIONES = [
  { value: "todos", label: "Todos los estados" },
  { value: "grabado", label: "100% grabado" },
  { value: "no-grabado", label: "Falta grabar algo" },
  { value: "completado", label: "Completado (archivo final)" },
  { value: "incompleto", label: "Sin archivo final" },
];

export function GuionesView({
  guiones = [], trashedGuiones = [], showClient, defaultClient,
  onAdd, onImportMany, onPatch, onTrash, onRestore, onPurge, showTrash,
  openGuionId: openGuionIdProp, onOpenGuion,
  customCategorias, canAddCategoria, onAddCategoria,
  pautas, onAddPauta, onRenamePauta, onDeletePauta, onReorderPautas,
  pautaFiltro, onChangePautaFiltro,
  estadoFiltro, onChangeEstadoFiltro,
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

  function daysLeft(deletedAt) {
    const elapsed = Date.now() - new Date(deletedAt).getTime();
    return Math.max(0, 30 - Math.floor(elapsed / (24 * 60 * 60 * 1000)));
  }

  function handleAddPauta(etiqueta) {
    const p = { id: uid(), empresa: defaultClient, etiqueta, createdAt: new Date().toISOString() };
    onAddPauta(p);
    onChangePautaFiltro(p.id); // te deja parado en la que acabás de crear
  }

  return (
    <main className="pane notes-pane">
      {!showTrash && (
        <>
          <PautaTabBar
            pautas={pautas}
            pautaFiltro={pautaFiltro || "todas"}
            onChangePautaFiltro={onChangePautaFiltro}
            onAddPauta={handleAddPauta}
            onRenamePauta={onRenamePauta}
            onDeletePauta={onDeletePauta}
            onReorderPautas={onReorderPautas}
          />
          <div className="guion-estado-filtro-row">
            {ESTADO_OPCIONES.map((op) => (
              <button
                key={op.value} type="button"
                className={"guion-estado-filtro-chip" + (estadoFiltro === op.value ? " guion-estado-filtro-chip-active" : "")}
                onClick={() => onChangeEstadoFiltro(op.value)}
              >
                {op.label}
              </button>
            ))}
          </div>
        </>
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
        <div className="empty-pane">
          {estadoFiltro !== "todos" ? "No hay guiones con ese estado." : 'Aún no hay guiones acá. Usa "Nuevo guion" para crear el primero.'}
        </div>
      ) : (
        <MasonryGrid
          items={guiones}
          renderItem={(g) => <GuionCard guion={g} showClient={showClient} customCategorias={customCategorias} onOpen={() => setOpenGuionId(g.id)} />}
        />
      )}

      {showNew && (
        <NewGuionModal
          empresa={defaultClient}
          pautas={pautas}
          defaultPautaId={pautaFiltro && pautaFiltro !== "todas" ? pautaFiltro : ""}
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
          onAddPauta={onAddPauta}
          defaultPautaId={pautaFiltro && pautaFiltro !== "todas" ? pautaFiltro : ""}
          customCategorias={customCategorias}
          canAddCategoria={canAddCategoria}
          onAddCategoria={onAddCategoria}
          geminiKey={geminiKey}
          onClose={closeImport}
          onImport={onImportMany}
        />
      )}

      {openGuion && (
        <GuionDetailModal
          guion={openGuion}
          showClient={showClient}
          customCategorias={customCategorias}
          canAddCategoria={canAddCategoria}
          onAddCategoria={onAddCategoria}
          pautas={pautas}
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
