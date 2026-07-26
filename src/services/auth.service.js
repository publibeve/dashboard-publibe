import { PERMISOS_NINGUNO, PERMISOS_TODOS } from "../utils/constants";
import { uid } from "../utils/helpers";
import { supabase } from "./supabaseClient";

// La sesión (qué usuario está logueado en ESTE dispositivo) sigue siendo local,
// tal como en el original (shared:false) — no tiene sentido guardarla en la DB
// compartida, cada dispositivo mantiene la suya.
const CURRENT_USER_KEY = "publibe:current-user-id";

export function demoUsers() {
  return [
    { id: uid(), nombre: "Diego Toro", clave: "198913", permisos: { ...PERMISOS_TODOS } },
    { id: uid(), nombre: "Ariana Martínez", clave: "000000", permisos: { ...PERMISOS_NINGUNO } },
  ];
}

export async function loadUsers() {
  try {
    const { data, error } = await supabase.from("users").select("*").order("nombre");
    if (error) throw error;
    if (data && data.length) return data;
  } catch (e) {
    console.error("No se pudieron leer los usuarios de Supabase:", e);
  }
  // Tabla vacía (primer arranque) -> sembramos los usuarios de ejemplo.
  const seeded = demoUsers();
  await persistUsers(seeded);
  return seeded;
}

export async function persistUsers(list) {
  // El código que llama a esto siempre manda el arreglo COMPLETO (igual que antes
  // con window.storage.set, que sobreescribía el blob entero) — así que además
  // de guardar/actualizar cada fila, hay que borrar las que ya no estén en la lista
  // (por ejemplo cuando se elimina un usuario desde Administrativo).
  try {
    const ids = list.map((u) => u.id);
    const { error: upsertError } = await supabase.from("users").upsert(list, { onConflict: "id" });
    if (upsertError) throw upsertError;
    if (ids.length) {
      const { error: deleteError } = await supabase.from("users").delete().not("id", "in", `(${ids.join(",")})`);
      if (deleteError) throw deleteError;
    }
  } catch (e) {
    console.error("No se pudieron guardar los usuarios en Supabase:", e);
  }
}

export async function loadCurrentUserId() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function persistCurrentUserId(id) {
  try {
    if (id) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(id));
    else localStorage.removeItem(CURRENT_USER_KEY);
  } catch (e) {
    console.error("No se pudo guardar la sesión", e);
  }
}
