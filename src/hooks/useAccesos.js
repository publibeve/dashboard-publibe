import { useState, useEffect } from "react";
import { loadAccesos, persistAccesos } from "../services/data.service";

export function useAccesos(logActivity, setAppError) {
  const [accesos, setAccesos] = useState(null);
  const [openAccesoId, setOpenAccesoId] = useState(null);

  useEffect(() => {
    loadAccesos().then((a) => setAccesos(a));
  }, []);

  function updateAccesos(next) { setAccesos(next); persistAccesos(next); }
  function addAcceso(a) {
    try { updateAccesos([...(accesos || []), a]); logActivity(`Se registró un acceso de ${a.plataforma === "Otro" ? a.plataformaOtro : a.plataforma} para ${a.empresa}`); }
    catch (e) { setAppError("No se pudo crear el acceso: " + (e && e.message ? e.message : e)); }
  }
  function patchAcceso(id, patch) {
    try { updateAccesos((accesos || []).map((a) => (a.id === id ? { ...a, ...patch } : a))); logActivity("Se actualizó un acceso"); }
    catch (e) { setAppError("No se pudo actualizar el acceso: " + (e && e.message ? e.message : e)); }
  }
  function deleteAcceso(id) {
    try {
      const a = (accesos || []).find((x) => x.id === id);
      updateAccesos((accesos || []).filter((x) => x.id !== id)); setOpenAccesoId(null);
      if (a) logActivity(`Se eliminó un acceso de ${a.empresa}`);
    } catch (e) { setAppError("No se pudo eliminar el acceso: " + (e && e.message ? e.message : e)); }
  }

  return {
    accesos, setAccesos, updateAccesos, addAcceso, patchAcceso, deleteAcceso,
    openAccesoId, setOpenAccesoId,
  };
}
