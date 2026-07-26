import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
} from "lucide-react";
import {
  startZohoAuth, clearZohoToken, zohoConfigured, zohoConnected,
  loadZohoRootFolder, persistZohoRootFolder,
} from "../../services/zoho.service";

export function DriveConnectionPanel({ connected, onToggle, can, requirePerm }) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [error, setError] = useState("");
  const [rootFolder, setRootFolder] = useState("");
  const [rootSaved, setRootSaved] = useState(false);
  const canConfig = can("configurarIntegraciones");

  useEffect(() => {
    loadZohoRootFolder().then((id) => setRootFolder(id || ""));
  }, []);

  // Cierre del ciclo OAuth: al volver del login de Zoho, el token ya quedó
  // guardado (main.jsx -> handleZohoRedirect), pero el estado compartido
  // "conectado" (kv_store) todavía no se marcó — sin esto, la UI seguía
  // mostrando "Conectar" y los adjuntos quedaban deshabilitados aunque la
  // autorización hubiera funcionado.
  useEffect(() => {
    if (zohoConnected() && !connected) {
      sessionStorage.removeItem("publibe:zoho-auth-return");
      console.log("✅ Token Zoho guardado correctamente — marcando integración como conectada");
      onToggle(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  function connect() {
    requirePerm("configurarIntegraciones", () => {
      setError("");
      try {
        // Redirige a accounts.zoho.com; al autorizar, Zoho devuelve a la app
        // con el token, y App.jsx marca el estado compartido como conectado.
        startZohoAuth();
      } catch (e) {
        setError(e && e.message ? e.message : String(e));
      }
    });
  }
  function disconnect() {
    requirePerm("configurarIntegraciones", () => {
      clearZohoToken();
      onToggle(false);
      setConfirmDisconnect(false);
    });
  }
  async function saveRoot() {
    const id = await persistZohoRootFolder(rootFolder);
    setRootFolder(id);
    setRootSaved(true);
    setTimeout(() => setRootSaved(false), 2000);
  }

  const tokenActive = zohoConnected();

  return (
    <section className="overview-section">
      <div className="overview-section-head admin-section-head">
        <span className="overview-section-title"><FolderKanban size={15} /> Zoho WorkDrive (adjuntos)</span>
        {connected && tokenActive && (
          <span className="drive-status-badge drive-status-connected"><CheckCircle2 size={12} /> Conectado</span>
        )}
      </div>
      <div className="hint hint-tip" style={{ marginBottom: 14 }}>
        Los archivos que se adjunten en Creativos, Pagos publicitarios, Planificación, Tareas
        generales, Notas, Facturas, Nómina y Gastos operativos se suben a Zoho WorkDrive, en
        carpetas organizadas por cliente y módulo (se crean solas la primera vez que se usan).
        Cada persona autoriza con su propia cuenta de Zoho (ceo@ / designer@publibe.net); la
        sesión dura una hora y se vuelve a pedir sola cuando vence.
      </div>
      {!zohoConfigured() && (
        <div className="hint" style={{ color: "var(--accent)", marginBottom: 12 }}>
          <AlertTriangle size={12} /> Falta VITE_ZOHO_CLIENT_ID en las variables de entorno.
          Ver DEPLOY.md, sección Zoho WorkDrive.
        </div>
      )}
      <div className="field" style={{ marginBottom: 12 }}>
        <span>Carpeta raíz en WorkDrive (creala una vez a mano como "publiBe — Adjuntos",
          compartila con designer@publibe.net desde WorkDrive, y pegá acá su enlace o ID)</span>
        <div className="add-file">
          <input value={rootFolder} onChange={(e) => setRootFolder(e.target.value)} placeholder="https://workdrive.zoho.com/folder/…  o el ID" disabled={!canConfig} />
          <button type="button" className="btn-secondary" onClick={saveRoot} disabled={!canConfig || !rootFolder.trim()}>
            {rootSaved ? "Guardado ✓" : "Guardar"}
          </button>
        </div>
      </div>
      {error && <div className="hint" style={{ color: "var(--accent)", marginBottom: 12 }}>{error}</div>}
      {!connected || !tokenActive ? (
        <button type="button" className="btn-primary" onClick={connect} disabled={!canConfig || !zohoConfigured()} title={!canConfig ? "Necesitas permiso para configurar esto" : ""}>
          <FolderKanban size={14} /> {connected && !tokenActive ? "Volver a conectar Zoho (sesión vencida)" : "Conectar Zoho WorkDrive"}
        </button>
      ) : (
        <div className="drive-connected-row">
          <div className="drive-connected-info">
            <span className="drive-connected-folder"><FolderKanban size={13} /> publiBe — Adjuntos</span>
            <span className="hint">Carpeta raíz compartida, con subcarpetas por cliente y por área administrativa.</span>
          </div>
          {!confirmDisconnect ? (
            <button type="button" className="btn-danger-ghost" onClick={() => setConfirmDisconnect(true)}>Desconectar</button>
          ) : (
            <div className="confirm-row">
              <span><AlertTriangle size={13} /> ¿Desconectar Zoho?</span>
              <button className="btn-danger" onClick={disconnect}>Sí, desconectar</button>
              <button className="btn-secondary" onClick={() => setConfirmDisconnect(false)}>Cancelar</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
