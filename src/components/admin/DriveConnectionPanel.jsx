import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
} from "lucide-react";

export function DriveConnectionPanel({ connected, onToggle, can, requirePerm }) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const canConfig = can("configurarIntegraciones");

  function connect() {
    requirePerm("configurarIntegraciones", () => onToggle(true));
  }
  function disconnect() {
    requirePerm("configurarIntegraciones", () => { onToggle(false); setConfirmDisconnect(false); });
  }

  return (
    <section className="overview-section">
      <div className="overview-section-head admin-section-head">
        <span className="overview-section-title"><FolderKanban size={15} /> Google Drive (adjuntos)</span>
        {connected && (
          <span className="drive-status-badge drive-status-connected"><CheckCircle2 size={12} /> Conectado</span>
        )}
      </div>
      <div className="hint hint-tip" style={{ marginBottom: 14 }}>
        Conecta una cuenta de Google Drive para que los archivos que se suban en Creativos, Pagos
        publicitarios, Planificación, Tareas generales, Notas, Facturas, Nómina y Gastos operativos
        se guarden ahí — en carpetas organizadas por cliente — en vez de pegar un enlace a mano.
        {" "}<b>Esta es una vista previa de cómo se va a ver</b>: todavía no hay una conexión real a
        la API de Google (falta el dominio publicado y las credenciales — ver el resumen de la
        integración). El botón de abajo simula el estado "conectado" para que puedas revisar cómo
        queda la interfaz en cada módulo.
      </div>
      {!connected ? (
        <button type="button" className="btn-primary" onClick={connect} disabled={!canConfig} title={!canConfig ? "Necesitas permiso para configurar esto" : ""}>
          <FolderKanban size={14} /> Conectar Google Drive
        </button>
      ) : (
        <div className="drive-connected-row">
          <div className="drive-connected-info">
            <span className="drive-connected-folder"><FolderKanban size={13} /> publiBe — Adjuntos</span>
            <span className="hint">Carpeta raíz compartida, con una subcarpeta por cliente y por área administrativa.</span>
          </div>
          {!confirmDisconnect ? (
            <button type="button" className="btn-danger-ghost" onClick={() => setConfirmDisconnect(true)}>Desconectar</button>
          ) : (
            <div className="confirm-row">
              <span><AlertTriangle size={13} /> ¿Desconectar Drive?</span>
              <button className="btn-danger" onClick={disconnect}>Sí, desconectar</button>
              <button className="btn-secondary" onClick={() => setConfirmDisconnect(false)}>Cancelar</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
