import { useState, useEffect } from "react";
import { loadTareasGenerales, persistTareasGenerales, TAREAS_KEY } from "../services/data.service";
import { subscribeKvKey } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function useTareasGenerales(logActivity, setAppError) {
  const [tareasGenerales, setTareasGenerales] = useState(null);
  const [openTareaGeneralId, setOpenTareaGeneralId] = useState(null);

  useEffect(() => {
    loadTareasGenerales().then((t) => setTareasGenerales(t));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeKvKey(TAREAS_KEY, onChange),
    () => loadTareasGenerales().then((t) => setTareasGenerales(t))
  );

  function updateTareasGenerales(next) { setTareasGenerales(next); persistTareasGenerales(next); }
  function addTareaGeneral(t) {
    try { updateTareasGenerales([...(tareasGenerales || []), t]); logActivity(`Se creó una tarea general para ${t.asignado}`); }
    catch (e) { setAppError("No se pudo crear la tarea: " + (e && e.message ? e.message : e)); }
  }
  function patchTareaGeneral(id, patch) {
    try { updateTareasGenerales((tareasGenerales || []).map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))); }
    catch (e) { setAppError("No se pudo actualizar la tarea: " + (e && e.message ? e.message : e)); }
  }
  function deleteTareaGeneral(id) {
    try {
      updateTareasGenerales((tareasGenerales || []).filter((t) => t.id !== id));
      setOpenTareaGeneralId(null);
      logActivity("Se eliminó una tarea general");
    } catch (e) { setAppError("No se pudo eliminar la tarea: " + (e && e.message ? e.message : e)); }
  }

  return {
    tareasGenerales, setTareasGenerales, updateTareasGenerales, addTareaGeneral, patchTareaGeneral, deleteTareaGeneral,
    openTareaGeneralId, setOpenTareaGeneralId,
  };
}
