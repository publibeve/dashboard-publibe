import { useState, useMemo } from "react";

/**
 * Agrupa `items` por mes (a partir de `dateField`, una fecha ISO), más
 * reciente primero, con el mes actual expandido por defecto — mismo patrón
 * que ya usaba el Historial (Panel Administrativo). Los ítems sin fecha van
 * en su propio grupo "Sin fecha", siempre expandido, al principio.
 */
export function useMonthGroups(items, dateField, currentMonthKey) {
  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonthKey]));

  const groups = useMemo(() => {
    const map = new Map();
    const sinFecha = [];
    (items || []).forEach((it) => {
      const raw = it[dateField];
      if (!raw) { sinFecha.push(it); return; }
      const mk = raw.slice(0, 7);
      if (!map.has(mk)) map.set(mk, []);
      map.get(mk).push(it);
    });
    const dated = [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
    return sinFecha.length ? [["sin-fecha", sinFecha], ...dated] : dated;
  }, [items, dateField]);

  function toggleMonth(mk) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(mk)) next.delete(mk); else next.add(mk);
      return next;
    });
  }
  function isOpen(mk) {
    return mk === "sin-fecha" || openMonths.has(mk);
  }

  return { groups, isOpen, toggleMonth };
}
