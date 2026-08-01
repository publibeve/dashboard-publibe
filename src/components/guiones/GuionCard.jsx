import { Clapperboard, CheckCircle2 } from "lucide-react";
import { clientMeta, tagColor } from "../../utils/helpers";

export function GuionCard({ guion, showClient, onOpen }) {
  const cm = clientMeta(guion.empresa);
  const CmIcon = cm.icon;
  const tomas = guion.tomas || [];
  const grabadas = tomas.filter((t) => t.grabada).length;

  return (
    <button
      className="note-card guion-card"
      style={{ background: guion.color || "#fff" }}
      onClick={onOpen}
    >
      <div className="note-card-head">
        <span className="note-card-title">{guion.titulo || <span className="note-untitled">Sin título</span>}</span>
      </div>

      <div className="note-card-meta">
        {showClient && (
          <span className="note-card-empresa" style={{ color: cm.color }}><CmIcon size={11} />{guion.empresa}</span>
        )}
        {guion.duracionEstimada && <span className="note-card-date">{guion.duracionEstimada}</span>}
      </div>

      {guion.categoria && (
        <div className="note-tag-row">
          <span className="note-tag-chip" style={{ color: tagColor(guion.categoria), background: tagColor(guion.categoria) + "18" }}>{guion.categoria}</span>
        </div>
      )}

      <div className="guion-card-progress">
        {tomas.length === 0 ? (
          <span className="note-untitled"><Clapperboard size={13} /> Sin tomas todavía</span>
        ) : (
          <span className={grabadas === tomas.length ? "guion-progress-done" : ""}>
            <CheckCircle2 size={13} /> {grabadas}/{tomas.length} tomas grabadas
          </span>
        )}
      </div>
    </button>
  );
}
