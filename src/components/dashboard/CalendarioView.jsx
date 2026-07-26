import { useState, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { Overlay } from "../common/Overlay";
import { ReportModal } from "../common/ReportModal";
import { clientMeta, dateSearchBlob, fmtDate, redMeta, todayISO } from "../../utils/helpers";

export function CalendarioView({ posts, showClient, empresaLabel, month, onMonthChange, selectedDay, onSelectDay, onOpen, filterRed, filterFormato, search, showReportPicker, onCloseReportPicker }) {
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [showReport, setShowReport] = useState(false);
  const q = search.trim().toLowerCase();
  const year = month.getFullYear();
  const mon = month.getMonth();
  const first = new Date(year, mon, 1);
  const startOffset = (first.getDay() + 6) % 7; // lunes=0
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach((p) => { (map[p.fecha] = map[p.fecha] || []).push(p); });
    return map;
  }, [posts]);

  const reportPosts = useMemo(() => {
    if (!reportFrom || !reportTo) return [];
    return posts
      .filter((p) => p.fecha >= reportFrom && p.fecha <= reportTo)
      .sort((a, b) => (a.fecha === b.fecha ? (a.hora || "").localeCompare(b.hora || "") : a.fecha < b.fecha ? -1 : 1));
  }, [posts, reportFrom, reportTo]);

  function postBlob(p) {
    return [p.titulo, p.copy, p.redSocial, p.formato, p.empresa, p.hora, dateSearchBlob(p.fecha)].filter(Boolean).join(" ").toLowerCase();
  }

  const monthLabel = month.toLocaleDateString("es-VE", { month: "long", year: "numeric" });
  const todayIsoStr = todayISO();
  const filtered = posts
    .filter((p) => !selectedDay || p.fecha === selectedDay)
    .filter((p) => filterRed === "Todas" || p.redSocial === filterRed)
    .filter((p) => filterFormato === "Todos" || p.formato === filterFormato)
    .filter((p) => !q || postBlob(p).includes(q));

  function isoFor(d) {
    return `${year}-${String(mon + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return (
    <>
    <main className="pane">
      <div className="cal-wrap">
        <div className="cal-card">
          <div className="cal-nav">
            <button className="icon-btn" onClick={() => onMonthChange(new Date(year, mon - 1, 1))}><ChevronLeft size={15} /></button>
            <span className="cal-month">{monthLabel}</span>
            <button className="icon-btn" onClick={() => onMonthChange(new Date(year, mon + 1, 1))}><ChevronRight size={15} /></button>
          </div>
          <div className="cal-grid cal-weekdays">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="cal-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={i} className="cal-cell cal-empty" />;
              const iso = isoFor(d);
              const count = (postsByDay[iso] || []).length;
              const isToday = iso === todayIsoStr;
              const isSel = iso === selectedDay;
              return (
                <button
                  key={i}
                  className={"cal-cell" + (isToday ? " cal-today" : "") + (isSel ? " cal-selected" : "")}
                  onClick={() => onSelectDay(isSel ? null : iso)}
                >
                  <span className="cal-daynum">{d}</span>
                  {count > 0 && <span className="cal-dot-count">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cal-table-wrap">
          {selectedDay && (
            <div className="cal-filters">
              <div className="cal-filter-chip">
                {fmtDate(selectedDay)}
                <button onClick={() => onSelectDay(null)}><X size={12} /></button>
              </div>
            </div>
          )}

          {q && <div className="cal-search-count">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{search.trim()}"</div>}
          {filtered.length === 0 && <div className="empty-pane">No hay publicaciones que coincidan con el filtro.</div>}
          <div className="post-list">
            {filtered.map((p) => {
              const rm = redMeta(p.redSocial);
              const cm = clientMeta(p.empresa);
              const RedIcon = rm.icon;
              const CmIcon = cm.icon;
              return (
                <button className="post-row" key={p.id} onClick={() => onOpen(p.id)}>
                  <div className="post-row-top">
                    <span className="post-fecha">{fmtDate(p.fecha)} {p.hora && <span className="post-hora">· {p.hora}</span>}</span>
                    <span className="post-red" style={{ color: rm.color }}><RedIcon size={13} />{p.redSocial}</span>
                    <span className="post-formato">{p.formato}</span>
                    {showClient && <span className="post-empresa" style={{ color: cm.color }}><CmIcon size={12} />{p.empresa}</span>}
                  </div>
                  <div className="post-titulo">{p.titulo}</div>
                  {p.copy && <div className="post-copy">{p.copy}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>

      {showReportPicker && (
        <Overlay onClose={onCloseReportPicker}>
          <div className="modal small report-picker-modal" style={{ maxWidth: 340 }}>
            <div className="modal-head">
              <h3><Printer size={15} /> Compartir info</h3>
              <button type="button" className="icon-btn" onClick={onCloseReportPicker}><X size={16} /></button>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Desde</span>
                <CustomDatePicker value={reportFrom} onChange={setReportFrom} />
              </label>
              <label className="field">
                <span>Hasta</span>
                <CustomDatePicker value={reportTo} onChange={setReportTo} />
              </label>
            </div>
            <button
              className="btn-primary full" type="button" disabled={!reportFrom || !reportTo}
              onClick={() => { onCloseReportPicker(); setShowReport(true); }}
            >
              Generar resumen
            </button>
          </div>
        </Overlay>
      )}

      {showReport && (
        <ReportModal
          title="Planificación de contenido"
          empresaLabel={empresaLabel}
          dateRangeLabel={reportFrom && reportTo ? `Del ${fmtDate(reportFrom)} al ${fmtDate(reportTo)}` : ""}
          emptyText="No hay publicaciones planificadas en ese rango de fechas."
          groups={reportPosts.map((p) => {
            const rm = redMeta(p.redSocial);
            const items = [];
            if (showClient) items.push({ label: p.empresa });
            items.push({ label: `${p.redSocial} · ${p.formato}${p.hora ? " · " + p.hora : ""}` });
            if (p.copy) items.push({ label: p.copy });
            return { label: `${fmtDate(p.fecha)} — ${p.titulo}`, value: "", items };
          })}
          totalLabel="Publicaciones en el rango"
          total={String(reportPosts.length)}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
