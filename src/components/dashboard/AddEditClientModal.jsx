import { useState, useRef } from "react";
import {
  X,
  AlertTriangle,
  Palette,
  Pipette,
  Image as ImageIcon,
  Upload,
  Trash2,
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
  const [name, setName] = useState(client.name);
  const [color, setColor] = useState(client.color);
  const [iconKey, setIconKey] = useState(client.iconKey || "building");
  const [logoSvg, setLogoSvg] = useState(client.logoSvg || "");
  const [razonSocial, setRazonSocial] = useState(client.razonSocial || "");
  const [direccionFiscal, setDireccionFiscal] = useState(client.direccionFiscal || "");
  const [showPicker, setShowPicker] = useState(false);
  const [eyedropperError, setEyedropperError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [error, setError] = useState("");
  const eyedropperRef = useRef(null);
  const logoInputRef = useRef(null);

  // El cuentagotas real (tomar un color de cualquier parte de la pantalla,
  // no solo de adentro de este selector) usa la API nativa EyeDropper del
  // navegador — hoy solo la soportan Chrome y Edge, ni Firefox ni Safari
  // todavía. No hay margen técnico para "arreglar" eso en los navegadores
  // que no la tienen — lo único correcto es avisarlo claro en vez de que el
  // botón no haga nada en silencio.
  async function handleEyedropper() {
    setEyedropperError("");
    if (!("EyeDropper" in window)) {
      setEyedropperError("El cuentagotas para tomar un color de la pantalla solo funciona en Chrome o Edge — este navegador no lo soporta todavía. Podés elegir el color con la ruedita de al lado, o escribir el código manualmente.");
      return;
    }
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      setColor(result.sRGBHex);
    } catch (e) {
      // AbortError = el usuario canceló (tecla Escape) — no es un error real, no hay nada que avisar.
    }
  }

  function handleLogoFile(file) {
    setLogoError("");
    if (!file) return;
    if (!/\.svg$/i.test(file.name) && file.type !== "image/svg+xml") {
      setLogoError("Solo se acepta un archivo .svg — es el único formato que se puede recolorear automáticamente para fondos oscuros sin un segundo archivo.");
      return;
    }
    if (file.size > 500 * 1024) {
      setLogoError("El archivo es demasiado grande (más de 500 KB) — revisá que sea el SVG del logo y no otra cosa.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      if (!/<svg[\s>]/i.test(text)) {
        setLogoError("El archivo no parece ser un SVG válido (no se encontró la etiqueta <svg>).");
        return;
      }
      setLogoSvg(text);
    };
    reader.onerror = () => setLogoError("No se pudo leer el archivo — probá de nuevo.");
    reader.readAsText(file);
  }

  function submit() {
    setError("");
    if (!name.trim()) { setError("Falta el nombre de la empresa."); return; }
    if (name.trim() !== client.name && CLIENTES.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError("Ya existe otro cliente con ese nombre."); return;
    }
    onSave({ name: name.trim(), color, iconKey, logoSvg: logoSvg || null, razonSocial: razonSocial.trim() || null, direccionFiscal: direccionFiscal.trim() || null });
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small" style={{ "--primary": color }}>
        <div className="modal-head">
          <h3>Configuración de {client.name}</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <label className="field">
          <span>Nombre de la empresa</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: ToyoReyna" />
        </label>
        {name.trim() !== client.name && name.trim() && (
          <div className="hint" style={{ marginTop: -6, marginBottom: 10 }}>
            Al renombrar, se actualiza automáticamente en todas las tareas, pagos, notas, guiones y demás — no
            queda nada bajo el nombre viejo.
          </div>
        )}

        <label className="field">
          <span>Razón social (para facturas)</span>
          <input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder='Ej: "TRANSFERS MDA C.A." — distinto del nombre corto de arriba' />
        </label>
        <label className="field">
          <span>Dirección fiscal (para facturas)</span>
          <textarea rows={2} value={direccionFiscal} onChange={(e) => setDireccionFiscal(e.target.value)} placeholder="Ej: Av. Urdaneta, Aeropuerto Alberto Carnevali, Local 14. Mérida, Venezuela" />
        </label>

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
                type="button" className="eyedropper-btn" onClick={handleEyedropper} title="Cuentagotas — tomar un color de cualquier parte de la pantalla"
              >
                <Pipette size={15} />
              </button>
              <button
                type="button" className="eyedropper-btn" ref={eyedropperRef}
                onClick={() => setShowPicker((s) => !s)} title="Elegir color con la ruedita"
              >
                <Palette size={15} />
              </button>
              {showPicker && (
                <ColorPickerPopover color={color} onChange={setColor} onClose={() => setShowPicker(false)} anchorRef={eyedropperRef} />
              )}
            </div>
          </div>
          {eyedropperError && <div className="form-error" style={{ marginTop: 6 }}><AlertTriangle size={13} /> {eyedropperError}</div>}
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

        <label className="field">
          <span><ImageIcon size={12} /> Logo (SVG, opcional)</span>
          {logoSvg ? (
            <div className="logo-upload-preview">
              <div className="logo-upload-preview-light" dangerouslySetInnerHTML={{ __html: logoSvg }} />
              <div className="logo-upload-preview-dark" dangerouslySetInnerHTML={{ __html: logoSvg }} />
              <button type="button" className="btn-secondary" onClick={() => setLogoSvg("")}><Trash2 size={12} /> Quitar logo</button>
            </div>
          ) : (
            <label
              className="meta-import-dropzone" style={{ padding: "18px 16px" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleLogoFile(e.dataTransfer.files?.[0]); }}
            >
              <Upload size={18} />
              <span>Arrastrá el .svg del logo acá, o hacé clic para elegirlo</span>
              <input
                ref={logoInputRef} type="file" accept=".svg,image/svg+xml" style={{ display: "none" }}
                onChange={(e) => handleLogoFile(e.target.files?.[0])}
              />
            </label>
          )}
          <div className="hint" style={{ marginTop: 6 }}>
            Con un solo archivo alcanza — en fondos oscuros se convierte automáticamente a blanco, no hace falta
            subir una segunda versión.
          </div>
          {logoError && <div className="form-error" style={{ marginTop: 6 }}><AlertTriangle size={13} /> {logoError}</div>}
        </label>

        <button className="btn-primary full" type="button" onClick={submit}>Guardar cambios</button>
      </div>
    </Overlay>
  );
}
