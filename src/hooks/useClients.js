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
 * `deps` trae, desde App.jsx, los `updateX` de CADA dominio que guarda
 * `empresa` como texto plano (no una relación real) — son 13: tareas, pagos,
 * publicaciones, notas, deudas, saldo a favor, facturas, accesos, inversión,
 * guiones, gastos, tareas generales, y pautas. Todos hacen falta para poder
 * renombrar un cliente sin dejar huérfano ningún registro suyo. Pautas es
 * la única que no tiene un `updateX` en bloque (usa escritura puntual por
 * fila) — se cascadea con `patchPauta` una vez por cada pauta afectada.
 *
 * `baseKey` — por qué existe: los 8 clientes originales (los de
 * utils/constants.js) se identifican en Supabase por su NOMBRE al
 * guardarse por primera vez ahí (matchear "¿este override le pertenece a
 * qué cliente base?" se hacía comparando nombres). Eso se rompe apenas el
 * nombre pasa a ser editable: si renombrás "ToyoReyna" a "ToyoReyna
 * Racing", al recargar el nombre guardado ya NO coincide con ningún
 * cliente base — el override queda huérfano (se trata como un cliente
 * nuevo aparte) Y el cliente base reaparece con sus valores originales,
 * como si nunca se hubiera editado. `baseKey` es un identificador que NO
 * cambia con el renombre (se fija la primera vez que un cliente base se
 * edita, y se mantiene igual en renombres posteriores) — así reconcile()
 * siempre sabe a qué cliente base le pertenece cada override, sin
 * importar cómo se llame ahora.
 */
export function useClients(deps) {
  const {
    tasks, payments, posts, notes, debts, invoices, accesos, saldosFavor, inversiones, guiones, expenses, tareasGenerales, pautas,
    updateTasks, updatePayments, updatePosts, updateNotes, updateDebts, updateInvoices, updateAccesos,
    updateSaldosFavor, updateInversiones, updateGuiones, updateExpenses, updateTareasGenerales, patchPauta,
    selectedClient, setSelectedClient, logActivity, setAppError,
  } = deps;

  const [clientsBump, setClientsBump] = useState(0);
  const baseClientesRef = useRef(null);
  if (baseClientesRef.current === null) baseClientesRef.current = CLIENTES.map((c) => ({ ...c }));

  function reconcile(customList) {
    const base = baseClientesRef.current;
    const baseNames = new Set(base.map((c) => c.name));
    // Cada override se liga a un cliente base por baseKey — o, para filas
    // guardadas ANTES de que baseKey existiera, por su propio nombre (que
    // en ese caso todavía no había sido renombrado, así que coincide).
    const overridesByBaseName = new Map();
    const extra = [];
    for (const c of customList) {
      const key = c.baseKey || c.name;
      if (baseNames.has(key)) overridesByBaseName.set(key, c);
      else extra.push(c);
    }
    const merged = [
      ...base.map((c) => {
        const ov = overridesByBaseName.get(c.name);
        // baseKey siempre es el nombre ORIGINAL de este cliente base
        // (c.name, tal como vino de constants.js) — se fija acá SIEMPRE,
        // haya override o no, para que un segundo (o tercer) renombre
        // pueda seguir encontrando la fila correcta en Supabase. Antes
        // esto se perdía apenas se reconciliaba una vez, y el siguiente
        // renombre terminaba creando una fila nueva en vez de reemplazar
        // la existente — dos filas persistidas para el mismo cliente.
        return ov
          ? { ...c, name: ov.name, color: ov.color, iconKey: ov.iconKey, icon: iconFor(ov.iconKey), logoSvg: ov.logoSvg ?? null, baseKey: c.name }
          : { ...c, baseKey: c.name };
      }),
      ...extra.map((c) => ({ ...c, icon: iconFor(c.iconKey) })),
    ];
    CLIENTES.splice(0, CLIENTES.length, ...merged);
    setClientsBump((x) => x + 1);
  }

  useEffect(() => {
    loadCustomClients().then((list) => reconcile(list));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeReload(
    (onChange) => subscribeTable("clients", onChange),
    () => loadCustomClients().then((list) => reconcile(list))
  );

  function addClient(c) {
    try {
      // baseKey: null — un cliente agregado a mano nunca corresponde a
      // ninguno de los 8 originales, así que no necesita esa clave.
      const entry = { name: c.name, color: c.color, iconKey: c.iconKey, icon: iconFor(c.iconKey), logoSvg: c.logoSvg ?? null, baseKey: null };
      CLIENTES.splice(0, CLIENTES.length, ...CLIENTES, entry);
      loadCustomClients().then((list) => persistCustomClients([...list, { name: entry.name, color: entry.color, iconKey: entry.iconKey, logoSvg: entry.logoSvg, baseKey: null }]));
      setClientsBump((x) => x + 1);
      setSelectedClient(entry.name);
      logActivity(`Se agregó el cliente ${entry.name}`);
    } catch (e) {
      setAppError("No se pudo agregar el cliente: " + (e && e.message ? e.message : e));
    }
  }

  /**
   * `patch` puede traer `name` (renombre), `color`, `iconKey`, `logoSvg` —
   * cualquier combinación. Si `patch.name` es un nombre distinto al actual,
   * dispara el encadenado a los 13 dominios ANTES de persistir el cliente
   * en sí.
   */
  function editClient(name, patch) {
    try {
      const newName = patch.name && patch.name.trim() && patch.name.trim() !== name ? patch.name.trim() : null;

      if (newName) {
        updateTasks((tasks || []).map((t) => (t.empresa === name ? { ...t, empresa: newName } : t)));
        updatePayments((payments || []).map((p) => (p.empresa === name ? { ...p, empresa: newName } : p)));
        updatePosts((posts || []).map((p) => (p.empresa === name ? { ...p, empresa: newName } : p)));
        updateNotes((notes || []).map((n) => (n.empresa === name ? { ...n, empresa: newName } : n)));
        updateDebts((debts || []).map((d) => (d.empresa === name ? { ...d, empresa: newName } : d)));
        updateInvoices((invoices || []).map((i) => (i.empresa === name ? { ...i, empresa: newName } : i)));
        updateAccesos((accesos || []).map((a) => (a.empresa === name ? { ...a, empresa: newName } : a)));
        updateSaldosFavor((saldosFavor || []).map((s) => (s.empresa === name ? { ...s, empresa: newName } : s)));
        updateInversiones((inversiones || []).map((i) => (i.empresa === name ? { ...i, empresa: newName } : i)));
        updateGuiones((guiones || []).map((g) => (g.empresa === name ? { ...g, empresa: newName } : g)));
        updateExpenses((expenses || []).map((e) => (e.empresa === name ? { ...e, empresa: newName } : e)));
        updateTareasGenerales((tareasGenerales || []).map((t) => (t.empresa === name ? { ...t, empresa: newName } : t)));
        (pautas || []).filter((p) => p.empresa === name).forEach((p) => patchPauta(p.id, { empresa: newName }));
        if (selectedClient === name) setSelectedClient(newName);
      }

      const finalName = newName || name;
      const current = CLIENTES.find((c) => c.name === name);
      // Si ya tenía baseKey (de un renombre anterior), se mantiene igual;
      // si es la primera edición de este cliente, su nombre ACTUAL (antes
      // de este cambio) pasa a ser su baseKey de acá en más. Para un
      // cliente agregado a mano (baseKey ya null desde addClient), se
      // mantiene null — no corresponde a ningún cliente base.
      const baseKey = current && "baseKey" in current ? (current.baseKey ?? name) : name;
      const isCustomClient = current && current.baseKey === null && !baseClientesRef.current.some((b) => b.name === name);

      const updatedList = CLIENTES.map((c) => (c.name === name
        ? { ...c, ...patch, name: finalName, baseKey: isCustomClient ? null : baseKey, icon: patch.iconKey ? iconFor(patch.iconKey) : c.icon }
        : c));
      CLIENTES.splice(0, CLIENTES.length, ...updatedList);
      const updated = CLIENTES.find((c) => c.name === finalName);

      loadCustomClients().then((list) => {
        // Saca cualquier fila vieja que corresponda a ESTE cliente (por
        // baseKey si es uno de los 8 originales, o por nombre si es uno
        // agregado a mano) antes de agregar la versión actualizada — así
        // un renombre nunca deja una fila vieja Y una nueva coexistiendo.
        const matchKey = isCustomClient ? null : baseKey;
        const rest = list.filter((c) => (matchKey ? (c.baseKey || c.name) !== matchKey : c.name !== name && c.name !== finalName));
        persistCustomClients([...rest, {
          name: updated.name, color: updated.color, iconKey: updated.iconKey,
          logoSvg: updated.logoSvg ?? null, baseKey: isCustomClient ? null : baseKey,
        }]);
      });
      setClientsBump((x) => x + 1);
      logActivity(newName ? `Se renombró "${name}" a "${finalName}" y se actualizó en todos los módulos` : `Se actualizó la apariencia de ${finalName}`);
    } catch (e) {
      setAppError("No se pudo actualizar el cliente: " + (e && e.message ? e.message : e));
    }
  }

  function deleteClientCompletely(name) {
    try {
      const current = CLIENTES.find((c) => c.name === name);
      const matchKey = current && current.baseKey ? current.baseKey : null;
      const remaining = CLIENTES.filter((c) => c.name !== name);
      CLIENTES.splice(0, CLIENTES.length, ...remaining);
      loadCustomClients().then((list) => persistCustomClients(list.filter((c) => (matchKey ? (c.baseKey || c.name) !== matchKey : c.name !== name))));
      setClientsBump((x) => x + 1);

      updateTasks((tasks || []).filter((t) => t.empresa !== name));
      updatePayments((payments || []).filter((p) => p.empresa !== name));
      updatePosts((posts || []).filter((p) => p.empresa !== name));
      updateNotes((notes || []).filter((n) => n.empresa !== name));
      updateDebts((debts || []).filter((d) => d.empresa !== name));
      updateInvoices((invoices || []).filter((i) => i.empresa !== name));
      updateAccesos((accesos || []).filter((a) => a.empresa !== name));
      updateSaldosFavor((saldosFavor || []).filter((s) => s.empresa !== name));
      updateInversiones((inversiones || []).filter((i) => i.empresa !== name));
      updateGuiones((guiones || []).filter((g) => g.empresa !== name));
      updateExpenses((expenses || []).filter((e) => e.empresa !== name));
      updateTareasGenerales((tareasGenerales || []).filter((t) => t.empresa !== name));
      // Nota: las pautas de este cliente NO se limpian acá a propósito —
      // usan un modelo de borrado distinto (fila por fila, sin papelera)
      // y ya era así antes de este cambio; no es parte de lo pedido esta
      // ronda, así que no se improvisa un arreglo a medias.

      if (selectedClient === name) setSelectedClient("__ALL__");
      logActivity(`Se eliminó el cliente ${name} y toda su información`);
    } catch (e) {
      setAppError("No se pudo eliminar el cliente: " + (e && e.message ? e.message : e));
    }
  }

  return { clientsBump, setClientsBump, addClient, editClient, deleteClientCompletely };
}
