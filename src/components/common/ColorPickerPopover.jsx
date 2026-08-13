import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { hexToHsv, hsvToHex } from "../../utils/helpers";

export function ColorPickerPopover({ color, onChange, onClose, anchorRef }) {
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [fixedPos, setFixedPos] = useState(null);
  const squareRef = useRef(null);
  const hueRef = useRef(null);
  const dragTarget = useRef(null);
  const popRef = useRef(null);

  function commit(next) {
    setHsv(next);
    onChange(hsvToHex(next.h, next.s, next.v));
  }
  function fromSquarePoint(clientX, clientY) {
    const rect = squareRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    commit({ ...hsv, s: (x / rect.width) * 100, v: 100 - (y / rect.height) * 100 });
  }
  function fromHuePoint(clientX) {
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    commit({ ...hsv, h: (x / rect.width) * 360 });
  }

  // El modal tiene propiedades (transform durante su animación, y
  // backdrop-filter de forma permanente para el efecto vidrio) que, cada
  // una por separado, convierten a .modal en el "contenedor" de cualquier
  // position:fixed adentro suyo — en vez de perseguir cada propiedad nueva
  // que cause esto, el popover se monta directo en document.body via
  // Portal, así queda estructuralmente afuera de esa jerarquía y sus
  // coordenadas de pantalla (medidas acá) siempre valen tal cual, sin
  // importar qué CSS tenga cualquier ancestro.
  useLayoutEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const POP_W = 220, POP_H = 214;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - POP_W - 8);
    const top = rect.bottom + 8 + POP_H > window.innerHeight - 8
      ? Math.max(8, rect.top - POP_H - 8)
      : rect.bottom + 8;
    setFixedPos({ top, left });
  }, [anchorRef]);

  useEffect(() => {
    function onMove(e) {
      if (dragTarget.current === "square") fromSquarePoint(e.clientX, e.clientY);
      else if (dragTarget.current === "hue") fromHuePoint(e.clientX);
    }
    function onUp() { dragTarget.current = null; }
    function onDocClick(e) {
      if (popRef.current && !popRef.current.contains(e.target) && anchorRef?.current && !anchorRef.current.contains(e.target)) onClose();
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mousedown", onDocClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsv]);

  const pureHue = hsvToHex(hsv.h, 100, 100);

  return createPortal(
    <div className="color-picker-pop" ref={popRef} style={fixedPos ? { position: "fixed", top: fixedPos.top, left: fixedPos.left } : { visibility: "hidden" }}>
      <div
        className="color-picker-square"
        ref={squareRef}
        style={{ background: pureHue }}
        onMouseDown={(e) => { dragTarget.current = "square"; fromSquarePoint(e.clientX, e.clientY); }}
      >
        <div className="color-picker-square-white" />
        <div className="color-picker-square-black" />
        <span className="color-picker-cursor" style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }} />
      </div>
      <div
        className="color-picker-hue"
        ref={hueRef}
        onMouseDown={(e) => { dragTarget.current = "hue"; fromHuePoint(e.clientX); }}
      >
        <span className="color-picker-hue-cursor" style={{ left: `${(hsv.h / 360) * 100}%` }} />
      </div>
    </div>,
    document.body
  );
}
