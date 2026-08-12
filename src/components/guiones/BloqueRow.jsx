import { useState } from "react";
import {
  GripVertical,
  Trash2,
  Check,
  Link2,
  Plus,
} from "lucide-react";
import { darkenHex, bloqueLabelCompleto, bloqueLabelTipo, stripHtmlToPlainText } from "../../utils/helpers";

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
  // stripHtmlToPlainText normaliza contenido viejo (guardado con el editor
  // enriquecido que tenían estos campos antes) a texto plano con saltos de
  // línea reales — así los bloques creados antes de este cambio se ven bien
  // acá sin tener que migrar nada a mano. Si ya es texto plano, no cambia.
  const [queSeRealiza, setQueSeRealiza] = useState(stripHtmlToPlainText(bloque.queSeRealiza));
  const [vozTexto, setVozTexto] = useState(stripHtmlToPlainText(bloque.vozTexto));
  const [linkReferencia, setLinkReferencia] = useState(bloque.linkReferencia || "");
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
            <textarea
              className="toma-plain-textarea" rows={2} value={queSeRealiza} placeholder="Descripción visual de la toma…"
              onChange={(e) => setQueSeRealiza(e.target.value)}
              onBlur={() => onUpdate({ queSeRealiza })}
            />
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
          {/* Texto plano, no contentEditable — el dictado por voz nativo de
              Android/iOS es poco confiable con contentEditable, y acá no
              hace falta negrita/itálica. Enter sigue funcionando normal
              para separar diálogos de varias personas en la misma toma. */}
          <textarea
            className="toma-plain-textarea" rows={2} value={vozTexto}
            placeholder={esToma ? "La frase o narración que se dice…" : "El texto de la voz en off que se agrega…"}
            onChange={(e) => setVozTexto(e.target.value)}
            onBlur={() => onUpdate({ vozTexto })}
          />
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
