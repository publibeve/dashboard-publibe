import { useState, useRef } from "react";
import {
  X,
  Upload,
  AlertTriangle,
  Loader2,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { CustomSelect } from "../common/CustomSelect";
import { InversionPreviewCard } from "./InversionPreviewCard";
import { CLIENTES } from "../../utils/constants";
import { uid, weekLabel } from "../../utils/helpers";
import { parseMetaExcelFile } from "../../utils/metaImport";

function grupoToInversion(g, empresa) {
  const fecha = g.fecha || "";
  return {
    id: uid(),
    empresa,
    fecha,
    semana: fecha ? weekLabel(fecha) : g.campana,
    monto: g.montoTotal,
    desglose: g.items.map((it) => ({ id: uid(), concepto: it.concepto, monto: it.monto })),
    nota: "",
    campanaOrigen: g.campana, // solo para mostrar de dónde salió en la vista previa — no es un campo de Inversion
    createdAt: new Date().toISOString(),
    _incluido: true,
  };
}



export function MetaImportModal({ empresa: empresaInicial, defaultClient, onClose, onImport, canSeeMontos = false }) {
  const [empresa, setEmpresa] = useState(empresaInicial || defaultClient);
  const [step, setStep] = useState("subir"); // "subir" | "revisar"
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [inversiones, setInversiones] = useState([]);
  const [importando, setImportando] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setError("");
    setCargando(true);
    try {
      const grupos = await parseMetaExcelFile(file);
      if (!grupos.length) throw new Error('No se encontró ninguna fila "All" en el archivo — ¿es un export de Meta Ads con desglose por anuncio?');
      setInversiones(grupos.map((g) => grupoToInversion(g, empresa)));
      setStep("revisar");
    } catch (e) {
      setError(e && e.message ? e.message : String(e));
    } finally {
      setCargando(false);
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
      const limpias = incluidas.map(({ _incluido, campanaOrigen, ...inv }) => ({ ...inv, empresa }));
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
          <h3><FileSpreadsheet size={16} /> Importar desde Meta</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {step === "subir" && (
          <>
            <p className="hint" style={{ marginTop: 0 }}>
              Subí el reporte exportado de Meta Ads Manager (.xlsx) — se detecta cada semana/campaña automáticamente,
              con su desglose por anuncio. Vas a poder revisar y corregir todo antes de que se cree nada.
            </p>
            <label className="field">
              <span>Cliente</span>
              <CustomSelect
                value={empresa} onChange={setEmpresa}
                options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
              />
            </label>
            <label
              className="meta-import-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            >
              <Upload size={20} />
              <span>{cargando ? "Leyendo el archivo…" : "Arrastrá el archivo acá, o hacé clic para elegirlo"}</span>
              <input
                ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
            {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
          </>
        )}

        {step === "revisar" && (
          <>
            <p className="hint" style={{ marginTop: 0 }}>
              Revisá cada semana antes de importar — destildá las que no quieras cargar, corregí fecha/monto/desglose
              si hace falta. Nada se guarda todavía.
            </p>
            <div className="import-guiones-list">
              {inversiones.map((inv, i) => (
                <InversionPreviewCard
                  key={inv.id} inv={inv} onChange={(next) => updateInv(i, next)} onRemove={() => removeInv(i)}
                  origenLabel={`De la campaña "${inv.campanaOrigen}"`}
                  canSeeMontos={canSeeMontos}
                />
              ))}
            </div>
            {importError && <div className="form-error"><AlertTriangle size={13} /> {importError}</div>}
            <div className="modal-footer modal-footer-row">
              <button type="button" className="btn-secondary" onClick={() => setStep("subir")} disabled={importando}>Volver</button>
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
