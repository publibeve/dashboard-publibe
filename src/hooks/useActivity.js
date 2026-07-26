import { useState, useEffect } from "react";
import { loadActivity, persistActivity, loadCommentReads, persistCommentReads } from "../services/data.service";
import { uid } from "../utils/helpers";

/**
 * Historial de actividad ("¿quién hizo qué?") y el registro de qué comentarios
 * de tareas ya vio cada usuario. Es transversal: prácticamente todos los demás
 * hooks de dominio llaman a `logActivity` para dejar constancia de sus cambios.
 */
export function useActivity(currentUser) {
  const [activity, setActivity] = useState([]);
  const [commentReads, setCommentReads] = useState({});

  useEffect(() => {
    loadActivity().then((a) => setActivity(a));
    loadCommentReads().then((r) => setCommentReads(r));
  }, []);

  function logActivity(text) {
    setActivity((a) => {
      const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1000; // ~45 días de historial
      const next = [{ id: uid(), text, time: new Date().toISOString() }, ...a]
        .filter((entry) => new Date(entry.time).getTime() >= cutoff)
        .slice(0, 500);
      persistActivity(next);
      return next;
    });
  }
  function clearActivity() {
    setActivity([]);
    persistActivity([]);
  }
  function markTaskSeen(taskId) {
    if (!currentUser) return;
    setCommentReads((prev) => {
      const next = { ...prev, [currentUser.id]: { ...(prev[currentUser.id] || {}), [taskId]: new Date().toISOString() } };
      persistCommentReads(next);
      return next;
    });
  }

  return { activity, setActivity, logActivity, clearActivity, commentReads, setCommentReads, markTaskSeen };
}
