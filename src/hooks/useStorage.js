import { readJSON, writeJSON } from "../services/storage.service";

/**
 * Hook reutilizable para leer/guardar en Supabase (o localStorage, según
 * `shared`) desde un componente, sin repetir el try/catch. Ver la nota en
 * services/storage.service.js.
 */
export function useStorage() {
  return { readJSON, writeJSON };
}
