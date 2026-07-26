import { useState, useMemo, useEffect } from "react";
import {
  loadUsers, persistUsers, loadCurrentUserId, persistCurrentUserId,
} from "../services/auth.service";

export function useAuth(logActivity, setAppError) {
  const [users, setUsers] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(undefined); // undefined = todavía cargando la sesión
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [loginOverlayExiting, setLoginOverlayExiting] = useState(false);

  useEffect(() => {
    loadUsers().then((list) => setUsers(list));
    loadCurrentUserId().then((id) => setCurrentUserId(id));
  }, []);

  const currentUser = useMemo(
    () => (users || []).find((u) => u.id === currentUserId) || null,
    [users, currentUserId]
  );

  function loginAs(userId) {
    setCurrentUserId(userId);
    persistCurrentUserId(userId);
    // El dashboard de abajo se monta de inmediato (con su propio fundido de entrada); encima se
    // deja esta capa con el login, que se va desvaneciendo. Al superponerse en vez de ir en
    // secuencia, nunca hay un instante de por medio donde no haya nada pintado en pantalla.
    setShowLoginOverlay(true);
    setLoginOverlayExiting(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setLoginOverlayExiting(true)));
    setTimeout(() => setShowLoginOverlay(false), 2200);
  }
  function logout() {
    setCurrentUserId(null);
    persistCurrentUserId(null);
  }
  function updateUsers(next) { setUsers(next); persistUsers(next); }
  function addUser(u) {
    try { updateUsers([...(users || []), u]); logActivity(`Se agregó el usuario ${u.nombre}`); }
    catch (e) { setAppError("No se pudo agregar el usuario: " + (e && e.message ? e.message : e)); }
  }
  function patchUser(id, patch) {
    try { updateUsers((users || []).map((u) => (u.id === id ? { ...u, ...patch } : u))); }
    catch (e) { setAppError("No se pudo actualizar el usuario: " + (e && e.message ? e.message : e)); }
  }
  function deleteUser(id) {
    try {
      const u = (users || []).find((x) => x.id === id);
      updateUsers((users || []).filter((x) => x.id !== id));
      if (u) logActivity(`Se eliminó el usuario ${u.nombre}`);
    } catch (e) { setAppError("No se pudo eliminar el usuario: " + (e && e.message ? e.message : e)); }
  }

  return {
    users, setUsers, currentUserId, setCurrentUserId, currentUser,
    showLoginOverlay, loginOverlayExiting,
    loginAs, logout, updateUsers, addUser, patchUser, deleteUser,
  };
}
