import { useState, useMemo, useEffect } from "react";
import {
  loadDirectory, loadUsers, persistUsers, signIn, signOut, getSession, onAuthChange,
} from "../services/auth.service";
import { subscribeTable } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function useAuth(logActivity, setAppError) {
  // Directorio público (nombre/email/foto) para el selector de la pantalla de
  // login — se puede leer SIN sesión iniciada (ver public_directory en
  // supabase/auth-migration.sql). null mientras carga por primera vez.
  const [directory, setDirectory] = useState(null);

  // Sesión de Supabase Auth. undefined = todavía resolviendo la sesión guardada
  // del navegador; null = no hay sesión; objeto = sesión activa.
  const [session, setSession] = useState(undefined);

  // Perfil completo (con permisos) de todas las personas — requiere sesión,
  // así que solo se carga una vez que `session` deja de ser null/undefined.
  const [users, setUsers] = useState(null);

  const [authErrorMsg, setAuthErrorMsg] = useState("");
  const [pendingEmail, setPendingEmail] = useState(null); // para la animación de salida del login
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [loginOverlayExiting, setLoginOverlayExiting] = useState(false);

  useEffect(() => {
    loadDirectory().then(setDirectory);
  }, []);

  useEffect(() => {
    getSession().then(setSession);
    // onAuthChange cubre login, logout Y sincronización entre pestañas: la
    // sesión de Supabase Auth ya se comparte sola entre pestañas del mismo
    // navegador (vía su propio localStorage + BroadcastChannel), así que ya
    // no hace falta el listener manual de "storage" que usábamos con el PIN.
    return onAuthChange(setSession);
  }, []);

  useEffect(() => {
    if (session) loadUsers().then(setUsers);
    else setUsers(null);
  }, [session]);

  // Si se agrega/edita/elimina un usuario desde otra pestaña o desde otra
  // computadora del equipo, esta pestaña lo refleja sola (por ejemplo, si te
  // quitan un permiso en Administrativo mientras estás usando la app en otra
  // pestaña, deja de poder hacer esa acción sin necesidad de refrescar).
  useRealtimeReload(
    (onChange) => subscribeTable("users", onChange),
    () => { if (session) loadUsers().then(setUsers); }
  );

  const currentUser = useMemo(() => {
    if (!session || !users) return null;
    return users.find((u) => u.email === session.user.email) || null;
  }, [session, users]);
  const currentUserId = currentUser?.id || null;

  // undefined = todavía resolviendo (sesión inicial o, si hay sesión, el
  // perfil correspondiente); una vez resuelto, true/false.
  const authLoading = session === undefined || directory === null || (!!session && users === null);

  async function login(email, password) {
    setAuthErrorMsg("");
    const result = await signIn(email, password);
    if (!result.ok) { setAuthErrorMsg(result.message); return false; }
    // El nombre/foto para la animación de salida se toman del directorio
    // (ya cargado, no requiere esperar el perfil completo con permisos).
    setPendingEmail(email);
    setShowLoginOverlay(true);
    setLoginOverlayExiting(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setLoginOverlayExiting(true)));
    setTimeout(() => setShowLoginOverlay(false), 2200);
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
    directory, users, currentUserId, currentUser, authLoading,
    authErrorMsg, pendingEmail,
    showLoginOverlay, loginOverlayExiting,
    login, logout, updateUsers, addUser, patchUser, deleteUser,
  };
}
