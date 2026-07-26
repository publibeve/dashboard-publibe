import { useState, useEffect } from "react";
import { loadPosts, persistPosts, POSTS_KEY } from "../services/data.service";
import { subscribeKvKey } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function usePosts(logActivity, setAppError) {
  const [posts, setPosts] = useState(null);
  const [openPostId, setOpenPostId] = useState(null);

  useEffect(() => {
    loadPosts().then((p) => setPosts(p));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeKvKey(POSTS_KEY, onChange),
    () => loadPosts().then((p) => setPosts(p))
  );

  function updatePosts(next) { setPosts(next); persistPosts(next); }
  function addPost(p) {
    try { updatePosts([...(posts || []), p]); logActivity(`Se programó una publicación (${p.empresa})`); }
    catch (e) { setAppError("No se pudo crear la publicación: " + (e && e.message ? e.message : e)); }
  }
  function patchPost(id, patch) {
    try {
      updatePosts((posts || []).map((p) => (p.id === id ? { ...p, ...patch } : p)));
      logActivity(`Se editó una publicación (${(posts || []).find((p) => p.id === id)?.empresa || ""})`);
    } catch (e) { setAppError("No se pudo actualizar la publicación: " + (e && e.message ? e.message : e)); }
  }
  function deletePost(id) {
    try {
      const p = (posts || []).find((x) => x.id === id);
      updatePosts((posts || []).map((x) => (x.id === id ? { ...x, deletedAt: new Date().toISOString() } : x)));
      setOpenPostId(null);
      if (p) logActivity(`Se envió a la papelera una publicación (${p.empresa})`);
    } catch (e) { setAppError("No se pudo eliminar la publicación: " + (e && e.message ? e.message : e)); }
  }
  function restorePost(id) {
    try {
      updatePosts((posts || []).map((x) => (x.id === id ? { ...x, deletedAt: null } : x)));
      logActivity("Se restauró una publicación desde la papelera");
    } catch (e) { setAppError("No se pudo restaurar la publicación: " + (e && e.message ? e.message : e)); }
  }
  function purgePost(id) {
    try { updatePosts((posts || []).filter((x) => x.id !== id)); }
    catch (e) { setAppError("No se pudo eliminar la publicación: " + (e && e.message ? e.message : e)); }
  }

  return {
    posts, setPosts, updatePosts, addPost, patchPost, deletePost, restorePost, purgePost,
    openPostId, setOpenPostId,
  };
}
