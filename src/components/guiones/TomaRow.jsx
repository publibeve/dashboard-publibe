import { useRef, useEffect, useState } from "react";
import {
  GripVertical,
  Trash2,
  Check,
} from "lucide-react";
import { FloatingSelectionToolbar } from "../notes/RichEditorToolbar";
import { darkenHex } from "../../utils/helpers";
import { handleNoteImagePaste, handleRichLinkClick, markLinksOpenInNewTab } from "../../utils/richTextEditor";

/**
 * Los dos campos de texto enriquecido de una toma son livianos a propósito
 * (sin el sistema de checklist/historial de deshacer que sí tiene el cuerpo
 * de una Nota) — un guion puede tener muchas tomas, cada una con dos de
 * estos campos, así que van solo con lo esencial: negrita/itálica/etc vía
 * el toolbar flotante que aparece al seleccionar texto (mismo componente
 * que usa Notas), sin una barra fija por campo que saturaría la pantalla.
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

export function TomaRow({
  toma, numero, guionColor, dragging, isDragOver,
  onUpdate, onDelete,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}) {
  const [planoLugar, setPlanoLugar] = useState(toma.planoLugar || "");
  const grabColor = darkenHex(guionColor || "#FFFFFF", 0.18);

  return (
    <div
      className={"toma-row" + (toma.grabada ? " toma-row-grabada" : "") + (dragging ? " toma-row-dragging" : "") + (isDragOver ? " toma-row-dragover" : "")}
      style={toma.grabada ? { background: grabColor } : undefined}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="toma-row-head">
        <span className="toma-drag-handle" title="Arrastrar para reordenar"><GripVertical size={15} /></span>
        <span className="toma-numero">Toma {numero}</span>
        <label className="toma-grabada-check">
          <input
            type="checkbox" checked={!!toma.grabada}
            onChange={(e) => onUpdate({ grabada: e.target.checked })}
          />
          <span className="toma-grabada-box">{toma.grabada && <Check size={12} />}</span>
          Grabada
        </label>
        <button type="button" className="icon-btn subtle" onClick={onDelete} title="Eliminar toma">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="toma-row-body">
        <label className="field">
          <span>Plano / lugar</span>
          <input
            type="text" value={planoLugar} placeholder="Ej: En mostrador, primer plano"
            onChange={(e) => setPlanoLugar(e.target.value)}
            onBlur={() => onUpdate({ planoLugar })}
          />
        </label>
        <label className="field">
          <span>Qué se va a realizar</span>
          <RichField html={toma.queSeRealiza} placeholder="Descripción visual de la toma…" onCommit={(html) => onUpdate({ queSeRealiza: html })} />
        </label>
        <label className="field">
          <span>Voz / texto</span>
          <RichField html={toma.vozTexto} placeholder="La frase o narración que se dice…" onCommit={(html) => onUpdate({ vozTexto: html })} />
        </label>
      </div>
    </div>
  );
}
