import { supabase, syncTable, waitForSession } from "./supabaseClient";

export async function loadCustomClients() {
  // `clients` está cerrada a "solo autenticados" (RLS) — misma razón que en
  // supabaseClient.js/storage.service.js: esto se llama en el primer montaje
  // de la app, antes de que exista sesión.
  await waitForSession();
  try {
    const { data, error } = await supabase.from("clients").select("name, color, iconKey, logoSvg, baseKey");
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("No se pudieron leer los clientes agregados de Supabase:", e);
    return [];
  }
}

export async function persistCustomClients(list) {
  await syncTable("clients", list, "name");
}
