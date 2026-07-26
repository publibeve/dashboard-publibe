import { useState, useEffect } from "react";
import { loadNotes, persistNotes } from "../services/data.service";

export function useNotes(logActivity, setAppError) {
  const [notes, setNotes] = useState(null);

  useEffect(() => {
    loadNotes().then((n) => setNotes(n));
  }, []);

  function updateNotes(next) { setNotes(next); persistNotes(next); }
  function addNote(n) {
    try { updateNotes([...(notes || []), n]); logActivity(`Se creó la nota "${n.titulo || "(sin título)"}"`); }
    catch (e) { setAppError("No se pudo crear la nota: " + (e && e.message ? e.message : e)); }
  }
  function patchNote(id, patch) {
    try { updateNotes((notes || []).map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n))); }
    catch (e) { setAppError("No se pudo actualizar la nota: " + (e && e.message ? e.message : e)); }
  }
  function trashNote(id) {
    try {
      const n = (notes || []).find((x) => x.id === id);
      updateNotes((notes || []).map((x) => (x.id === id ? { ...x, deletedAt: new Date().toISOString() } : x)));
      if (n) logActivity(`Se envió a la papelera la nota "${n.titulo || "(sin título)"}"`);
    } catch (e) { setAppError("No se pudo mover la nota a la papelera: " + (e && e.message ? e.message : e)); }
  }
  function restoreNote(id) {
    try {
      const n = (notes || []).find((x) => x.id === id);
      updateNotes((notes || []).map((x) => (x.id === id ? { ...x, deletedAt: null } : x)));
      if (n) logActivity(`Se restauró la nota "${n.titulo || "(sin título)"}"`);
    } catch (e) { setAppError("No se pudo restaurar la nota: " + (e && e.message ? e.message : e)); }
  }
  function purgeNote(id) {
    try {
      const n = (notes || []).find((x) => x.id === id);
      updateNotes((notes || []).filter((x) => x.id !== id));
      if (n) logActivity(`Se eliminó definitivamente la nota "${n.titulo || "(sin título)"}"`);
    } catch (e) { setAppError("No se pudo eliminar la nota: " + (e && e.message ? e.message : e)); }
  }

  return { notes, setNotes, updateNotes, addNote, patchNote, trashNote, restoreNote, purgeNote };
}
