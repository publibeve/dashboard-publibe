import { useState, useEffect } from "react";
import { loadGuiones, persistGuiones } from "../services/data.service";
import { subscribeTable } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function useGuiones(logActivity, setAppError) {
  const [guiones, setGuiones] = useState(null);

  useEffect(() => {
    loadGuiones().then((g) => setGuiones(g));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeTable("guiones", onChange),
    () => loadGuiones().then((g) => setGuiones(g))
  );

  function updateGuiones(next) { setGuiones(next); persistGuiones(next); }
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

  return { guiones, setGuiones, updateGuiones, addGuion, addGuiones, patchGuion, trashGuion, restoreGuion, purgeGuion };
}
