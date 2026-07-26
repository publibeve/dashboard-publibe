import { useState, useEffect, useRef } from "react";
import { CLIENTES } from "../utils/constants";
import { iconFor } from "../utils/helpers";
import { loadCustomClients, persistCustomClients } from "../services/client.service";
import { subscribeTable } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

/**
 * `CLIENTES` es un arreglo mutable a nivel de módulo (igual que en el archivo
 * original): se reasigna con `CLIENTES = [...]` y `clientsBump` fuerza el re-render
 * de los componentes que lo leen, ya que React no detecta la mutación de una
 * variable externa al estado por sí solo.
 *
 * `deps` trae, desde App.jsx, los `updateX` de cada dominio (tareas, pagos,
 * publicaciones, notas, deudas, facturas, accesos) para poder purgar toda la
 * información de un cliente eliminado, y el estado de cliente seleccionado.
 */
export function useClients(deps) {
  const {
    tasks, payments, posts, notes, debts, invoices, accesos,
    updateTasks, updatePayments, updatePosts, updateNotes, updateDebts, updateInvoices, updateAccesos,
    selectedClient, setSelectedClient, logActivity, setAppError,
  } = deps;

  const [clientsBump, setClientsBump] = useState(0);
  // Los clientes predefinidos (los de utils/constants.js), capturados una sola
  // vez ANTES de que se les mezclen los agregados/editados por el usuario. Es
  // la base contra la que se reconcilia cada vez que llega la lista fresca de
  // Supabase (altas, ediciones Y bajas de clientes agregados), en vez de ir
  // acumulando sobre un CLIENTES que ya viene mutado de la vez anterior.
  const baseClientesRef = useRef(null);
  if (baseClientesRef.current === null) baseClientesRef.current = CLIENTES.map((c) => ({ ...c }));

  function reconcile(customList) {
    const base = baseClientesRef.current;
    const existingNames = new Set(base.map((c) => c.name));
    const overridesByName = new Map(customList.filter((c) => existingNames.has(c.name)).map((c) => [c.name, c]));
    const extra = customList.filter((c) => !existingNames.has(c.name)).map((c) => ({ ...c, icon: iconFor(c.iconKey) }));
    const merged = [
      ...base.map((c) => (overridesByName.has(c.name)
        ? { ...c, color: overridesByName.get(c.name).color, iconKey: overridesByName.get(c.name).iconKey, icon: iconFor(overridesByName.get(c.name).iconKey) }
        : c)),
      ...extra,
    ];
    CLIENTES.splice(0, CLIENTES.length, ...merged);
    setClientsBump((x) => x + 1);
  }

  useEffect(() => {
    loadCustomClients().then((list) => reconcile(list));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronización entre pestañas/dispositivos: si alguien agrega, edita o
  // elimina un cliente desde otra pestaña, esta lo refleja sola.
  useRealtimeReload(
    (onChange) => subscribeTable("clients", onChange),
    () => loadCustomClients().then((list) => reconcile(list))
  );

  function addClient(c) {
    try {
      const entry = { name: c.name, color: c.color, iconKey: c.iconKey, icon: iconFor(c.iconKey) };
      CLIENTES.splice(0, CLIENTES.length, ...CLIENTES, entry);
      loadCustomClients().then((list) => persistCustomClients([...list, { name: entry.name, color: entry.color, iconKey: entry.iconKey }]));
      setClientsBump((x) => x + 1);
      setSelectedClient(entry.name);
      logActivity(`Se agregó el cliente ${entry.name}`);
    } catch (e) {
      setAppError("No se pudo agregar el cliente: " + (e && e.message ? e.message : e));
    }
  }

  function editClient(name, patch) {
    try {
      const updatedList = CLIENTES.map((c) => (c.name === name ? { ...c, ...patch, icon: patch.iconKey ? iconFor(patch.iconKey) : c.icon } : c));
      CLIENTES.splice(0, CLIENTES.length, ...updatedList);
      const updated = CLIENTES.find((c) => c.name === name);
      loadCustomClients().then((list) => {
        const rest = list.filter((c) => c.name !== name);
        persistCustomClients([...rest, { name: updated.name, color: updated.color, iconKey: updated.iconKey }]);
      });
      setClientsBump((x) => x + 1);
      logActivity(`Se actualizó la apariencia de ${name}`);
    } catch (e) {
      setAppError("No se pudo actualizar el cliente: " + (e && e.message ? e.message : e));
    }
  }

  function deleteClientCompletely(name) {
    try {
      const remaining = CLIENTES.filter((c) => c.name !== name);
      CLIENTES.splice(0, CLIENTES.length, ...remaining);
      loadCustomClients().then((list) => persistCustomClients(list.filter((c) => c.name !== name)));
      setClientsBump((x) => x + 1);

      updateTasks((tasks || []).filter((t) => t.empresa !== name));
      updatePayments((payments || []).filter((p) => p.empresa !== name));
      updatePosts((posts || []).filter((p) => p.empresa !== name));
      updateNotes((notes || []).filter((n) => n.empresa !== name));
      updateDebts((debts || []).filter((d) => d.empresa !== name));
      updateInvoices((invoices || []).filter((i) => i.empresa !== name));
      updateAccesos((accesos || []).filter((a) => a.empresa !== name));

      if (selectedClient === name) setSelectedClient("__ALL__");
      logActivity(`Se eliminó el cliente ${name} y toda su información`);
    } catch (e) {
      setAppError("No se pudo eliminar el cliente: " + (e && e.message ? e.message : e));
    }
  }

  return { clientsBump, setClientsBump, addClient, editClient, deleteClientCompletely };
}
