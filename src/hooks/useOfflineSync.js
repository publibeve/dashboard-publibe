import { useState, useEffect, useRef, useCallback } from "react";
import { savePendingLocal, loadPendingLocal, clearPendingLocal, isProbablyOnline } from "../utils/offlineSync";

/**
 * Envuelve una función de persistencia (ej. persistGuiones) para que, si
 * falla por falta de señal, la última versión quede guardada en el propio
 * dispositivo y se reintente sola al reconectar — en vez de perderse.
 *
 * domain: nombre corto único (ej. "guiones") — así conviven varias colas
 * sin pisarse si en el futuro se extiende a otros módulos.
 */
export function useOfflineSync(domain, persistFn) {
  const [syncStatus, setSyncStatus] = useState("synced"); // "synced" | "offline" | "syncing"
  const persistFnRef = useRef(persistFn);
  persistFnRef.current = persistFn;

  const flush = useCallback(async () => {
    const pending = loadPendingLocal(domain);
    if (!pending) return;
    if (!isProbablyOnline()) { setSyncStatus("offline"); return; }
    setSyncStatus("syncing");
    try {
      await persistFnRef.current(pending.data);
      clearPendingLocal(domain);
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("offline");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  // Al montar: si quedó algo pendiente de una sesión anterior que nunca
  // llegó a sincronizar (se cerró la app sin señal), se intenta ya.
  useEffect(() => { flush(); }, [flush]);

  // Reintento apenas el navegador avisa que volvió la señal.
  useEffect(() => {
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [flush]);

  // Reintento periódico de respaldo — el evento "online" no siempre dispara
  // confiable en todos los navegadores móviles, sobre todo con datos
  // compartidos/hotspot donde la señal "parpadea".
  useEffect(() => {
    const t = setInterval(flush, 20000);
    return () => clearInterval(t);
  }, [flush]);

  async function persistWithOfflineFallback(data) {
    if (!isProbablyOnline()) {
      savePendingLocal(domain, data);
      setSyncStatus("offline");
      return;
    }
    try {
      await persistFnRef.current(data);
      clearPendingLocal(domain);
      setSyncStatus("synced");
    } catch (e) {
      savePendingLocal(domain, data);
      setSyncStatus("offline");
    }
  }

  function getInitialPending() {
    const pending = loadPendingLocal(domain);
    return pending ? pending.data : null;
  }

  return { syncStatus, persistWithOfflineFallback, getInitialPending };
}
