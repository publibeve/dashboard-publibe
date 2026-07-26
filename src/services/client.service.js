import { supabase, syncTable } from "./supabaseClient";

export async function loadCustomClients() {
  try {
    const { data, error } = await supabase.from("clients").select("name, color, iconKey");
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
