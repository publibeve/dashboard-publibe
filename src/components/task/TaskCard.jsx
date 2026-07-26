import {
  User,
  Calendar,
  MessageSquare,
  Paperclip,
  StickyNote,
} from "lucide-react";
import { clientMeta, daysUntil, fmtDate, urgencyColor } from "../../utils/helpers";

export function TaskCard({ task, onOpen, showClient, dragging, canDrag, unread, onDragStart, onDragEnd }) {
  const color = urgencyColor(task.fechaEntrega, task.estado);
  const days = daysUntil(task.fechaEntrega);
  const cm = clientMeta(task.empresa);
  const ClientIcon = cm.icon;
  return (
    <button
      className={"card" + (dragging ? " card-dragging" : "")}
      style={{ borderLeftColor: color }}
      onClick={onOpen}
      draggable={canDrag !== false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="card-top">
        <span className="card-title">{task.titulo}</span>
        {unread && <span className="card-unread-dot" title="Comentarios nuevos desde tu última visita" />}
      </div>

      <div className="card-assignee" style={{ color: cm.color }}>
        <User size={11} />{task.asignado}
      </div>

      {showClient && (
        <div className="card-meta">
          <span className="meta-item" style={{ color: cm.color }}><ClientIcon size={12} />{task.empresa}</span>
        </div>
      )}

      <div className="card-bottom">
        <span className="due" style={{ color }}>
          <Calendar size={12} />
          {fmtDate(task.fechaEntrega)}
          {task.estado !== "listo" && days !== null && days < 0 && " · vencida"}
          {task.estado !== "listo" && days === 0 && " · hoy"}
        </span>
        <span className="badges">
          {task.notas && <span className="badge"><StickyNote size={11} /></span>}
          {task.comentarios?.length > 0 && (
            <span className={"badge" + (unread ? " badge-unread" : "")}><MessageSquare size={11} />{task.comentarios.length}</span>
          )}
          {task.archivos?.length > 0 && <span className="badge"><Paperclip size={11} />{task.archivos.length}</span>}
        </span>
      </div>
    </button>
  );
}
