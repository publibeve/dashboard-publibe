import { useState, useEffect } from "react";
import { loadPautas, persistPautas } from "../services/data.service";
import { subscribeTable } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function usePautas(logActivity, setAppError) {
  const [pautas, setPautas] = useState(null);

  useEffect(() => {
    loadPautas().then((p) => setPautas(p));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeTable("pautas", onChange),
    () => loadPautas().then((p) => setPautas(p))
  );

  function updatePautas(next) { setPautas(next); persistPautas(next); }
  function addPauta(p) {
    try { updatePautas([...(pautas || []), p]); logActivity(`Se creó la pauta "${p.etiqueta}"`); }
    catch (e) { setAppError("No se pudo crear la pauta: " + (e && e.message ? e.message : e)); }
  }
  function patchPauta(id, patch) {
    try { updatePautas((pautas || []).map((p) => (p.id === id ? { ...p, ...patch } : p))); }
    catch (e) { setAppError("No se pudo actualizar la pauta: " + (e && e.message ? e.message : e)); }
  }

  return { pautas, setPautas, updatePautas, addPauta, patchPauta };
}
