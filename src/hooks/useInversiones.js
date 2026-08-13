import { useState, useEffect } from "react";
import { loadInversiones, persistInversiones, INVERSIONES_KEY } from "../services/data.service";
import { subscribeKvKey } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";
import { fmtMonto } from "../utils/helpers";

export function useInversiones(logActivity, setAppError) {
  const [inversiones, setInversiones] = useState(null);
  const [openInversionId, setOpenInversionId] = useState(null);

  useEffect(() => {
    loadInversiones().then((inv) => setInversiones(inv));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeKvKey(INVERSIONES_KEY, onChange),
    () => loadInversiones().then((inv) => setInversiones(inv))
  );

  function updateInversiones(next) { setInversiones(next); persistInversiones(next); }
  function addInversion(inv) {
    try { updateInversiones([...(inversiones || []), inv]); logActivity(`Se registró inversión de ${inv.empresa} (${fmtMonto(inv.monto)})`); }
    catch (e) { setAppError("No se pudo registrar la inversión: " + (e && e.message ? e.message : e)); }
  }
  /**
   * Crear VARIAS inversiones de una — para "Importar desde Meta", que
   * puede detectar varias semanas en un solo archivo. Mismo motivo que
   * addGuiones (bulk import de guiones): un forEach llamando a
   * addInversion una vez por semana pisaría resultados entre sí por el
   * mismo cierre de React desactualizado — acá se arma la lista completa y
   * se persiste una sola vez, de forma atómica.
   */
  async function addInversiones(list) {
    if (!list || !list.length) return;
    const previous = inversiones || [];
    const next = [...previous, ...list];
    setInversiones(next);
    try {
      await persistInversiones(next);
    } catch (e) {
      setInversiones(previous);
      throw e;
    }
    logActivity(`Se importaron ${list.length} inversión(es) semanal(es) desde Meta`);
  }
  function patchInversion(id, patch) {
    try { updateInversiones((inversiones || []).map((i) => (i.id === id ? { ...i, ...patch } : i))); }
    catch (e) { setAppError("No se pudo actualizar la inversión: " + (e && e.message ? e.message : e)); }
  }
  function deleteInversion(id) {
    try {
      const inv = (inversiones || []).find((x) => x.id === id);
      updateInversiones((inversiones || []).filter((x) => x.id !== id)); setOpenInversionId(null);
      if (inv) logActivity(`Se eliminó la inversión de ${inv.empresa}`);
    } catch (e) { setAppError("No se pudo eliminar la inversión: " + (e && e.message ? e.message : e)); }
  }

  return {
    inversiones, setInversiones, updateInversiones, addInversion, addInversiones, patchInversion, deleteInversion,
    openInversionId, setOpenInversionId,
  };
}
