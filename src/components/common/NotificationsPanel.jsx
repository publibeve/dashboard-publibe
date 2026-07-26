import { useEffect, useRef } from "react";
import {
  Bell,
} from "lucide-react";
import { clientMeta } from "../../utils/helpers";

export function NotificationsPanel({ notifications, onClose, onSelectTask, style }) {
  const ref = useRef(null);
  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  return (
    <div className="notif-panel" ref={ref} style={style}>
      <div className="notif-panel-head">
        <Bell size={14} /> <span>Tareas por vencer</span>
      </div>
      <div className="notif-panel-list">
        {notifications.length === 0 && <div className="hint" style={{ padding: "12px 14px" }}>Nada vencido ni por vencer en los próximos días 🎉</div>}
        {notifications.map(({ task, days }) => {
          const cm = clientMeta(task.empresa);
          const CmIcon = cm.icon;
          const label = days < 0 ? `Vencida hace ${Math.abs(days)} día(s)` : days === 0 ? "Vence hoy" : `Vence en ${days} día(s)`;
          return (
            <button type="button" className="notif-row" key={task.id} onClick={() => onSelectTask(task)}>
              <span className={"notif-row-dot" + (days <= 0 ? " notif-row-dot-urgent" : "")} />
              <span className="notif-row-body">
                <span className="notif-row-title">{task.titulo}</span>
                <span className="notif-row-meta"><CmIcon size={11} style={{ color: cm.color }} />{task.empresa} · {label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
