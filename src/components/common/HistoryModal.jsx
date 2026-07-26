import { useState, useMemo } from "react";
import {
  X,
  ChevronDown,
  History,
} from "lucide-react";
import { Overlay } from "./Overlay";
import { historyIcon, monthLabelEs, todayISO } from "../../utils/helpers";

export function HistoryModal({ activity, onClose }) {
  const currentMonthKey = todayISO().slice(0, 7);
  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonthKey]));

  const monthGroups = useMemo(() => {
    const map = new Map();
    (activity || []).forEach((a) => {
      const mk = new Date(a.time).toISOString().slice(0, 7);
      if (!map.has(mk)) map.set(mk, []);
      map.get(mk).push(a);
    });
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [activity]);

  function dayGroupsFor(items) {
    const map = new Map();
    items.forEach((a) => {
      const day = new Date(a.time).toLocaleDateString("es-VE", { day: "2-digit", month: "long" });
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(a);
    });
    return [...map.entries()];
  }
  function toggleMonth(mk) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(mk)) next.delete(mk); else next.add(mk);
      return next;
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small history-modal">
        <div className="modal-head">
          <h3><History size={16} /> Historial de actividad</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {monthGroups.length === 0 && <div className="hint">Todavía no hay actividad registrada.</div>}

        <div className="history-body">
          {monthGroups.map(([mk, items]) => {
            const isOpen = openMonths.has(mk);
            return (
              <div className="history-month-group" key={mk}>
                <button type="button" className="history-month-toggle" onClick={() => toggleMonth(mk)}>
                  <span className="history-month-label">
                    {monthLabelEs(mk)}
                    {mk === currentMonthKey && <span className="history-month-current">Mes actual</span>}
                  </span>
                  <ChevronDown size={14} className={"history-month-chev" + (isOpen ? " history-month-chev-open" : "")} />
                </button>
                {isOpen && dayGroupsFor(items).map(([day, dayItems]) => (
                  <div className="history-group" key={day}>
                    <div className="history-day">{day}</div>
                    {dayItems.map((a) => {
                      const hi = historyIcon(a.text);
                      const Icon = hi.icon;
                      return (
                        <div className="history-item" key={a.id}>
                          <span className="history-icon" style={{ color: hi.color, background: hi.color + "16" }}><Icon size={13} /></span>
                          <div className="history-text-wrap">
                            <div className="history-text">{a.text}</div>
                            <div className="history-time">{new Date(a.time).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </Overlay>
  );
}
