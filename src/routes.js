/**
 * Rutas de la app — un solo lugar que sabe armar una URL a partir del
 * estado de navegación, y leer una URL para devolver ese mismo estado.
 *
 * IMPORTANTE: este archivo NO decide permisos. Solo traduce entre
 * "pathname" y "a dónde apunta". Quien llama a parsePath (App.jsx) es quien
 * decide si, dado el usuario actual, corresponde aplicar ese destino tal
 * cual o redirigir/denegar — los mismos checks que ya existían para clics
 * (requestPermission, can()) se usan también acá, nunca se saltean.
 */

const TAB_SLUGS = { flujo: "creativos", tareas: "tareas", calendario: "planificacion", notas: "notas", guiones: "guiones", pagos: "pagos" };
const SLUG_TO_TAB = Object.fromEntries(Object.entries(TAB_SLUGS).map(([k, v]) => [v, k]));

const ADMIN_SUBTABS = new Set(["finanzas", "datos", "config", "usuarios", "backup"]);

export function slugify(str) {
  return (str || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos (é -> e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function clientSlug(clientes, name) {
  const c = (clientes || []).find((c) => c.name === name);
  return c ? slugify(c.name) : null;
}
export function clientBySlug(clientes, slug) {
  return (clientes || []).find((c) => slugify(c.name) === slug) || null;
}

/**
 * loc → path. `loc` es un objeto plano con TODO lo que puede estar "abierto"
 * a la vez; los campos que no aplican simplemente se omiten.
 */
export function buildPath(loc, clientes) {
  if (loc.admin) {
    let p = "/administrativo";
    if (loc.adminSubTab && loc.adminSubTab !== "finanzas") p += `/${loc.adminSubTab}`;
    else if (loc.adminItemType) p += "/finanzas";
    if (loc.adminItemType === "factura" && loc.adminItemId) p += `/factura/${loc.adminItemId}`;
    if (loc.adminItemType === "gasto" && loc.adminItemId) p += `/gasto/${loc.adminItemId}`;
    return p;
  }
  if (!loc.cliente || loc.cliente === "__ALL__") {
    // Dashboard general — la única forma de tener algo "abierto" acá es una
    // tarea general (desde el feed de Novedades), ya que no está dentro de
    // ningún cliente ni de ninguna de sus pestañas.
    return loc.itemId ? `/tareas-generales/${loc.itemId}` : "/";
  }

  const slug = clientSlug(clientes, loc.cliente);
  if (!slug) return "/";
  let p = `/${slug}`;
  const tabSlug = TAB_SLUGS[loc.tab] || TAB_SLUGS.flujo;
  p += `/${tabSlug}`;
  if (loc.itemId) p += `/${loc.itemId}`;
  return p;
}

/**
 * path → loc. Nunca lanza — si no reconoce la ruta, devuelve null (quien
 * llama decide el fallback, normalmente el dashboard general).
 */
export function parsePath(pathname, clientes) {
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { cliente: "__ALL__" };

  if (parts[0] === "administrativo") {
    const loc = { admin: true, adminSubTab: "finanzas" };
    if (parts[1] && ADMIN_SUBTABS.has(parts[1])) loc.adminSubTab = parts[1];
    if (parts[1] === "finanzas" && parts[2] === "factura" && parts[3]) {
      loc.adminItemType = "factura"; loc.adminItemId = parts[3];
    } else if (parts[1] === "finanzas" && parts[2] === "gasto" && parts[3]) {
      loc.adminItemType = "gasto"; loc.adminItemId = parts[3];
    }
    return loc;
  }

  if (parts[0] === "tareas-generales") {
    // "Fuera del contexto de cliente": selectedClient se queda en "__ALL__",
    // no hay pestaña — solo, opcionalmente, una tarea general abierta.
    return { cliente: "__ALL__", itemId: parts[1] || null };
  }

  const client = clientBySlug(clientes, parts[0]);
  if (!client) return null; // slug desconocido — App.jsx cae al dashboard general

  const loc = { cliente: client.name, tab: "flujo" };
  if (parts[1] && SLUG_TO_TAB[parts[1]]) {
    loc.tab = SLUG_TO_TAB[parts[1]];
    if (parts[2]) loc.itemId = parts[2];
  }
  return loc;
}
