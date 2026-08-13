import { useState } from "react";
import {
  X,
  Sparkles,
  AlertTriangle,
  Loader2,
  Check,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { CustomSelect } from "../common/CustomSelect";
import { InversionPreviewCard } from "./InversionPreviewCard";
import { CLIENTES } from "../../utils/constants";
import { uid, weekLabel } from "../../utils/helpers";
import { extractInversionesFromText } from "../../services/ai.service";

function extraidaToInversion(ex, empresa) {
  const fecha = ex.fecha || "";
  return {
    id: uid(),
    empresa,
    fecha,
    semana: (ex.semana && ex.semana.trim()) || (fecha ? weekLabel(fecha) : ""),
    monto: Number(ex.monto || 0),
    desglose: (ex.desglose || []).map((d) => ({ id: uid(), concepto: d.concepto || "", monto: Number(d.monto || 0) })),
    nota: ex.nota || "",
    createdAt: new Date().toISOString(),
    _incluido: true,
  };
}

export function TextImportModal({ empresa: empresaInicial, defaultClient, geminiKey, onClose, onImport }) {
  const [empresa, setEmpresa] = useState(empresaInicial || defaultClient);
  const [texto, setTexto] = useState("");
  const [step, setStep] = useState("pegar"); // "pegar" | "revisar"
  const [extrayendo, setExtrayendo] = useState(false);
  const [error, setError] = useState("");
  const [inversiones, setInversiones] = useState([]);
  const [importando, setImportando] = useState(false);
  const [importError, setImportError] = useState("");

  async function handleExtraer() {
    if (!texto.trim()) { setError("Pegá el mensaje o texto primero."); return; }
    if (!geminiKey) { setError('Falta configurar la clave de Gemini (Administrativo → Usuarios y permisos → Asistente IA).'); return; }
    setError("");
    setExtrayendo(true);
    try {
      const extraidas = await extractInversionesFromText(geminiKey, texto);
      if (!extraidas.length) throw new Error("No se encontró ninguna semana de inversión en el texto pegado.");
      setInversiones(extraidas.map((ex) => extraidaToInversion(ex, empresa)));
      setStep("revisar");
    } catch (e) {
      setError(e && e.message ? e.message : String(e));
    } finally {
      setExtrayendo(false);
    }
  }

  function updateInv(index, next) {
    setInversiones((list) => list.map((inv, i) => (i === index ? next : inv)));
  }
  function removeInv(index) {
    setInversiones((list) => list.filter((_, i) => i !== index));
  }

  const incluidas = inversiones.filter((inv) => inv._incluido);

  async function confirmar() {
    setImportError("");
    setImportando(true);
    try {
      const limpias = incluidas.map(({ _incluido, ...inv }) => ({ ...inv, empresa }));
      await onImport(limpias);
      onClose();
    } catch (e) {
      setImportError("No se pudieron guardar las inversiones: " + (e && e.message ? e.message : e));
    } finally {
      setImportando(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal import-guiones-modal">
        <div className="modal-head">
          <h3><Sparkles size={16} /> Importar desde texto</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {step === "pegar" && (
          <>
            <p className="hint" style={{ marginTop: 0 }}>
              Pegá el mensaje o nota tal como lo escribiste (WhatsApp, por ejemplo) — la IA identifica cada semana, su
              monto, y el desglose por elemento si el texto lo trae. Si el texto lista elementos sin un monto propio
              para cada uno, no se inventa ningún reparto — queda como nota, editable igual antes de confirmar.
            </p>
            <label className="field">
              <span>Cliente</span>
              <CustomSelect
                value={empresa} onChange={setEmpresa}
                options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
              />
            </label>
            <label className="field">
              <span>Texto</span>
              <textarea
                className="import-textarea" rows={12} value={texto} onChange={(e) => setTexto(e.target.value)}
                placeholder="Pegá acá el mensaje completo…"
              />
            </label>
            {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
            <button type="button" className="btn-primary full" onClick={handleExtraer} disabled={extrayendo} style={{ marginTop: 4 }}>
              {extrayendo ? <><Loader2 size={14} className="spin" /> Extrayendo con IA…</> : <><Sparkles size={14} /> Extraer inversión</>}
            </button>
          </>
        )}

        {step === "revisar" && (
          <>
            <p className="hint" style={{ marginTop: 0 }}>
              Revisá cada semana antes de importar — destildá las que no quieras cargar, corregí fecha/monto/desglose/nota
              si hace falta. Nada se guarda todavía.
            </p>
            <div className="import-guiones-list">
              {inversiones.map((inv, i) => (
                <InversionPreviewCard
                  key={inv.id} inv={inv} onChange={(next) => updateInv(i, next)} onRemove={() => removeInv(i)}
                  origenLabel="Del texto pegado"
                />
              ))}
            </div>
            {importError && <div className="form-error"><AlertTriangle size={13} /> {importError}</div>}
            <div className="modal-footer modal-footer-row">
              <button type="button" className="btn-secondary" onClick={() => setStep("pegar")} disabled={importando}>Volver</button>
              <button type="button" className="btn-primary" onClick={confirmar} disabled={incluidas.length === 0 || importando}>
                {importando ? <><Loader2 size={14} className="spin" /> Guardando…</> : <><Check size={14} /> Confirmar e importar ({incluidas.length})</>}
              </button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}
