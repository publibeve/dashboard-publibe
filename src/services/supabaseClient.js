import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // No tiramos el error en el import (rompería el build/preview antes de tiempo);
  // lo dejamos loguearse claro en consola para que sea fácil de diagnosticar.
  console.error(
    "Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
    "Revisá tu archivo .env.local (en desarrollo) o las variables de entorno del sitio en Netlify (en producción)."
  );
}

export const supabase = createClient(url, anonKey);

/**
 * Los hooks de dominio (useTasks, useNotes, usePayments, etc.) siguen el mismo
 * patrón que tenían con window.storage: `updateX(next)` guarda el arreglo
 * COMPLETO cada vez, no solo la fila que cambió. Esta función replica ese
 * comportamiento de "reemplazo total" contra una tabla real de Supabase:
 * hace upsert de las filas presentes y borra las que ya no estén en la lista.
 *
 * Se usa desde services/data.service.js, auth.service.js y client.service.js
 * para las tablas reales (users, clients, tasks, notes, payments, invoices).
 */
export async function syncTable(table, list, idField = "id") {
  try {
    const ids = (list || []).map((row) => row[idField]).filter(Boolean);
    if (list && list.length) {
      const { error: upsertError } = await supabase.from(table).upsert(list, { onConflict: idField });
      if (upsertError) throw upsertError;
    }
    if (ids.length) {
      const { error: deleteError } = await supabase.from(table).delete().not(idField, "in", `(${ids.join(",")})`);
      if (deleteError) throw deleteError;
    } else {
      // Lista vacía -> se borró todo.
      const { error: deleteAllError } = await supabase.from(table).delete().neq(idField, "___none___");
      if (deleteAllError) throw deleteAllError;
    }
  } catch (e) {
    console.error(`No se pudo sincronizar la tabla "${table}" en Supabase:`, e);
  }
}

/**
 * Para los dominios que son listas de objetos con forma variable (tareas, notas,
 * pagos, publicaciones, facturas, etc.) se usa una tabla con 3 columnas reales:
 *   id (text, PK), empresa (text, para poder filtrar/indexar por cliente), y
 *   data (jsonb) con el objeto completo tal cual lo usa el resto de la app.
 * Esto evita tener que mapear a mano cada uno de los ~15-30 campos de cada
 * objeto a una columna propia (con el riesgo de typos/mayúsculas que eso trae)
 * sin perder la posibilidad de filtrar por empresa o consultar desde SQL.
 *
 * Si preferís columnas 1:1 más adelante, esto se puede migrar tabla por tabla
 * sin tocar los hooks (loadX/persistX son la única frontera que les importa).
 */
export async function loadObjectsTable(table) {
  const { data, error } = await supabase.from(table).select("id, empresa, data");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row.data, id: row.id, empresa: row.empresa }));
}

export async function syncObjectsTable(table, list) {
  const rows = (list || []).map((obj) => ({ id: obj.id, empresa: obj.empresa ?? null, data: obj }));
  await syncTable(table, rows, "id");
}
