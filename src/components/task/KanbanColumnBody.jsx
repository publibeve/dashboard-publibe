import { ChevronDown } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { monthLabelEs, todayISO, hasUnreadComments } from "../../utils/helpers";
import { useMonthGroups } from "../../hooks/useMonthGroups";

/**
 * Antes esta columna mostraba sus tarjetas en una lista plana (con "Ver 5
 * más" paginando el total de la columna). Ahora se agrupan por mes de
 * ENTREGA (fechaEntrega) — mismo patrón visual que ya usa el Historial
 * (más reciente primero, mes actual expandido). El "Ver 5 más" se mantiene,
 * pero ahora es por cada grupo de mes en vez de por toda la columna.
 * El drag-and-drop no cambia: sigue funcionando igual, atado a la columna
 * entera (este componente no toca esos handlers, viven en el <section> que
 * lo envuelve en App.jsx).
 */
export function KanbanColumnBody({
  colId, items, visibleCounts, onShowMore,
  onOpen, showClient, draggingId, onDragStart, onDragEnd, commentReads, currentUser,
}) {
  const currentMonthKey = todayISO().slice(0, 7);
  const { groups, isOpen, toggleMonth } = useMonthGroups(items, "fechaEntrega", currentMonthKey);

  if (items.length === 0) return <div className="empty-col">Suelta aquí una tarea</div>;

  return groups.map(([mk, monthItems]) => {
    const visKey = `${colId}:${mk}`;
    const visibleCount = visibleCounts[visKey] || 5;
    const visibleItems = monthItems.slice(0, visibleCount);
    return (
      <div className="kanban-month-group" key={mk}>
        {mk !== "sin-fecha" ? (
          <button type="button" className="kanban-month-toggle" onClick={() => toggleMonth(mk)}>
            <span className="kanban-month-label">
              {monthLabelEs(mk)}
              {mk === currentMonthKey && <span className="history-month-current">Mes actual</span>}
            </span>
            <span className="kanban-month-right">
              <span className="kanban-month-count">{monthItems.length}</span>
              <ChevronDown size={12} className={"history-month-chev" + (isOpen(mk) ? " history-month-chev-open" : "")} />
            </span>
          </button>
        ) : (
          <div className="kanban-month-label kanban-month-label-plain">
            Sin fecha de entrega <span className="kanban-month-count">{monthItems.length}</span>
          </div>
        )}
        {isOpen(mk) && (
          <div className="kanban-month-items">
            {visibleItems.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onOpen={() => onOpen(t.id)}
                showClient={showClient}
                dragging={draggingId === t.id}
                canDrag={draggingId === null || draggingId === t.id}
                unread={hasUnreadComments(t, commentReads, currentUser)}
                onDragStart={(e) => onDragStart(e, t.id)}
                onDragEnd={onDragEnd}
              />
            ))}
            {monthItems.length > visibleCount && (
              <button
                type="button"
                className="column-show-more"
                onClick={() => onShowMore(visKey, visibleCount + 5)}
              >
                Ver 5 más ({monthItems.length - visibleCount} restantes)
              </button>
            )}
          </div>
        )}
      </div>
    );
  });
}
