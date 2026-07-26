import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fmtDate, todayISO } from "../../utils/helpers";

export function CustomDatePicker({ value, onChange, disabled, clearable }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState({ alignRight: false, openUp: false });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    d.setDate(1);
    return d;
  });
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const container = ref.current.closest(".modal");
    const containerRect = container ? container.getBoundingClientRect() : null;
    const rightBound = containerRect ? containerRect.right : window.innerWidth;
    const bottomBound = containerRect ? containerRect.bottom : window.innerHeight;
    const MENU_W = 260, MENU_H = 320;
    setPlacement({
      alignRight: rightBound - rect.left < MENU_W + 8,
      openUp: bottomBound - rect.bottom < MENU_H + 8 && rect.top - (containerRect ? containerRect.top : 0) > MENU_H,
    });
  }, [open]);

  function openPicker() {
    if (disabled) return;
    const d = value ? new Date(value + "T00:00:00") : new Date();
    d.setDate(1);
    setViewMonth(d);
    setOpen((o) => !o);
  }

  const year = viewMonth.getFullYear();
  const mon = viewMonth.getMonth();
  const first = new Date(year, mon, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  function isoFor(d) { return `${year}-${String(mon + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }
  const monthLabel = viewMonth.toLocaleDateString("es-VE", { month: "long", year: "numeric" });
  const todayIso = todayISO();
  const menuClass = "cdate-menu" + (placement.alignRight ? " cdate-menu-right" : "") + (placement.openUp ? " cdate-menu-up" : "");

  return (
    <div className={"cdate" + (disabled ? " cdate-disabled" : "")} ref={ref}>
      <button type="button" className="cdate-trigger" onClick={openPicker} disabled={disabled}>
        <Calendar size={13} />
        <span className={value ? "" : "cdate-placeholder"}>{value ? fmtDate(value) : "Elegir fecha"}</span>
      </button>
      {open && (
        <div className={menuClass}>
          <div className="cdate-nav">
            <button type="button" className="icon-btn subtle" onClick={() => setViewMonth(new Date(year, mon - 1, 1))}><ChevronLeft size={14} /></button>
            <span className="cdate-month">{monthLabel}</span>
            <button type="button" className="icon-btn subtle" onClick={() => setViewMonth(new Date(year, mon + 1, 1))}><ChevronRight size={14} /></button>
          </div>
          <div className="cdate-grid cdate-weekdays">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="cdate-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={i} className="cdate-cell cdate-empty" />;
              const iso = isoFor(d);
              const isSel = iso === value;
              const isToday = iso === todayIso;
              return (
                <button
                  type="button" key={i}
                  className={"cdate-cell" + (isSel ? " cdate-selected" : "") + (isToday && !isSel ? " cdate-today" : "")}
                  onClick={() => { onChange(iso); setOpen(false); }}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div className="cdate-foot">
            {clearable && <button type="button" className="cdate-link" onClick={() => { onChange(""); setOpen(false); }}>Borrar</button>}
            <button type="button" className="cdate-link" onClick={() => { onChange(todayISO()); setOpen(false); }}>Hoy</button>
          </div>
        </div>
      )}
    </div>
  );
}
