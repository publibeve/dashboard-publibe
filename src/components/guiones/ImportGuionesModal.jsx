import { useState } from "react";
import {
  X,
  Sparkles,
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Check,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { CategoriaPicker } from "./CategoriaPicker";
import { GUION_CATEGORIAS } from "../../utils/constants";
import { uid, bloqueLabelTipo } from "../../utils/helpers";
import { extractGuionesFromText } from "../../services/ai.service";

function extractedToGuion(ex, empresa, pautaId) {
  return {
    id: uid(), empresa, pautaId: pautaId || null,
    titulo: ex.titulo || "", duracionEstimada: ex.duracionEstimada || "", tema: ex.tema || "",
    categoria: ex.categoria || GUION_CATEGORIAS[0].value,
    linkReferencia: "", archivosFinal: [],
    bloques: (ex.bloques || []).map((b) => ({
      id: uid(),
      tipo: b.tipo === "secuenciaVoz" ? "secuenciaVoz" : "toma",
      planoLugar: b.planoLugar || "", queSeRealiza: b.queSeRealiza || "",
      nota: b.nota || "", vozTexto: b.vozTexto || "",
      linkReferencia: "", completo: false,
    })),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    _incluido: true, // marca de la vista previa — no se guarda
  };
}

function BloquePreviewRow({ bloque, onChange }) {
  const esToma = bloque.tipo === "toma";
  return (
    <div className="import-bloque-row">
      <div className="import-bloque-row-head">
        <select value={bloque.tipo} onChange={(e) => onChange({ tipo: e.target.value })} className="import-tipo-select">
          <option value="toma">Toma</option>
          <option value="secuenciaVoz">Secuencia/Voz</option>
        </select>
      </div>
      {esToma ? (
        <input type="text" value={bloque.planoLugar} placeholder="Plano/lugar" onChange={(e) => onChange({ planoLugar: e.target.value })} />
      ) : (
        <input type="text" value={bloque.nota} placeholder="Nota (material a usar)" onChange={(e) => onChange({ nota: e.target.value })} />
      )}
      {esToma && (
        <textarea rows={2} value={bloque.queSeRealiza} placeholder="Qué se va a realizar" onChange={(e) => onChange({ queSeRealiza: e.target.value })} />
      )}
      <textarea rows={2} value={bloque.vozTexto} placeholder="Voz/texto" onChange={(e) => onChange({ vozTexto: e.target.value })} />
    </div>
  );
}

function GuionPreviewCard({ guion, customCategorias, canAddCategoria, onAddCategoria, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  function patch(p) { onChange({ ...guion, ...p }); }
  function patchBloque(id, p) {
    onChange({ ...guion, bloques: guion.bloques.map((b) => (b.id === id ? { ...b, ...p } : b)) });
  }

  return (
    <div className={"import-guion-card" + (!guion._incluido ? " import-guion-card-excluded" : "")}>
      <div className="import-guion-card-head">
        <label className="import-incluir-check">
          <input type="checkbox" checked={guion._incluido} onChange={(e) => patch({ _incluido: e.target.checked })} />
        </label>
        <input type="text" className="import-titulo-input" value={guion.titulo} placeholder="Título" onChange={(e) => patch({ titulo: e.target.value })} />
        <button type="button" className="icon-btn subtle" onClick={() => setExpanded((x) => !x)}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <button type="button" className="icon-btn subtle" onClick={onRemove} title="Quitar de la lista"><Trash2 size={13} /></button>
      </div>

      <div className="import-guion-card-summary">
        <span className="note-tag-chip guion-categoria-tag-chip">{guion.categoria}</span>
        {guion.tema && <span className="import-tema-summary">{guion.tema}</span>}
        {guion.duracionEstimada && <span className="import-tema-summary">{guion.duracionEstimada}</span>}
        <span className="import-tema-summary">{guion.bloques.length} bloque{guion.bloques.length !== 1 ? "s" : ""}</span>
      </div>

      {expanded && (
        <div className="import-guion-card-body">
          <div className="guion-duracion-tema-row">
            <label className="field">
              <span>Duración estimada</span>
              <input type="text" value={guion.duracionEstimada} onChange={(e) => patch({ duracionEstimada: e.target.value })} placeholder="Ej: 45 seg" />
            </label>
            <label className="field">
              <span>Producto, referencia o tema principal</span>
              <input type="text" value={guion.tema} onChange={(e) => patch({ tema: e.target.value })} />
            </label>
          </div>
          <CategoriaPicker
            value={guion.categoria}
            customCategorias={customCategorias}
            canAddCategoria={canAddCategoria}
            onChange={(categoria) => patch({ categoria })}
            onAddCategoria={onAddCategoria}
          />
          <div className="import-bloques-list">
            {guion.bloques.map((b) => (
              <BloquePreviewRow key={b.id} bloque={b} onChange={(p) => patchBloque(b.id, p)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ImportGuionesModal({ empresa, pautas, defaultPautaId, customCategorias, canAddCategoria, onAddCategoria, onAddPauta, geminiKey, onClose, onImport }) {
  const [texto, setTexto] = useState("");
  const [pautaId, setPautaId] = useState(defaultPautaId || "");
  const [creandoPauta, setCreandoPauta] = useState(false);
  const [nuevaPautaTexto, setNuevaPautaTexto] = useState("");

  function confirmarNuevaPauta() {
    const clean = nuevaPautaTexto.trim();
    if (!clean) { setCreandoPauta(false); return; }
    const p = { id: uid(), empresa, etiqueta: clean, createdAt: new Date().toISOString() };
    onAddPauta(p);
    setPautaId(p.id); // queda seleccionada al toque — para eso la creaste
    setNuevaPautaTexto("");
    setCreandoPauta(false);
  }
  const [step, setStep] = useState("pegar"); // "pegar" | "revisar"
  const [extrayendo, setExtrayendo] = useState(false);
  const [error, setError] = useState("");
  const [extraidos, setExtraidos] = useState([]);
  const [importando, setImportando] = useState(false);
  const [importError, setImportError] = useState("");

  async function handleExtraer() {
    if (!texto.trim()) { setError("Pegá el documento primero."); return; }
    if (!geminiKey) { setError('Falta configurar la clave de Gemini (Administrativo → Usuarios y permisos → Asistente IA).'); return; }
    setError("");
    setExtrayendo(true);
    try {
      const categorias = [...GUION_CATEGORIAS.map((c) => c.value), ...(customCategorias || []).map((c) => c.value)];
      const raw = await extractGuionesFromText(geminiKey, texto, categorias);
      if (!raw.length) throw new Error("No se encontró ningún guion en el texto pegado.");
      setExtraidos(raw.map((ex) => extractedToGuion(ex, empresa, pautaId)));
      setStep("revisar");
    } catch (e) {
      setError(e && e.message ? e.message : String(e));
    } finally {
      setExtrayendo(false);
    }
  }

  function updateGuion(index, next) {
    setExtraidos((list) => list.map((g, i) => (i === index ? next : g)));
  }
  function removeGuion(index) {
    setExtraidos((list) => list.filter((_, i) => i !== index));
  }

  const incluidos = extraidos.filter((g) => g._incluido);

  async function confirmar() {
    setImportError("");
    setImportando(true);
    try {
      const limpios = incluidos.map(({ _incluido, ...g }) => g);
      await onImport(limpios); // UNA sola llamada con todos — ver el porqué en useGuiones.addGuiones
      onClose();
    } catch (e) {
      // Antes esto podía fallar sin que se viera nada — ahora, si la
      // escritura real a Supabase falla, se muestra acá y el modal se
      // queda abierto (con la vista previa intacta) para poder reintentar
      // sin tener que pegar y extraer todo de nuevo.
      setImportError("No se pudieron guardar los guiones: " + (e && e.message ? e.message : e));
    } finally {
      setImportando(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal import-guiones-modal">
        <div className="modal-head">
          <h3><Sparkles size={16} /> Importar guiones</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {step === "pegar" && (
          <>
            <p className="hint" style={{ marginTop: 0 }}>
              Pegá el documento del guion tal como lo escribís normalmente — la IA identifica los guiones, tomas, y categorías solo.
              Vas a poder corregir todo antes de importar nada.
            </p>
            <label className="field">
              <span>Pauta a la que quedan asociados</span>
              <div className="import-pauta-row">
                <select value={pautaId} onChange={(e) => setPautaId(e.target.value)}>
                  <option value="">Sin pauta</option>
                  {(pautas || []).map((p) => <option key={p.id} value={p.id}>{p.etiqueta}</option>)}
                </select>
                {!creandoPauta ? (
                  <button type="button" className="icon-btn subtle" onClick={() => setCreandoPauta(true)} title="Crear una pauta nueva sin salir de acá">
                    <Plus size={15} />
                  </button>
                ) : (
                  <div className="guion-pauta-add-inline">
                    <input
                      type="text" autoFocus value={nuevaPautaTexto} placeholder='Ej: "1 de agosto — Modelo Astrid"'
                      onChange={(e) => setNuevaPautaTexto(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") confirmarNuevaPauta(); if (e.key === "Escape") setCreandoPauta(false); }}
                    />
                    <button type="button" className="icon-btn subtle" onClick={confirmarNuevaPauta}><Check size={14} /></button>
                    <button type="button" className="icon-btn subtle" onClick={() => { setCreandoPauta(false); setNuevaPautaTexto(""); }}><X size={14} /></button>
                  </div>
                )}
              </div>
            </label>
            <label className="field">
              <span>Documento</span>
              <textarea
                className="import-textarea" rows={14} value={texto} onChange={(e) => setTexto(e.target.value)}
                placeholder="Pegá acá el guion completo de la pauta…"
              />
            </label>
            {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
            <button type="button" className="btn-primary full" onClick={handleExtraer} disabled={extrayendo} style={{ marginTop: 4 }}>
              {extrayendo ? <><Loader2 size={14} className="spin" /> Extrayendo con IA…</> : <><Sparkles size={14} /> Extraer guiones</>}
            </button>
          </>
        )}

        {step === "revisar" && (
          <>
            <p className="hint" style={{ marginTop: 0 }}>
              Revisá cada guion antes de importar — destildá los que no quieras cargar, corregí cualquier campo, y cambiá el tipo de
              bloque si hace falta. Nada se guarda todavía.
            </p>
            <div className="import-guiones-list">
              {extraidos.map((g, i) => (
                <GuionPreviewCard
                  key={g.id}
                  guion={g}
                  customCategorias={customCategorias}
                  canAddCategoria={canAddCategoria}
                  onAddCategoria={onAddCategoria}
                  onChange={(next) => updateGuion(i, next)}
                  onRemove={() => removeGuion(i)}
                />
              ))}
            </div>
            {importError && <div className="form-error"><AlertTriangle size={13} /> {importError}</div>}
            <div className="modal-footer modal-footer-row">
              <button type="button" className="btn-secondary" onClick={() => setStep("pegar")} disabled={importando}>Volver</button>
              <button type="button" className="btn-primary" onClick={confirmar} disabled={incluidos.length === 0 || importando}>
                {importando ? <><Loader2 size={14} className="spin" /> Guardando…</> : <><Check size={14} /> Confirmar e importar ({incluidos.length})</>}
              </button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}
