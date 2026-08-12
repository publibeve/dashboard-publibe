import { useState, useEffect, useRef } from "react";
import {
  X,
  AlertTriangle,
  StickyNote,
  ListChecks,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { EmpresaField } from "../common/EmpresaField";
import { Overlay } from "../common/Overlay";
import { FloatingSelectionToolbar, ImageActionMenu, RichToolbar } from "../notes/RichEditorToolbar";
import { DISENADORES } from "../../utils/constants";
import { clientMeta, uid } from "../../utils/helpers";
import { generateTaskIdea } from "../../services/ai.service";
import { cleanChecklistHtml, handleCheckLineClick, handleChecklistEnterKey, handleEditorHistoryBeforeInput, handleEditorHistoryKeydown, handleNoteImageClick, handleNoteImagePaste, handleRichLinkClick, insertChecklistLine, snapshotEditorHistoryDebounced } from "../../utils/richTextEditor";

// Saneo mínimo antes de volcar lo que devuelve la IA como innerHTML — el
// prompt ya le pide solo p/b/ul/li sin atributos, esto es un resguardo
// extra por si alguna vez se cuela algo que no debería (script, on*, etc.)
function sanitizeAiHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export function NewTaskModal({ onClose, onCreate, defaultClient, lockedClient, geminiKey }) {
  const [titulo, setTitulo] = useState("");
  const [empresa, setEmpresa] = useState(lockedClient || defaultClient);
  const [asignado, setAsignado] = useState("");
  const [fechaSolicitud, setFechaSolicitud] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [error, setError] = useState("");
  const [imgMenu, setImgMenu] = useState(null);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiDescripcion, setAiDescripcion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const firstRef = useRef(null);
  const notasRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  async function handleGenerarConIA() {
    if (!aiDescripcion.trim()) { setAiError("Contá brevemente qué necesitás."); return; }
    if (!geminiKey) { setAiError('Falta configurar la clave de Gemini (Administrativo → Usuarios y permisos → Asistente IA).'); return; }
    setAiLoading(true);
    setAiError("");
    try {
      const { titulo: tituloIA, notasHtml } = await generateTaskIdea(geminiKey, empresa, aiDescripcion.trim());
      if (tituloIA) setTitulo(tituloIA);
      if (notasHtml && notasRef.current) {
        notasRef.current.innerHTML = sanitizeAiHtml(notasHtml);
        snapshotEditorHistoryDebounced(notasRef.current);
      }
      setShowAiPrompt(false);
      setAiDescripcion("");
    } catch (e) {
      setAiError(e && e.message ? e.message : String(e));
    } finally {
      setAiLoading(false);
    }
  }

  function submit() {
    if (!titulo.trim()) { setError("Falta el trabajo solicitado."); return; }
    if (!empresa) { setError("Falta elegir la empresa."); return; }
    if (!asignado) { setError("Falta elegir a quién se le asigna."); return; }
    if (!fechaEntrega) { setError("Falta la fecha de entrega."); return; }
    const notas = notasRef.current ? cleanChecklistHtml(notasRef.current.innerHTML) : "";
    try {
      onCreate({
        id: uid(), titulo: titulo.trim(), empresa, asignado, fechaSolicitud, fechaEntrega,
        notas, estado: "pendiente", comentarios: [], archivos: [],
      });
    } catch (err) {
      setError("No se pudo crear la tarea: " + (err && err.message ? err.message : String(err)));
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small" style={{ "--primary": clientMeta(empresa).color }}>
        <div className="modal-head">
          <h3>Nueva tarea</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <label className="field">
          <span>Trabajo solicitado</span>
          <input
            ref={firstRef} value={titulo} onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Flyer promoción vacacional"
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
        </label>

        {!showAiPrompt ? (
          <button type="button" className="btn-secondary full" style={{ marginBottom: 14 }} onClick={() => setShowAiPrompt(true)}>
            <Sparkles size={14} /> Generar idea con IA
          </button>
        ) : (
          <div className="ai-task-idea-box">
            <label className="field" style={{ marginBottom: 8 }}>
              <span>Contale a la IA qué necesitás — ella arma el título y desarrolla las notas de diseño</span>
              <input
                type="text" autoFocus value={aiDescripcion} onChange={(e) => setAiDescripcion(e.target.value)}
                placeholder='Ej: "promoción de fin de semana para el taller"'
                onKeyDown={(e) => { if (e.key === "Enter") handleGenerarConIA(); }}
              />
            </label>
            {aiError && <div className="form-error"><AlertTriangle size={13} /> {aiError}</div>}
            <div className="ai-task-idea-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowAiPrompt(false); setAiError(""); }} disabled={aiLoading}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleGenerarConIA} disabled={aiLoading}>
                {aiLoading ? <><Loader2 size={14} className="spin" /> Generando…</> : <><Sparkles size={14} /> Generar</>}
              </button>
            </div>
            <p className="hint" style={{ marginTop: 6, marginBottom: 0 }}>Completa el título y las notas de diseño — vos revisás y editás antes de crear la tarea, y completás empresa/asignado/fechas a mano (eso la IA no lo inventa).</p>
          </div>
        )}

        <EmpresaField locked={!!lockedClient} value={empresa} onChange={setEmpresa} />

        <label className="field">
          <span>Asignado a</span>
          <CustomSelect value={asignado} onChange={setAsignado} options={DISENADORES} placeholder="Seleccionar…" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Fecha de solicitud</span>
            <CustomDatePicker value={fechaSolicitud} onChange={setFechaSolicitud} />
          </label>
          <label className="field">
            <span>Fecha de entrega</span>
            <CustomDatePicker value={fechaEntrega} onChange={setFechaEntrega} />
          </label>
        </div>

        <div className="field detail-block">
          <span><StickyNote size={12} /> Notas de diseño</span>
          <div
            className="note-body-editable tareagen-body"
            ref={notasRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Información esencial que sí o sí debe aparecer. Ej: el flyer debe decir en grande 'Promoción 50%'."
            onInput={(e) => snapshotEditorHistoryDebounced(e.currentTarget)}
            onPaste={(e) => handleNoteImagePaste(e, notasRef, () => {})}
            onBeforeInput={(e) => handleEditorHistoryBeforeInput(e, notasRef.current)}
            onKeyDown={(e) => { if (handleEditorHistoryKeydown(e, notasRef.current)) return; handleChecklistEnterKey(e, () => {}); }}
            onClick={(e) => { if (handleRichLinkClick(e)) return; if (!handleCheckLineClick(e, () => {})) handleNoteImageClick(e, setImgMenu); }}
          />
          <ImageActionMenu
            menu={imgMenu}
            onClose={() => setImgMenu(null)}
            onExpand={() => {}}
            onDelete={() => { imgMenu.el.remove(); setImgMenu(null); }}
          />
          <RichToolbar targetRef={notasRef} onAfterCommand={() => {}} extraButton={
            <button type="button" title="Insertar casilla de tarea" onMouseDown={(e) => { e.preventDefault(); insertChecklistLine(notasRef, () => {}); }}>
              <ListChecks size={14} />
            </button>
          } />
          <FloatingSelectionToolbar targetRef={notasRef} onAfterCommand={() => {}} />
        </div>

        <button className="btn-primary full" type="button" onClick={submit}>Crear tarea</button>
      </div>
    </Overlay>
  );
}
