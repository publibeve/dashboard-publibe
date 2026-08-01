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

  return { guiones, setGuiones, updateGuiones, addGuion, patchGuion, trashGuion, restoreGuion, purgeGuion };
}
