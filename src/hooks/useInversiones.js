import { useState, useEffect } from "react";
import { loadInversiones, persistInversiones } from "../services/data.service";
import { fmtMonto } from "../utils/helpers";

export function useInversiones(logActivity, setAppError) {
  const [inversiones, setInversiones] = useState(null);
  const [openInversionId, setOpenInversionId] = useState(null);

  useEffect(() => {
    loadInversiones().then((inv) => setInversiones(inv));
  }, []);

  function updateInversiones(next) { setInversiones(next); persistInversiones(next); }
  function addInversion(inv) {
    try { updateInversiones([...(inversiones || []), inv]); logActivity(`Se registró inversión de ${inv.empresa} (${fmtMonto(inv.monto)})`); }
    catch (e) { setAppError("No se pudo registrar la inversión: " + (e && e.message ? e.message : e)); }
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
    inversiones, setInversiones, updateInversiones, addInversion, patchInversion, deleteInversion,
    openInversionId, setOpenInversionId,
  };
}
