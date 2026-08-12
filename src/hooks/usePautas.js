import { useState, useEffect } from "react";
import { loadPautas } from "../services/data.service";
import { subscribeTable, insertObjectRow, updateObjectRow, deleteObjectRow } from "../services/supabaseClient";
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

  /**
   * A propósito, NINGUNA de estas tres funciones lee el array completo de
   * `pautas` para reescribirlo entero en Supabase (eso es lo que hacía
   * updatePautas/persistPautas antes). Cada una hace UNA operación puntual
   * sobre SU fila — así una instantánea vieja de React nunca puede terminar
   * pisando o borrando la pauta de otro cliente por accidente. El estado
   * local sigue siendo optimista (se ve al toque), solo cambió CÓMO se
   * persiste.
   */
  function addPauta(p) {
    setPautas((prev) => [...(prev || []), p]);
    insertObjectRow("pautas", p)
      .then(() => logActivity(`Se creó la pauta "${p.etiqueta}"`))
      .catch((e) => {
        setPautas((prev) => (prev || []).filter((x) => x.id !== p.id)); // la escritura real falló — no dejar la pantalla mostrando algo que no se guardó
        setAppError("No se pudo crear la pauta: " + (e && e.message ? e.message : e));
      });
  }

  function patchPauta(id, patch) {
    let previous = null;
    let full = null;
    setPautas((prev) => {
      previous = prev;
      full = (prev || []).map((p) => (p.id === id ? { ...p, ...patch } : p)).find((p) => p.id === id);
      return (prev || []).map((p) => (p.id === id ? { ...p, ...patch } : p));
    });
    if (!full) return;
    updateObjectRow("pautas", id, full).catch((e) => {
      setPautas(previous); // revierte al valor de antes del patch — la escritura real falló
      setAppError("No se pudo actualizar la pauta: " + (e && e.message ? e.message : e));
    });
  }

  function deletePauta(id) {
    let previous = null;
    let deleted = null;
    setPautas((prev) => {
      previous = prev;
      deleted = (prev || []).find((p) => p.id === id);
      return (prev || []).filter((p) => p.id !== id);
    });
    deleteObjectRow("pautas", id)
      .then(() => { if (deleted) logActivity(`Se eliminó la pauta "${deleted.etiqueta}"`); })
      .catch((e) => {
        setPautas(previous);
        setAppError("No se pudo eliminar la pauta: " + (e && e.message ? e.message : e));
      });
  }

  /**
   * Reordenar (arrastre) — recibe la lista YA reordenada de UN cliente
   * (filtrada), le asigna `orden` según su posición nueva, y persiste SOLO
   * las filas cuyo `orden` cambió, una por una — nunca el array completo.
   * Las pautas de otros clientes no se tocan en absoluto (ni siquiera se
   * leen para esto).
   */
  function reorderPautas(reorderedClientPautas) {
    const cambios = [];
    setPautas((prev) => {
      const next = (prev || []).map((p) => {
        const idx = reorderedClientPautas.findIndex((r) => r.id === p.id);
        if (idx === -1 || p.orden === idx) return p;
        cambios.push({ ...p, orden: idx });
        return { ...p, orden: idx };
      });
      return next;
    });
    cambios.forEach((p) => {
      updateObjectRow("pautas", p.id, p).catch((e) => {
        setAppError("No se pudo guardar el nuevo orden de \"" + p.etiqueta + "\": " + (e && e.message ? e.message : e));
      });
    });
  }

  return { pautas, setPautas, addPauta, patchPauta, deletePauta, reorderPautas };
}
