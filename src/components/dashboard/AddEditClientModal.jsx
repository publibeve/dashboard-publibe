import { useState, useRef } from "react";
import {
  X,
  AlertTriangle,
  Palette,
} from "lucide-react";
import { ColorPickerPopover } from "../common/ColorPickerPopover";
import { Overlay } from "../common/Overlay";
import { CLIENTES, CLIENT_COLOR_PALETTE, ICONS_CATALOG } from "../../utils/constants";

export function AddClientModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [iconKey, setIconKey] = useState(ICONS_CATALOG[0].key);
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim()) { setError("Falta el nombre del cliente."); return; }
    if (CLIENTES.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError("Ya existe un cliente con ese nombre."); return;
    }
    const color = CLIENT_COLOR_PALETTE[CLIENTES.length % CLIENT_COLOR_PALETTE.length];
    onCreate({ name: name.trim(), iconKey, color });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Nuevo cliente</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <label className="field">
          <span>Nombre del cliente</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Repuestos El Águila" autoFocus />
        </label>

        <label className="field">
          <span>Ícono (según su rubro)</span>
          <div className="icon-grid">
            {ICONS_CATALOG.map((i) => {
              const Icon = i.icon;
              const active = iconKey === i.key;
              return (
                <button
                  key={i.key} type="button" title={i.label}
                  className={"icon-pick" + (active ? " icon-pick-active" : "")}
                  onClick={() => setIconKey(i.key)}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </label>

        <button className="btn-primary full" type="button" onClick={submit}>Agregar cliente</button>
      </div>
    </Overlay>
  );
}

export function EditClientModal({ client, onClose, onSave }) {
  const [color, setColor] = useState(client.color);
  const [iconKey, setIconKey] = useState(client.iconKey || "building");
  const [showPicker, setShowPicker] = useState(false);
  const eyedropperRef = useRef(null);

  function submit() {
    onSave({ color, iconKey });
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small" style={{ "--primary": color }}>
        <div className="modal-head">
          <h3>Apariencia de {client.name}</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <label className="field">
          <span>Color de la marca</span>
          <div className="color-pick-row">
            <span className="color-preview-dot" style={{ background: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#ccc" }} />
            <input
              className="color-hex-input"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#RRGGBB"
              maxLength={7}
            />
            <div className="color-picker-wrap">
              <button
                type="button" className="eyedropper-btn" ref={eyedropperRef}
                onClick={() => setShowPicker((s) => !s)} title="Elegir color con el selector"
              >
                <Palette size={15} />
              </button>
              {showPicker && (
                <ColorPickerPopover color={color} onChange={setColor} onClose={() => setShowPicker(false)} anchorRef={eyedropperRef} />
              )}
            </div>
          </div>
          <div className="swatch-row">
            {CLIENT_COLOR_PALETTE.map((c) => (
              <button key={c} type="button" className={"swatch" + (c === color ? " swatch-active" : "")} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </label>

        <label className="field">
          <span>Ícono (según su rubro)</span>
          <div className="icon-grid">
            {ICONS_CATALOG.map((i) => {
              const Icon = i.icon;
              const active = iconKey === i.key;
              return (
                <button
                  key={i.key} type="button" title={i.label}
                  className={"icon-pick" + (active ? " icon-pick-active" : "")}
                  onClick={() => setIconKey(i.key)}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </label>

        <button className="btn-primary full" type="button" onClick={submit}>Guardar apariencia</button>
      </div>
    </Overlay>
  );
}
