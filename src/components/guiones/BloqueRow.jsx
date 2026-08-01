import { useRef, useEffect, useState } from "react";
import {
  GripVertical,
  Trash2,
  Check,
  Link2,
  Plus,
} from "lucide-react";
import { FloatingSelectionToolbar } from "../notes/RichEditorToolbar";
import { darkenHex, bloqueLabelCompleto, bloqueLabelTipo } from "../../utils/helpers";
import { handleNoteImagePaste, handleRichLinkClick, markLinksOpenInNewTab } from "../../utils/richTextEditor";

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
  const [nota, setNota] = useState(bloque.nota || "");
  const [linkReferencia, setLinkReferencia] = useState(bloque.linkReferencia || "");
  // El link de referencia arranca oculto salvo que el bloque YA tenga uno
  // guardado (por ejemplo, al reabrir un guion que ya lo tenía cargado).
  const [showLink, setShowLink] = useState(!!bloque.linkReferencia);
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
        {!esToma && (
          <label className="field">
            <span>Nota</span>
            <input
              type="text" value={nota} placeholder="Ej: Usar el video de la modelo en la playa, clip 2"
              onChange={(e) => setNota(e.target.value)}
              onBlur={() => onUpdate({ nota })}
            />
          </label>
        )}
        <label className="field">
          <span>{esToma ? "Voz / texto" : "Texto de la voz en off"}</span>
          <RichField html={bloque.vozTexto} placeholder={esToma ? "La frase o narración que se dice…" : "El texto de la voz en off que se agrega…"} onCommit={(html) => onUpdate({ vozTexto: html })} />
        </label>

        {showLink ? (
          <label className="field">
            <span><Link2 size={11} /> Link de referencia</span>
            <input
              type="text" value={linkReferencia} placeholder="https://…" autoFocus={!bloque.linkReferencia}
              onChange={(e) => setLinkReferencia(e.target.value)}
              onBlur={() => onUpdate({ linkReferencia: normalizeLink(linkReferencia) })}
            />
            {bloque.linkReferencia && (
              <a href={bloque.linkReferencia} target="_blank" rel="noopener noreferrer" className="toma-link-open">Abrir link ↗</a>
            )}
          </label>
        ) : (
          <button type="button" className="toma-add-link-btn" onClick={() => setShowLink(true)}>
            <Plus size={12} /> Agregar link de referencia
          </button>
        )}
      </div>
    </div>
  );
}
