/**
 * Resiliencia offline para Guiones — versión deliberadamente simple:
 * "última copia local gana", sin mezclar cambios de dos dispositivos a la
 * vez. Pensado para el caso real de Diego: grabando afuera, con señal
 * intermitente, una sola persona editando el guion a la vez.
 *
 * Cómo funciona, en criollo:
 * - Cada vez que se intenta guardar algo y falla (o ya se sabe que no hay
 *   señal), se guarda una copia completa del array de guiones en
 *   localStorage — sobrevive a que se cierre la app o se bloquee el
 *   dispositivo, porque localStorage no se borra solo.
 * - Al volver la señal (evento "online" del navegador, o un reintento
 *   periódico por si ese evento no dispara confiable en algún celular), se
 *   reintenta mandar esa copia. Si funciona, se borra la copia local — ya
 *   no hace falta, quedó sincronizada de verdad.
 * - Si la app se abre de cero y hay una copia pendiente de una sesión
 *   anterior que nunca llegó a sincronizar, se usa esa como punto de
 *   partida (no lo que diga el servidor, que en ese caso está desactualizado
 *   respecto a lo último que se editó offline) y se intenta sincronizar de
 *   inmediato.
 */

const PENDING_KEY_PREFIX = "publibe-offline-pending-";

export function savePendingLocal(domain, data) {
  try {
    localStorage.setItem(PENDING_KEY_PREFIX + domain, JSON.stringify({ data, savedAt: new Date().toISOString() }));
  } catch (e) {
    // localStorage lleno o bloqueado (modo incógnito estricto, etc.) — no
    // hay mucho más que hacer acá; el intento normal de red sigue su curso.
    console.error("No se pudo guardar la copia local offline:", e);
  }
}

export function loadPendingLocal(domain) {
  try {
    const raw = localStorage.getItem(PENDING_KEY_PREFIX + domain);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.data ? parsed : null;
  } catch (e) {
    return null;
  }
}

export function clearPendingLocal(domain) {
  try {
    localStorage.removeItem(PENDING_KEY_PREFIX + domain);
  } catch (e) { /* nada que hacer */ }
}

/**
 * navigator.onLine no es 100% confiable (puede decir "true" con wifi
 * conectado pero sin internet real) — se usa como primer filtro rápido para
 * no ni intentar la escritura cuando es obvio que no hay señal, pero el
 * intento real de red (con su propio catch) es la fuente de verdad final.
 */
export function isProbablyOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}
