import { useState, useMemo, useEffect } from "react";
import { loadUsers, persistUsers, signIn, signOut, getSession, onAuthChange } from "../services/auth.service";
import { waitForSession, subscribeTable } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function useAuth(logActivity, setAppError) {
  // Sesión de Supabase Auth. undefined = todavía resolviendo la sesión guardada
  // del navegador; null = no hay sesión; objeto = sesión activa.
  const [session, setSession] = useState(undefined);

  // Perfil completo (con permisos) de todas las personas — requiere sesión.
  const [users, setUsers] = useState(null);

  const [authErrorMsg, setAuthErrorMsg] = useState("");
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [loginOverlayExiting, setLoginOverlayExiting] = useState(false);

  useEffect(() => {
    getSession().then(setSession);
    // Cubre login, logout Y sincronización entre pestañas: la sesión de
    // Supabase Auth ya se comparte sola entre pestañas del mismo navegador
    // (vía su propio localStorage + BroadcastChannel), así que no hace falta
    // ningún listener manual.
    return onAuthChange(setSession);
  }, []);

  // Si ya había una sesión guardada (por ejemplo, se refrescó la página) el
  // perfil se carga acá. Si la sesión se inicia interactivamente en esta
  // misma pestaña, `login()` ya lo carga él mismo (ver abajo) — esta rama
  // simplemente vuelve a asignar el mismo resultado, sin efecto visible.
  useEffect(() => {
    if (session) loadUsers().then(setUsers);
    else setUsers(null);
  }, [session]);

  // Si se agrega/edita/elimina un usuario desde otra pestaña o desde otra
  // computadora del equipo, esta pestaña lo refleja sola.
  useRealtimeReload(
    (onChange) => subscribeTable("users", onChange),
    () => { if (session) loadUsers().then(setUsers); }
  );

  const currentUser = useMemo(() => {
    if (!session || !users) return null;
    return users.find((u) => u.email === session.user.email) || null;
  }, [session, users]);
  const currentUserId = currentUser?.id || null;

  const authLoading = session === undefined || (!!session && users === null);

  /**
   * Login real: correo + clave, sin selector previo. La promesa que devuelve
   * esta función solo se resuelve cuando el proceso está COMPLETO de verdad
   * (contraseña verificada + sesión activa + perfil con permisos cargado) —
   * no es un timeout adivinado. Esto es lo que le permite al botón de
   * LoginScreen mostrar "Cargando tu espacio…" durante toda la espera real,
   * ni un instante más ni menos.
   */
  async function login(email, password) {
    setAuthErrorMsg("");
    const result = await signIn(email, password);
    if (!result.ok) { setAuthErrorMsg(result.message); return false; }
    await waitForSession();
    const list = await loadUsers();
    setUsers(list);
    // Recién acá el login está listo de verdad: se dispara el fundido hacia
    // el dashboard (reusa las mismas clases/keyframes que ya existían para
    // esta transición — ver login-transition-overlay en los estilos).
    setShowLoginOverlay(true);
    setLoginOverlayExiting(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setLoginOverlayExiting(true)));
    setTimeout(() => setShowLoginOverlay(false), 320); // duración de la transición CSS, no de la carga
    return true;
  }
  async function logout() {
    await signOut();
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
    users, currentUserId, currentUser, authLoading, authErrorMsg,
    showLoginOverlay, loginOverlayExiting,
    login, logout, updateUsers, addUser, patchUser, deleteUser,
  };
}
