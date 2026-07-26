import { useEffect, useRef } from "react";

/**
 * Encapsula el patrón que usa cada hook de dominio para mantenerse
 * sincronizado entre pestañas/dispositivos: se suscribe con `subscribeFn`
 * (que debe devolver una función para cancelar la suscripción — ver
 * `subscribeTable`/`subscribeKvKey` en services/supabaseClient.js) y, cada vez
 * que hay un evento, vuelve a cargar los datos con `reloadFn`.
 *
 * Los cambios se agrupan con un pequeño debounce (300ms): guardar un cambio
 * desde la app suele disparar más de un evento seguido (por ejemplo, el
 * patrón "reemplazar todo el arreglo" hace upsert + delete), y no tiene
 * sentido recargar dos veces por la misma acción.
 *
 * `enabled = false` permite desactivar la suscripción condicionalmente (por
 * ejemplo, mientras no hay sesión iniciada) sin duplicar lógica de useEffect
 * en cada hook que lo necesite.
 */
export function useRealtimeReload(subscribeFn, reloadFn, enabled = true) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const unsubscribe = subscribeFn(() => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(reloadFn, 300);
    });
    return () => {
      unsubscribe();
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
