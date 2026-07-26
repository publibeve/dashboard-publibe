import { useState } from "react";
import {
  Sparkles,
} from "lucide-react";

export function GeminiKeyPanel({ geminiKey, onSaveKey, can, requirePerm }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const canConfig = can("configurarIA");

  function startEdit() {
    requirePerm("configurarIA", () => { setDraft(geminiKey || ""); setEditing(true); });
  }
  function save() {
    onSaveKey(draft.trim());
    setEditing(false);
  }

  return (
    <section className="overview-section">
      <div className="overview-section-head admin-section-head">
        <span className="overview-section-title"><Sparkles size={15} /> Asistente IA (Gemini)</span>
      </div>
      <div className="hint hint-tip" style={{ marginBottom: 10 }}>
        La clave se consigue gratis en <b>Google AI Studio</b> (aistudio.google.com → "Get API key"). Sin clave, el
        botón de asistente en la esquina no podrá responder. Por ahora la clave se guarda en el almacenamiento de la
        app — al pasar esto a un hosting real conviene moverla a una función de servidor para que nunca viaje por el navegador.
      </div>
      {!editing ? (
        <div className="pass-field-row" style={{ maxWidth: 420 }}>
          <input type="password" value={geminiKey ? "•".repeat(28) : ""} disabled placeholder="Sin clave configurada" />
          <button type="button" className="btn-secondary" onClick={startEdit}>{geminiKey ? "Cambiar" : "Configurar"}</button>
        </div>
      ) : (
        <div className="pass-field-row" style={{ maxWidth: 420 }}>
          <input
            type="text" value={draft} autoFocus placeholder="Pega aquí tu clave de Gemini"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          />
          <button type="button" className="btn-primary" onClick={save}>Guardar</button>
          <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
        </div>
      )}
      {!canConfig && <div className="hint" style={{ marginTop: 6 }}>Necesitas el permiso "Configurar asistente IA" para cambiarla.</div>}
    </section>
  );
}
