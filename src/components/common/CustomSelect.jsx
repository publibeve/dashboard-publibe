import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Check,
} from "lucide-react";

export function CustomSelect({ value, onChange, options, disabled, placeholder }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const MENU_H = 220;
    setOpenUp(window.innerHeight - rect.bottom < MENU_H + 12 && rect.top > MENU_H);
  }, [open]);

  const norm = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = norm.find((o) => o.value === value);
  const CurrentIcon = current && current.icon;

  return (
    <div className={"cselect" + (disabled ? " cselect-disabled" : "")} ref={ref}>
      <button type="button" className="cselect-trigger" onClick={() => !disabled && setOpen((o) => !o)} disabled={disabled}>
        <span className="cselect-value">
          {CurrentIcon && <CurrentIcon size={13} style={{ color: current.color }} />}
          {current ? current.label : (placeholder || "Seleccionar")}
        </span>
        <ChevronDown size={13} className={"cselect-chev" + (open ? " cselect-chev-open" : "")} />
      </button>
      {open && (
        <div className={"cselect-menu" + (openUp ? " cselect-menu-up" : "")}>
          {norm.map((o) => {
            const OptIcon = o.icon;
            const active = o.value === value;
            return (
              <button
                type="button" key={o.value}
                className={"cselect-option" + (active ? " cselect-option-active" : "")}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {OptIcon && <OptIcon size={13} style={{ color: o.color }} />}
                <span>{o.label}</span>
                {active && <Check size={13} className="cselect-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
