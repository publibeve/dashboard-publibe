import { useMemo } from "react";
import {
  FolderKanban,
} from "lucide-react";
import { fmtDate, hasUnreadComments, tareaEstadoMeta } from "../../utils/helpers";
import { plainLinesFromHtml } from "../../utils/richTextEditor";

export function TareasGeneralesView({ tareas = [], onNew, onOpen, filterPersona, search, commentReads, currentUser }) {
  const q = search.trim().toLowerCase();

  const filtered = (tareas || [])
    .filter((t) => filterPersona === "Todos" || t.asignado === filterPersona)
    .filter((t) => !q || `${t.titulo} ${t.categoria} ${plainLinesFromHtml(t.notas || "").join(" ")}`.toLowerCase().includes(q));

  const categorias = useMemo(() => {
    const map = new Map();
    filtered.forEach((t) => {
      if (!map.has(t.categoria)) map.set(t.categoria, []);
      map.get(t.categoria).push(t);
    });
    // La organización visual (por categoría) se mantiene tal cual estaba —
    // lo único nuevo es el orden DENTRO de cada categoría: por fecha de
    // solicitud (fecha de inicio), la más antigua primero, para que lo que
    // lleva más tiempo esperando quede arriba en vez de perderse en el medio
    // de la lista. Sin fecha, al final de su categoría.
    map.forEach((items) => {
      items.sort((a, b) => {
        if (!a.fecha && !b.fecha) return 0;
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0;
      });
    });
    return [...map.entries()];
  }, [filtered]);

  return (
    <main className="pane">
      {categorias.length === 0 && (
        <div className="empty-pane">
          {q ? "Ningún resultado coincide con tu búsqueda." : 'Aún no hay tareas generales. Usa "Nueva tarea" para empezar.'}
        </div>
      )}

      {categorias.map(([cat, items]) => (
        <section className="overview-section" key={cat}>
          <div className="overview-section-head">
            <span className="overview-section-title"><FolderKanban size={15} /> {cat}</span>
          </div>
          <div className="tareagen-list">
            {items.map((t) => {
              const em = tareaEstadoMeta(t.estado);
              const unread = hasUnreadComments(t, commentReads, currentUser);
              return (
                <button className="tareagen-row" key={t.id} onClick={() => onOpen(t.id)}>
                  {unread && <span className="card-unread-dot" title="Comentarios nuevos desde tu última visita" />}
                  <span className="tareagen-titulo">{t.titulo}</span>
                  <span className="tareagen-asignado">{t.asignado}</span>
                  <span className="tareagen-estado" style={{ color: em.color, background: em.color + "18" }}>{em.label}</span>
                  {t.fecha && <span className="tareagen-fecha">{fmtDate(t.fecha)}</span>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
