import { useState, useEffect } from "react";
import { loadTasks, persist } from "../services/data.service";

/**
 * Estado y operaciones CRUD sobre las tareas creativas (tablero "Flujo de diseño").
 * Recibe `logActivity` y `setAppError` (del hook useActivity / del root) para no
 * duplicar esa lógica transversal en cada hook de dominio.
 */
export function useTasks(logActivity, setAppError) {
  const [tasks, setTasks] = useState(null);
  const [openTaskId, setOpenTaskId] = useState(null);

  useEffect(() => {
    loadTasks().then((t) => setTasks(t));
  }, []);

  function updateTasks(next) { setTasks(next); persist(next); }
  function addTask(task) {
    try { updateTasks([...(tasks || []), task]); logActivity(`Se creó la tarea "${task.titulo}" (${task.empresa})`); }
    catch (e) { setAppError("No se pudo crear la tarea: " + (e && e.message ? e.message : e)); }
  }
  function patchTask(id, patch) {
    try {
      const t = (tasks || []).find((x) => x.id === id);
      updateTasks((tasks || []).map((x) => (x.id === id ? { ...x, ...patch } : x)));
      if (t) logActivity(`Se actualizó la tarea "${t.titulo}"`);
    } catch (e) { setAppError("No se pudo actualizar la tarea: " + (e && e.message ? e.message : e)); }
  }
  function deleteTask(id) {
    try {
      const t = (tasks || []).find((x) => x.id === id);
      updateTasks((tasks || []).map((x) => (x.id === id ? { ...x, deletedAt: new Date().toISOString() } : x)));
      setOpenTaskId(null);
      if (t) logActivity(`Se envió a la papelera la tarea "${t.titulo}"`);
    } catch (e) { setAppError("No se pudo eliminar la tarea: " + (e && e.message ? e.message : e)); }
  }
  function restoreTask(id) {
    try {
      updateTasks((tasks || []).map((x) => (x.id === id ? { ...x, deletedAt: null } : x)));
      logActivity("Se restauró una tarea desde la papelera");
    } catch (e) { setAppError("No se pudo restaurar la tarea: " + (e && e.message ? e.message : e)); }
  }
  function purgeTask(id) {
    try { updateTasks((tasks || []).filter((x) => x.id !== id)); }
    catch (e) { setAppError("No se pudo eliminar la tarea: " + (e && e.message ? e.message : e)); }
  }

  return {
    tasks, setTasks, updateTasks, addTask, patchTask, deleteTask, restoreTask, purgeTask,
    openTaskId, setOpenTaskId,
  };
}
