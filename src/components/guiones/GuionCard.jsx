import { Clapperboard, CheckCircle2, BadgeCheck } from "lucide-react";
import { clientMeta, guionCategoriaColor, guionProgreso, guionEstaGrabado, guionEstaCompletado } from "../../utils/helpers";

export function GuionCard({ guion, showClient, onOpen }) {
  const cm = clientMeta(guion.empresa);
  const CmIcon = cm.icon;
  const { hechos, total } = guionProgreso(guion);
  const grabado = guionEstaGrabado(guion);
  const completado = guionEstaCompletado(guion);
  const color = guionCategoriaColor(guion.categoria);

  return (
    <button
      className="note-card guion-card"
      style={{ background: color }}
      onClick={onOpen}
    >
      <div className="note-card-head">
        <span className="note-card-title">{guion.titulo || <span className="note-untitled">Sin título</span>}</span>
        {completado && <span className="guion-completado-badge" title="Completado — archivo final adjuntado"><BadgeCheck size={15} /></span>}
      </div>

      <div className="note-card-meta">
        {showClient && (
          <span className="note-card-empresa" style={{ color: cm.color }}><CmIcon size={11} />{guion.empresa}</span>
        )}
        {guion.duracionEstimada && <span className="note-card-date">{guion.duracionEstimada}</span>}
      </div>

      {guion.categoria && (
        <div className="note-tag-row">
          <span className="note-tag-chip guion-categoria-tag-chip">{guion.categoria}</span>
        </div>
      )}

      <div className="guion-card-progress">
        {total === 0 ? (
          <span className="note-untitled"><Clapperboard size={13} /> Sin bloques todavía</span>
        ) : (
          <span className={grabado ? "guion-progress-done" : ""}>
            <CheckCircle2 size={13} /> {hechos}/{total} grabado{grabado ? " — completo" : ""}
          </span>
        )}
      </div>
    </button>
  );
}
