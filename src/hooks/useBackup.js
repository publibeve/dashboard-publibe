import { useState, useEffect } from "react";
import {
  loadDriveConnected, persistDriveConnected, loadLastBackupDate, persistLastBackupDate,
  downloadBackup,
} from "../services/data.service";
import {
  persist, persistPayments, persistPosts, persistDebts, persistNotes,
  persistTareasGenerales, persistInversiones, persistInvoices, persistExpenses, persistAccesos,
} from "../services/data.service";

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

  return { driveConnected, toggleDriveConnected, lastBackupDate, runBackup, restoreBackup };
}
