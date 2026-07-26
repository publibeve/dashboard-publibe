import { PERMISOS_NINGUNO, PERMISOS_TODOS } from "../utils/constants";
import { uid } from "../utils/helpers";
import { supabase } from "./supabaseClient";
import { readJSON, writeJSON } from "./storage.service";

// La sesión (qué usuario está logueado en ESTE dispositivo) sigue siendo local,
// tal como en el original (shared:false) — no tiene sentido guardarla en la DB
// compartida, cada dispositivo mantiene la suya.
export const CURRENT_USER_KEY = "publibe:current-user-id";

const USERS_SEEDED_KEY = "publibe-seeded-users";

export function demoUsers() {
  return [
    { id: uid(), nombre: "Diego Toro", email: "diego@publibe.net", clave: "198913", permisos: { ...PERMISOS_TODOS } },
    { id: uid(), nombre: "Ariana Martínez", email: "ariana@publibe.net", clave: "000000", permisos: { ...PERMISOS_NINGUNO } },
  ];
}

export async function loadUsers() {
  try {
    const { data, error } = await supabase.from("users").select("*").order("nombre");
    if (error) throw error;
    // IMPORTANTE: la decisión de "sembrar usuarios de ejemplo" NO se toma según
    // si la consulta trajo 0 filas en este instante. Con varias pestañas
    // abiertas (y ahora, con la sincronización en tiempo real, `loadUsers` se
    // puede llamar mucho más seguido que antes) eso es una condición de
    // carrera real: si dos pestañas leen "0 filas" casi a la vez, cada una
    // sembraba SU PROPIA tanda de usuarios con ids nuevos, y como el guardado
    // borra cualquier fila que no esté en la lista que se está guardando, la
    // segunda siembra eliminaba a los usuarios reales (incluido el que ya
    // había iniciado sesión en otra pestaña) — eso es lo que se veía como
    // "la otra pestaña se cierra". Por eso se usa una bandera aparte,
    // guardada una sola vez, en vez de confiar en el conteo de filas.
    if (data && data.length) return data;
    if (await readJSON(USERS_SEEDED_KEY, true, false)) return data || [];
  } catch (e) {
    console.error("No se pudieron leer los usuarios de Supabase:", e);
  }
  // Primera vez de verdad (nunca se sembró): se inserta directo, SIN pasar por
  // persistUsers (que borra lo que no esté en la lista) — así, aunque dos
  // pestañas caigan acá al mismo tiempo, en el peor de los casos quedan
  // usuarios de ejemplo duplicados, nunca se borra nada que ya existiera.
  const seeded = demoUsers();
  try {
    console.log("Intentando sembrar usuarios:", JSON.stringify(seeded));
    const { error } = await supabase.from("users").insert(seeded);
    if (error) throw error;
    // La bandera de "ya se sembró" SOLO se marca si el insert realmente
    // funcionó. Si se marcara siempre (como pasaba antes), un fallo de
    // inserción (por ejemplo, una columna NOT NULL que la fila no traía)
    // dejaba la bandera en true para siempre, con la tabla vacía — el
    // resultado era que nadie podía volver a iniciar sesión, ni sembrando de
    // nuevo, porque el código ya "creía" que los usuarios existían.
    await writeJSON(USERS_SEEDED_KEY, true, true);
    return seeded;
  } catch (e) {
    console.error("Insert de usuarios FALLÓ:", e?.code, e?.message, e?.details, e?.hint, e);
    // No se marca como sembrado: la próxima vez se vuelve a intentar en vez
    // de quedar con una tabla vacía y sin forma de entrar.
    return seeded;
  }
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
