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
  // true SOLO durante un login interactivo en esta pestaña (entre el clic en
  // "Entrar" y el fundido hacia el dashboard). Existe para tapar un hueco
  // real: apenas signInWithPassword tiene éxito, Supabase dispara el evento
  // de sesión y `session` se setea ANTES de que `loadUsers()` termine — en
  // ese instante (sesión sí, perfil todavía no) `authLoading` daba true y
  // App mostraba el div vacío de carga: ESE era el flash blanco que se veía
  // al iniciar sesión. Mientras loggingIn=true, la pantalla de login (con su
  // spinner) se queda montada hasta que todo esté listo de verdad.
  const [loggingIn, setLoggingIn] = useState(false);
  // El correo tal cual se escribió, para que la réplica congelada del login
  // (LoginExitOverlay) muestre EXACTAMENTE lo mismo que la pantalla real en
  // el momento del traspaso — si el campo apareciera vacío de golpe, el ojo
  // lo registra como un salto. Se limpia recién cuando el fundido terminó.
  const [pendingEmail, setPendingEmail] = useState("");
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

  const authLoading = session === undefined || (!!session && users === null && !loggingIn);

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
    setLoggingIn(true);
    setPendingEmail(email);
    try {
      const result = await signIn(email, password);
      if (!result.ok) { setAuthErrorMsg(result.message); return false; }
      await waitForSession();
      const list = await loadUsers();
      // Orden importante (esto es lo que arregla el parpadeo blanco que solo
      // se notaba en desktop): antes, `setUsers` (que dispara el montaje de
      // TODO el dashboard) y `setShowLoginOverlay` iban en el mismo cuadro.
      // En una ventana angosta (o el emulador de celular) el dashboard tiene
      // mucha menos superficie visible que dibujar y ese montaje es casi
      // instantáneo; en una ventana ancha de escritorio, el navegador tiene
      // que calcular estilos y layout de MUCHA más pantalla de una sola vez,
      // y ese trabajo podía tardar lo suficiente como para retrasar la
      // primera pintura del cuadro — durante ese instante se veía blanco,
      // como si el login "reapareciera" después.
      // El fix: mostrar primero el overlay (unos pocos <div>, siempre barato
      // de pintar sea cual sea el tamaño de pantalla) y ESPERAR a que el
      // navegador realmente lo pinte (doble RAF) antes de recién ahí montar
      // el dashboard pesado por debajo — que gracias a esto queda tapado
      // desde su primer instante, sin importar cuánto tarde en construirse.
      setShowLoginOverlay(true);
      setLoginOverlayExiting(false);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      setUsers(list);
      requestAnimationFrame(() => requestAnimationFrame(() => setLoginOverlayExiting(true)));
      // 950ms = apenas más que la transición de desenfoque de salida en CSS
      // (0.9s, ver .login-transition-overlay en index.css) — es el tiempo del
      // fundido, no una simulación de carga: la carga real ya terminó acá.
      setTimeout(() => { setShowLoginOverlay(false); setPendingEmail(""); }, 950);
      return true;
    } finally {
      setLoggingIn(false);
    }
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
    users, currentUserId, currentUser, authLoading, authErrorMsg, pendingEmail,
    showLoginOverlay, loginOverlayExiting,
    login, logout, updateUsers, addUser, patchUser, deleteUser,
  };
}
