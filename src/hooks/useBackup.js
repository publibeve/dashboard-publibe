import { useState, useEffect } from "react";
import {
  loadDriveConnected, persistDriveConnected, loadLastBackupDate, persistLastBackupDate,
  downloadBackup, buildBackupPayload, DRIVE_CONNECTED_STORAGE, LAST_BACKUP_STORAGE,
} from "../services/data.service";
import {
  persist, persistPayments, persistPosts, persistDebts, persistNotes,
  persistTareasGenerales, persistInversiones, persistInvoices, persistExpenses, persistAccesos,
} from "../services/data.service";
import { subscribeKvKey } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";
import { ensureZohoFolderPath, uploadZohoFile } from "../services/zoho.service";

/**
 * Backup manual (descarga un JSON con todo) y restauración desde un backup previo,
 * más el estado (maqueta visual) de conexión con Google Drive. Es transversal por
 * naturaleza -- toca los 10 módulos de datos a la vez -- así que recibe todo el
 * estado + setters de dominio en `dataBundle` para poder leer/escribir cada uno.
 */
export function useBackup(logActivity) {
  const [driveConnected, setDriveConnectedState] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(null);

  useEffect(() => {
    loadDriveConnected().then((v) => setDriveConnectedState(v));
    loadLastBackupDate().then((d) => setLastBackupDate(d));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeKvKey(DRIVE_CONNECTED_STORAGE, onChange),
    () => loadDriveConnected().then((v) => setDriveConnectedState(v))
  );
  useRealtimeReload(
    (onChange) => subscribeKvKey(LAST_BACKUP_STORAGE, onChange),
    () => loadLastBackupDate().then((d) => setLastBackupDate(d))
  );

  function toggleDriveConnected(val) {
    setDriveConnectedState(val);
    persistDriveConnected(val);
    logActivity(val ? "Se conectó Google Drive" : "Se desconectó Google Drive");
  }

  function runBackup(dataBundle) {
    downloadBackup(dataBundle);
    const now = new Date().toISOString();
    setLastBackupDate(now);
    persistLastBackupDate(now);
    logActivity("Se descargó un backup manual de la información");
  }

  /**
   * Sube el mismo backup a WorkDrive en vez de (o además de) descargarlo —
   * reusa la conexión de Zoho ya autorizada en el navegador de quien lo usa,
   * el mismo mecanismo que ya existe para adjuntos. Decisiones tomadas:
   * - Carpeta: "Backups" dentro de la raíz compartida "publiBe — Adjuntos"
   *   (se crea sola la primera vez, igual que cualquier otra carpeta de
   *   adjuntos — no hace falta crearla a mano).
   * - Cada backup queda como un ARCHIVO NUEVO (con fecha y hora en el
   *   nombre), nunca sobrescribe el anterior — así un backup que salga mal
   *   a mitad de subida nunca borra uno bueno que ya estaba guardado, y de
   *   paso queda un historial de snapshots en WorkDrive si hace falta volver
   *   a uno de hace unas semanas.
   * No hace nada solo/automático: es la misma acción manual de "Descargar
   * backup", solo que el destino es WorkDrive en vez del disco — sigue
   * necesitando que alguien entre y le dé clic.
   */
  async function runWorkDriveBackup(dataBundle) {
    const payload = buildBackupPayload(dataBundle);
    const json = JSON.stringify(payload, null, 2);
    const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16); // 2026-07-31-14-20
    const filename = `publibe-backup-${stamp}.json`;
    const file = new File([json], filename, { type: "application/json" });

    const folderId = await ensureZohoFolderPath("Backups");
    await uploadZohoFile(folderId, file);

    const now = new Date().toISOString();
    setLastBackupDate(now);
    persistLastBackupDate(now);
    logActivity("Se guardó un backup manual en WorkDrive");
  }

  function restoreBackup(payload, setters) {
    const d = payload && payload.datos;
    if (!d) return false;
    const map = [
      [d.tareasCreativos, setters.setTasks, persist],
      [d.pagosPublicitarios, setters.setPayments, persistPayments],
      [d.publicaciones, setters.setPosts, persistPosts],
      [d.pendientesPorCobrar, setters.setDebts, persistDebts],
      [d.notas, setters.setNotes, persistNotes],
      [d.tareasGenerales, setters.setTareasGenerales, persistTareasGenerales],
      [d.inversionesPublicitarias, setters.setInversiones, persistInversiones],
      [d.facturas, setters.setInvoices, persistInvoices],
      [d.gastosYNomina, setters.setExpenses, persistExpenses],
      [d.accesosDeClientes, setters.setAccesos, persistAccesos],
    ];
    map.forEach(([list, setter, persister]) => {
      if (Array.isArray(list) && setter) {
        setter(list);
        persister(list);
      }
    });
    logActivity("Se restauró la información desde un archivo de backup");
    return true;
  }

  return { driveConnected, toggleDriveConnected, lastBackupDate, runBackup, runWorkDriveBackup, restoreBackup };
}
