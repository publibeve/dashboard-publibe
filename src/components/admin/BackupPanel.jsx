import { useState, useRef } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  History,
  Copy,
  Upload,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { fmtDate } from "../../utils/helpers";

export function BackupPanel({ lastBackupDate, onRunBackup, onRestoreBackup, can, requirePerm }) {
  const canBackup = can("administrativo");
  const dias = lastBackupDate ? Math.floor((Date.now() - new Date(lastBackupDate).getTime()) / 86400000) : null;
  const stale = dias === null || dias >= 7;
  const fileInputRef = useRef(null);
  const [pendingRestore, setPendingRestore] = useState(null); // { payload, resumen }
  const [restoreError, setRestoreError] = useState("");
  const [restoreDone, setRestoreDone] = useState(false);

  function handleClick() {
    requirePerm("administrativo", onRunBackup);
  }

  function onFileChosen(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo si hace falta
    if (!file) return;
    setRestoreError("");
    setRestoreDone(false);
    const reader = new FileReader();
    reader.onload = () => {
      let payload;
      try {
        payload = JSON.parse(reader.result);
      } catch (err) {
        setRestoreError("Ese archivo no es un JSON válido.");
        return;
      }
      const d = payload && payload.datos;
      if (!d) {
        setRestoreError("Ese archivo no tiene el formato de un backup de publiBe.");
        return;
      }
      const conteo = (arr) => (Array.isArray(arr) ? arr.length : 0);
      setPendingRestore({
        payload,
        resumen: [
          ["Tareas de Creativos", conteo(d.tareasCreativos)],
          ["Pagos publicitarios", conteo(d.pagosPublicitarios)],
          ["Publicaciones", conteo(d.publicaciones)],
          ["Pendientes por cobrar", conteo(d.pendientesPorCobrar)],
          ["Notas", conteo(d.notas)],
          ["Tareas generales", conteo(d.tareasGenerales)],
          ["Inversiones publicitarias", conteo(d.inversionesPublicitarias)],
          ["Facturas", conteo(d.facturas)],
          ["Gastos y nómina", conteo(d.gastosYNomina)],
          ["Accesos de clientes", conteo(d.accesosDeClientes)],
        ],
        generadoEl: payload.generadoEl,
      });
    };
    reader.readAsText(file);
  }

  function confirmRestore() {
    requirePerm("administrativo", () => {
      const ok = onRestoreBackup(pendingRestore.payload);
      setPendingRestore(null);
      setRestoreError(ok ? "" : "No se pudo restaurar ese archivo.");
      setRestoreDone(ok);
    });
  }

  return (
    <section className="overview-section">
      <div className="overview-section-head admin-section-head">
        <span className="overview-section-title"><History size={15} /> Backup</span>
      </div>
      <div className="hint hint-tip" style={{ marginBottom: 14 }}>
        Descarga una copia completa de toda la información de la app — tareas de Creativos, pagos
        publicitarios, publicaciones planificadas, pendientes por cobrar, notas, tareas generales,
        inversiones publicitarias, facturas, gastos y nómina, y accesos de clientes — en un solo
        archivo. <b>No incluye los archivos adjuntos</b> (esos van a vivir en Google Drive, no
        tiene sentido duplicarlos acá). No es automático: te toca entrar y darle clic — lo ideal es
        hacerlo una vez por semana. Guarda el archivo donde prefieras (tu computadora, una carpeta
        de Drive, un disco externo — donde te sea más cómodo tenerlo a salvo). Ese archivo lo
        descarga tu navegador directo a tu computadora, como cualquier otra descarga — la app ni
        Netlify lo guardan en ningún lado; de ahí en adelante es responsabilidad tuya guardarlo
        donde prefieras.
      </div>

      <div className={"backup-status-row" + (stale ? " backup-status-stale" : " backup-status-ok")}>
        {stale ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
        <span>
          {lastBackupDate
            ? `Último backup: hace ${dias === 0 ? "menos de un día" : `${dias} día${dias === 1 ? "" : "s"}`} (${fmtDate(lastBackupDate.slice(0, 10))})`
            : "Todavía no se ha hecho ningún backup."}
          {stale && lastBackupDate && " — ya pasó una semana, es buen momento para hacer uno nuevo."}
        </span>
      </div>

      <button type="button" className="btn-primary" onClick={handleClick} disabled={!canBackup} title={!canBackup ? "Necesitas permiso de Panel Administrativo" : ""}>
        <Copy size={14} /> Descargar backup ahora
      </button>

      <div className="backup-restore-block">
        <h4><Upload size={13} /> Restaurar desde un backup</h4>
        <div className="hint" style={{ marginBottom: 10 }}>
          Sube un archivo de backup descargado anteriormente para restaurar la información a ese
          momento. <b>Esto reemplaza los datos actuales</b> — úsalo solo si de verdad necesitas
          recuperar información perdida.
        </div>
        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={onFileChosen} style={{ display: "none" }} />
        <button
          type="button" className="btn-secondary"
          onClick={() => requirePerm("administrativo", () => fileInputRef.current?.click())}
          disabled={!canBackup}
        >
          <Upload size={13} /> Subir archivo para restaurar información
        </button>
        {restoreError && <div className="form-error" style={{ marginTop: 8 }}><AlertTriangle size={13} /> {restoreError}</div>}
        {restoreDone && <div className="hint" style={{ marginTop: 8, color: "#2E7D46" }}><CheckCircle2 size={13} /> Información restaurada correctamente.</div>}
      </div>

      {pendingRestore && (
        <Overlay onClose={() => setPendingRestore(null)}>
          <div className="modal small">
            <div className="modal-head">
              <h3><AlertTriangle size={16} color="#C1443C" /> Confirmar restauración</h3>
              <button type="button" className="icon-btn" onClick={() => setPendingRestore(null)}><X size={16} /></button>
            </div>
            <div className="hint" style={{ marginBottom: 12 }}>
              Esto va a <b>reemplazar toda la información actual</b> de la app por lo que hay en
              este archivo{pendingRestore.generadoEl ? ` (generado el ${fmtDate(pendingRestore.generadoEl.slice(0, 10))})` : ""}.
              No se puede deshacer. Esto es lo que contiene:
            </div>
            <div className="backup-resumen-list">
              {pendingRestore.resumen.map(([label, n]) => (
                <div className="backup-resumen-row" key={label}><span>{label}</span><b>{n}</b></div>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button type="button" className="btn-secondary" onClick={() => setPendingRestore(null)}>Cancelar</button>
              <button type="button" className="btn-danger" onClick={confirmRestore}>Sí, reemplazar mi información</button>
            </div>
          </div>
        </Overlay>
      )}
    </section>
  );
}
