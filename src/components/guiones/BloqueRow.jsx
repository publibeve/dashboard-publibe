import { useRef, useEffect, useState } from "react";
import {
  GripVertical,
  Trash2,
  Check,
  Link2,
} from "lucide-react";
import { FloatingSelectionToolbar } from "../notes/RichEditorToolbar";
import { darkenHex, bloqueLabelCompleto, bloqueLabelTipo } from "../../utils/helpers";
import { handleNoteImagePaste, handleRichLinkClick, markLinksOpenInNewTab } from "../../utils/richTextEditor";

/**
 * Campos de texto enriquecido livianos a propósito (sin el sistema de
 * checklist/historial de Notas) — un guion puede tener muchos bloques, cada
 * uno con uno o dos de estos campos, así que van solo con lo esencial: el
 * toolbar flotante que aparece al seleccionar texto, sin una barra fija por
 * campo.
 */
function RichField({ html, placeholder, onCommit }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (html || "")) {
      ref.current.innerHTML = html || "";
      markLinksOpenInNewTab(ref.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <div
        ref={ref}
        className="toma-rich-field"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onPaste={(e) => handleNoteImagePaste(e, ref, () => {})}
        onClick={(e) => handleRichLinkClick(e)}
        onBlur={() => onCommit(ref.current.innerHTML)}
      />
      <FloatingSelectionToolbar targetRef={ref} onAfterCommand={() => onCommit(ref.current.innerHTML)} />
    </>
  );
}

function normalizeLink(url) {
  const v = (url || "").trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function BloqueRow({
  bloque, numero, guionColor, dragging, isDragOver,
  onUpdate, onDelete,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}) {
  const [planoLugar, setPlanoLugar] = useState(bloque.planoLugar || "");
  const [linkReferencia, setLinkReferencia] = useState(bloque.linkReferencia || "");
  const esToma = bloque.tipo === "toma";
  const grabColor = darkenHex(guionColor || "#FFFFFF", 0.18);
  const labelCompleto = bloqueLabelCompleto(bloque.tipo);

  return (
    <div
      className={"toma-row" + (bloque.completo ? " toma-row-grabada" : "") + (dragging ? " toma-row-dragging" : "") + (isDragOver ? " toma-row-dragover" : "")}
      style={bloque.completo ? { background: grabColor } : undefined}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="toma-row-head">
        <span className="toma-drag-handle" title="Arrastrar para reordenar"><GripVertical size={15} /></span>
        <span className="toma-numero">{bloqueLabelTipo(bloque.tipo)} {numero}</span>
        <label className="toma-grabada-check">
          <input
            type="checkbox" checked={!!bloque.completo}
            onChange={(e) => onUpdate({ completo: e.target.checked })}
          />
          <span className="toma-grabada-box">{bloque.completo && <Check size={12} />}</span>
          {labelCompleto}
        </label>
        <button type="button" className="icon-btn subtle" onClick={onDelete} title={`Eliminar ${bloqueLabelTipo(bloque.tipo).toLowerCase()}`}>
          <Trash2 size={13} />
        </button>
      </div>

      <div className="toma-row-body">
        {esToma && (
          <label className="field">
            <span>Plano / lugar</span>
            <input
              type="text" value={planoLugar} placeholder="Ej: En mostrador, primer plano"
              onChange={(e) => setPlanoLugar(e.target.value)}
              onBlur={() => onUpdate({ planoLugar })}
            />
          </label>
        )}
        {esToma && (
          <label className="field">
            <span>Qué se va a realizar</span>
            <RichField html={bloque.queSeRealiza} placeholder="Descripción visual de la toma…" onCommit={(html) => onUpdate({ queSeRealiza: html })} />
          </label>
        )}
        <label className="field">
          <span>{esToma ? "Voz / texto" : "Texto de la voz en off"}</span>
          <RichField html={bloque.vozTexto} placeholder={esToma ? "La frase o narración que se dice…" : "El texto de la voz en off que se agrega…"} onCommit={(html) => onUpdate({ vozTexto: html })} />
        </label>
        <label className="field">
          <span><Link2 size={11} /> Link de referencia{!esToma && " (video externo a usar)"}</span>
          <input
            type="text" value={linkReferencia} placeholder="https://…"
            onChange={(e) => setLinkReferencia(e.target.value)}
            onBlur={() => onUpdate({ linkReferencia: normalizeLink(linkReferencia) })}
          />
          {bloque.linkReferencia && (
            <a href={bloque.linkReferencia} target="_blank" rel="noopener noreferrer" className="toma-link-open">Abrir link ↗</a>
          )}
        </label>
      </div>
    </div>
  );
}
