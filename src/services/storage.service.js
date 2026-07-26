import { supabase } from "./supabaseClient";

/**
 * Reemplazo de `window.storage` (API exclusiva del entorno de Artifacts de
 * Claude, no existe fuera de claude.ai) por Supabase + localStorage, con el
 * mismo contrato que ya usaba el resto de la app:
 *
 *   - shared = true  -> el valor es compartido por todo el equipo (se guarda
 *                        en la tabla `kv_store` de Supabase).
 *   - shared = false -> el valor es propio de este dispositivo/navegador
 *                        (ej: sesión actual, historial de chat IA local) y
 *                        se guarda en localStorage, tal como debía comportarse
 *                        originalmente.
 *
 * Gracias a este contrato, `services/data.service.js`, `auth.service.js` y
 * `ai.service.js` casi no necesitaron cambios: solo se reemplazó
 * `window.storage.get/set/delete` por `readJSON/writeJSON/deleteKey`.
 */

const LOCAL_PREFIX = "publibe:";

export async function readJSON(key, shared = false, fallback = null) {
  if (!shared) {
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error(`No se pudo leer "${key}" de localStorage:`, e);
      return fallback;
    }
  }
  try {
    const { data, error } = await supabase
      .from("kv_store")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data ? data.value : fallback;
  } catch (e) {
    console.error(`No se pudo leer "${key}" de Supabase (kv_store):`, e);
    return fallback;
  }
}

export async function writeJSON(key, value, shared = false) {
  if (!shared) {
    try {
      localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`No se pudo guardar "${key}" en localStorage:`, e);
      return false;
    }
  }
  try {
    const { error } = await supabase
      .from("kv_store")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error(`No se pudo guardar "${key}" en Supabase (kv_store):`, e);
    return false;
  }
}

export async function deleteKey(key, shared = false) {
  if (!shared) {
    try { localStorage.removeItem(LOCAL_PREFIX + key); return true; }
    catch (e) { console.error(`No se pudo borrar "${key}" de localStorage:`, e); return false; }
  }
  try {
    const { error } = await supabase.from("kv_store").delete().eq("key", key);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error(`No se pudo borrar "${key}" de Supabase (kv_store):`, e);
    return false;
  }
}
