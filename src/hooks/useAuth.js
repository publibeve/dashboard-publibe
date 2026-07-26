import { useState, useMemo, useEffect, useRef } from "react";
import {
  loadUsers, persistUsers, loadCurrentUserId, persistCurrentUserId, CURRENT_USER_KEY,
} from "../services/auth.service";
import { subscribeTable } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function useAuth(logActivity, setAppError) {
  const [users, setUsers] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(undefined); // undefined = todavía cargando la sesión
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [loginOverlayExiting, setLoginOverlayExiting] = useState(false);

  useEffect(() => {
    loadUsers().then((list) => setUsers(list));
    loadCurrentUserId().then((id) => setCurrentUserId(id));
  }, []);

  // Si se agrega/edita/elimina un usuario desde otra pestaña o desde otra
  // computadora del equipo, esta pestaña lo refleja sola (por ejemplo, si te
  // quitan un permiso en Administrativo mientras estás usando la app en otra
  // pestaña, deja de poder hacer esa acción sin necesidad de refrescar).
  useRealtimeReload(
    (onChange) => subscribeTable("users", onChange),
    () => loadUsers().then((list) => setUsers(list))
  );

  // La sesión es local del dispositivo (localStorage), pero si el navegador
  // tiene varias pestañas abiertas, iniciar/cerrar sesión en una debe
  // reflejarse en las demás — si no, una pestaña podría quedar "atrás" con un
  // usuario que ya cerró sesión en otra.
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== CURRENT_USER_KEY) return;
      setCurrentUserId(e.newValue ? JSON.parse(e.newValue) : null);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const currentUser = useMemo(
    () => (users || []).find((u) => u.id === currentUserId) || null,
    [users, currentUserId]
  );

  // Si hay una sesión (currentUserId) pero esa persona no aparece en la lista
  // de usuarios YA CARGADA, puede ser que esa lista esté un poco desactualizada
  // en ESTA pestaña (por ejemplo, si el usuario acaba de iniciar sesión en
  // OTRA pestaña/computadora recién y a esta todavía no le llegó el cambio) —
  // en vez de mandar directo a la pantalla de login (que se sentía como "se
  // cerró la sesión sola"), se vuelve a pedir la lista una vez antes de darlo
  // por perdido de verdad.
  const retriedForRef = useRef(null);
  useEffect(() => {
    if (currentUserId && users && !users.some((u) => u.id === currentUserId)) {
      if (retriedForRef.current === currentUserId) return; // ya se reintentó para este id, no insistir para siempre
      retriedForRef.current = currentUserId;
      loadUsers().then((list) => setUsers(list));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, users]);

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
