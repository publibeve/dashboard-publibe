import { useState, useEffect, useRef } from "react";
import { loadGuiones, persistGuiones } from "../services/data.service";
import { subscribeTable } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";
import { useOfflineSync } from "./useOfflineSync";

export function useGuiones(logActivity, setAppError) {
  const [guiones, setGuiones] = useState(null);
  const { syncStatus, persistWithOfflineFallback, getInitialPending } = useOfflineSync("guiones", persistGuiones);
  const loadedOnceRef = useRef(false);
  // useRealtimeReload congela su callback en el momento en que se monta (no
  // se vuelve a crear en cada render) — leer `syncStatus` directo ahí adentro
  // siempre vería el valor de ese instante inicial, nunca el actual. Con una
  // ref, el callback siempre lee el valor más reciente sin importar cuándo
  // se haya "congelado" el cierre.
  const syncStatusRef = useRef(syncStatus);
  syncStatusRef.current = syncStatus;

  useEffect(() => {
    // Si quedó una copia pendiente de una sesión anterior que se cerró sin
    // señal (nunca llegó a sincronizar), esa es la versión más reciente de
    // verdad — se usa como punto de partida en vez de lo que diga el
    // servidor (que en ese caso está desactualizado), y useOfflineSync ya
    // se encarga de reintentar mandarla apenas haya señal.
    const pending = getInitialPending();
    if (pending) {
      setGuiones(pending);
      loadedOnceRef.current = true;
    }
    loadGuiones().then((g) => {
      if (!loadedOnceRef.current) setGuiones(g);
      loadedOnceRef.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeReload(
    (onChange) => subscribeTable("guiones", onChange),
    () => {
      // No pisar el estado local si hay cambios sin sincronizar todavía —
      // si no, un cambio en tiempo real llegado justo mientras se está
      // reconectando podría reemplazar ediciones recientes que aún no
      // terminaron de subir.
      if (syncStatusRef.current !== "synced") return;
      loadGuiones().then((g) => setGuiones(g));
    }
  );

  function updateGuiones(next) { setGuiones(next); persistWithOfflineFallback(next); }
  function addGuion(g) {
    try { updateGuiones([...(guiones || []), g]); logActivity(`Se creó el guion "${g.titulo || "(sin título)"}"`); }
    catch (e) { setAppError("No se pudo crear el guion: " + (e && e.message ? e.message : e)); }
  }
  /**
   * Crear VARIOS guiones de una — usada por "Importar guiones" (IA). A
   * propósito NO es un forEach llamando a addGuion una vez por guion: cada
   * llamada de addGuion lee el mismo `guiones` capturado por el cierre de
   * React, así que 22 llamadas seguidas se pisan entre sí (cada una escribe
   * "lo viejo + 1 guion nuevo", nunca la lista acumulada) y de paso disparan
   * 22 escrituras a Supabase corriendo en paralelo compitiendo por cuál
   * "gana" — ese fue exactamente el bug de "no se guarda nada, sin error".
   * Acá se arma la lista completa en un solo `next` y se persiste UNA sola
   * vez, de forma atómica, y se espera (await) el resultado real de esa
   * escritura para poder avisar si falló.
   *
   * Nota: esto NO pasa por la cola offline — para importar hace falta haber
   * llamado a Gemini momentos antes, algo que ya requiere señal, así que no
   * hay un escenario real de "importar estando sin conexión".
   */
  async function addGuiones(list) {
    if (!list || !list.length) return;
    const previous = guiones || [];
    const next = [...previous, ...list];
    setGuiones(next); // optimista: se ve al toque, sin esperar la red
    try {
      await persistGuiones(next);
    } catch (e) {
      setGuiones(previous); // la escritura real falló — no dejar la pantalla mostrando algo que no se guardó
      throw e;
    }
    logActivity(`Se importaron ${list.length} guion(es) con IA`);
  }
  function patchGuion(id, patch) {
    try { updateGuiones((guiones || []).map((g) => (g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g))); }
    catch (e) { setAppError("No se pudo actualizar el guion: " + (e && e.message ? e.message : e)); }
  }
  function trashGuion(id) {
    try {
      const g = (guiones || []).find((x) => x.id === id);
      updateGuiones((guiones || []).map((x) => (x.id === id ? { ...x, deletedAt: new Date().toISOString() } : x)));
      if (g) logActivity(`Se envió a la papelera el guion "${g.titulo || "(sin título)"}"`);
    } catch (e) { setAppError("No se pudo mover el guion a la papelera: " + (e && e.message ? e.message : e)); }
  }
  function restoreGuion(id) {
    try {
      const g = (guiones || []).find((x) => x.id === id);
      updateGuiones((guiones || []).map((x) => (x.id === id ? { ...x, deletedAt: null } : x)));
      if (g) logActivity(`Se restauró el guion "${g.titulo || "(sin título)"}"`);
    } catch (e) { setAppError("No se pudo restaurar el guion: " + (e && e.message ? e.message : e)); }
  }
  function purgeGuion(id) {
    try {
      const g = (guiones || []).find((x) => x.id === id);
      updateGuiones((guiones || []).filter((x) => x.id !== id));
      if (g) logActivity(`Se eliminó definitivamente el guion "${g.titulo || "(sin título)"}"`);
    } catch (e) { setAppError("No se pudo eliminar el guion: " + (e && e.message ? e.message : e)); }
  }

  return { guiones, setGuiones, updateGuiones, addGuion, addGuiones, patchGuion, trashGuion, restoreGuion, purgeGuion, syncStatus };
}
