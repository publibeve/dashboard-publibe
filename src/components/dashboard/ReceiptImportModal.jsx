import { useState, useRef } from "react";
import {
  X,
  Upload,
  AlertTriangle,
  Loader2,
  FileText,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { CLIENTES, METODOS_PAGO } from "../../utils/constants";
import { uid } from "../../utils/helpers";
import { extractPdfText } from "../../utils/pdfTextExtract";
import { extractPaymentFromReceiptText } from "../../services/ai.service";

export function ReceiptImportModal({ geminiKey, onClose, onExtracted }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setError("");
    if (!geminiKey) { setError('Falta configurar la clave de Gemini (Administrativo → Usuarios y permisos → Asistente IA).'); return; }
    setCargando(true);
    try {
      const texto = await extractPdfText(file);
      const nombresClientes = CLIENTES.map((c) => c.name);
      const extraido = await extractPaymentFromReceiptText(geminiKey, texto, nombresClientes, METODOS_PAGO);
      // Objeto PARCIAL — a propósito no incluye desglose ni cobertura (fuera
      // de alcance: el recibo desglosa por campaña, la app por anuncio, son
      // cosas distintas). NewPaymentModal ya sabe rellenar el resto con
      // valores vacíos/por defecto cuando el campo no viene — mismo
      // mecanismo que ya usa "Duplicar pago", reusado acá tal cual.
      onExtracted({
        id: uid(), empresa: extraido.empresa, fecha: extraido.fecha,
        moneda: "USD", monto: extraido.monto, metodoPago: extraido.metodoPago,
      });
    } catch (e) {
      setError(e && e.message ? e.message : String(e));
    } finally {
      setCargando(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3><FileText size={16} /> Importar desde PDF de Meta</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <p className="hint" style={{ marginTop: 0 }}>
          Subí el recibo/factura en PDF que manda Meta — se extraen empresa, fecha, método de pago y monto total.
          El desglose por campaña del recibo no se usa (es distinto del desglose por anuncio de Inversión) — vas a
          poder revisar y completar todo en el formulario antes de guardar nada.
        </p>
        <label
          className="meta-import-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
        >
          {cargando ? <Loader2 size={20} className="spin" /> : <Upload size={20} />}
          <span>{cargando ? "Leyendo el recibo…" : "Arrastrá el PDF acá, o hacé clic para elegirlo"}</span>
          <input
            ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
      </div>
    </Overlay>
  );
}
