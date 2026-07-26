import { PERMISOS_NINGUNO, PERMISOS_TODOS } from "../utils/constants";
import { uid } from "../utils/helpers";
import { supabase } from "./supabaseClient";
import { readJSON, writeJSON } from "./storage.service";

const USERS_SEEDED_KEY = "publibe-seeded-users";

/**
 * Perfiles de ejemplo (nombre/email/permisos/foto) para cuando la tabla
 * `users` está vacía. Ya NO incluyen `clave`: la contraseña de cada quien
 * vive en Supabase Auth, no en esta tabla. Crear a estas dos personas en
 * Supabase Authentication es un paso manual — ver DEPLOY.md.
 */
export function demoUsers() {
  return [
    { id: uid(), nombre: "Diego Toro", email: "ceo@publibe.net", permisos: { ...PERMISOS_TODOS } },
    { id: uid(), nombre: "Ariana Martínez", email: "designer@publibe.net", permisos: { ...PERMISOS_NINGUNO } },
  ];
}

/**
 * Perfil completo (con permisos) de todas las personas — requiere sesión
 * iniciada: la tabla `users` quedó cerrada a "solo autenticados" en RLS.
 */
export async function loadUsers() {
  try {
    const { data, error } = await supabase.from("users").select("*").order("nombre");
    if (error) throw error;
    // Misma protección contra condición de carrera que ya teníamos: la
    // decisión de "sembrar usuarios de ejemplo" no se toma por "0 filas en
    // este instante" (dos pestañas leyendo casi a la vez podrían sembrar cada
    // una su propia tanda y pisarse), sino por una bandera aparte.
    if (data && data.length) return data;
    if (await readJSON(USERS_SEEDED_KEY, true, false)) return data || [];
  } catch (e) {
    console.error("No se pudieron leer los usuarios de Supabase:", e);
  }
  const seeded = demoUsers();
  try {
    const { error } = await supabase.from("users").insert(seeded);
    if (error) throw error;
    await writeJSON(USERS_SEEDED_KEY, true, true);
    return seeded;
  } catch (e) {
    console.error("Insert de usuarios FALLÓ:", e?.code, e?.message, e?.details, e?.hint, e);
    return seeded;
  }
}

export async function persistUsers(list) {
  try {
    // Defensivo: si algún llamador viejo todavía manda `clave` (columna que
    // ya no existe en la tabla), se descarta acá para no romper el upsert.
    const clean = list.map(({ clave, ...rest }) => rest);
    const ids = clean.map((u) => u.id);
    const { error: upsertError } = await supabase.from("users").upsert(clean, { onConflict: "id" });
    if (upsertError) throw upsertError;
    if (ids.length) {
      const { error: deleteError } = await supabase.from("users").delete().not("id", "in", `(${ids.join(",")})`);
      if (deleteError) throw deleteError;
    }
  } catch (e) {
    console.error("No se pudieron guardar los usuarios en Supabase:", e);
  }
}

/* ---------------- Sesión real (Supabase Auth) ----------------------------- */

/**
 * Traduce los errores de Supabase Auth a mensajes que no revelan si el correo
 * existe o no (buena práctica: no darle a quien intenta entrar una pista de
 * qué parte falló).
 */
function mapAuthError(error) {
  const msg = String(error?.message || "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "Clave incorrecta.";
  if (msg.includes("email not confirmed")) return "Esta cuenta todavía no está confirmada en Supabase Authentication.";
  return "No se pudo iniciar sesión: " + (error?.message || "error desconocido.");
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: mapAuthError(error) };
  return { ok: true };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

/** cb(session|null) — se llama en cada cambio (login, logout, refresh de token). */
export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session || null));
  return () => data.subscription.unsubscribe();
}
