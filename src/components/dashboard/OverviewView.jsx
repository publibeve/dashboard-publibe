import { useState, useMemo } from "react";
import {
  User,
  Clock,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  Wallet,
  CalendarDays,
  TrendingUp,
  Sparkles,
  ListChecks,
  Share2,
  Tag,
  FolderKanban,
} from "lucide-react";
import { CustomSelect } from "../common/CustomSelect";
import { CLIENTES, DISENADORES, ESTADOS } from "../../utils/constants";
import { clientMeta, fmtMonto, monthLabelEs, redMeta, tareaEstadoMeta, todayISO } from "../../utils/helpers";

export function OverviewView({ tasks = [], payments = [], debts = [], posts = [], tareasGenerales = [], onSelectClient, onOpenTareaGeneral, canSeeMontos = false }) {
  // Mismo criterio que en Pagos publicitarios / Inversión por semana: sin el
  // permiso "verMontos", las cifras de esta sección se muestran enmascaradas
  // — el enmascarado es solo de despliegue, los cálculos de más abajo
  // (rows, totalGastadoMes, etc.) se hacen igual sea cual sea el permiso,
  // así que para quien sí puede verlas no cambia nada.
  const mMonto = (v) => (canSeeMontos ? fmtMonto(v) : "•••");
  const monthStart = todayISO().slice(0, 7);
  const [filterDesigner, setFilterDesigner] = useState("Todos");
  const [filterCreativosCliente, setFilterCreativosCliente] = useState("Todos");
  const [filterCreativosMes, setFilterCreativosMes] = useState("Todos");
  const [filterPagosCliente, setFilterPagosCliente] = useState("Todos");
  const [filterCalCliente, setFilterCalCliente] = useState("Todos");
  const [filterCalMes, setFilterCalMes] = useState(monthStart);

  const clienteFilterOptions = [
    { value: "Todos", label: "Todos los clientes" },
    ...CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color })),
  ];

  const tasksFiltered = filterDesigner === "Todos" ? tasks : tasks.filter((t) => t.asignado === filterDesigner);

  const rows = CLIENTES.map((c) => {
    const ct = tasksFiltered.filter((t) => t.empresa === c.name);
    const cp = payments.filter((p) => p.empresa === c.name);
    const cd = debts.filter((d) => d.empresa === c.name);
    const cposts = posts.filter((p) => p.empresa === c.name);
    return {
      client: c,
      porHacer: ct.filter((t) => t.estado === "pendiente").length,
      enDiseno: ct.filter((t) => t.estado === "proceso" || t.estado === "revision").length,
      entregado: ct.filter((t) => t.estado === "listo").length,
      gastado: cp.reduce((s, p) => s + Number(p.monto || 0), 0),
      pendiente: cd.reduce((s, d) => s + Number(d.monto || 0), 0),
      postsMes: cposts.filter((p) => p.fecha.startsWith(monthStart)).length,
    };
  });

  // ---- Creativos: filtrado también por cliente y por fecha de entrega ----
  const creativosMesesDisponibles = useMemo(() => {
    const set = new Set(tasks.map((t) => (t.fechaEntrega || t.fechaSolicitud || "").slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [tasks]);

  const rowsCreativos = useMemo(() => {
    let t = tasksFiltered;
    if (filterCreativosMes !== "Todos") t = t.filter((x) => (x.fechaEntrega || x.fechaSolicitud || "").startsWith(filterCreativosMes));
    return CLIENTES
      .filter((c) => filterCreativosCliente === "Todos" || c.name === filterCreativosCliente)
      .map((c) => {
        const ct = t.filter((x) => x.empresa === c.name);
        return {
          client: c,
          porHacer: ct.filter((x) => x.estado === "pendiente").length,
          enDiseno: ct.filter((x) => x.estado === "proceso" || x.estado === "revision").length,
          entregado: ct.filter((x) => x.estado === "listo").length,
        };
      });
  }, [tasksFiltered, filterCreativosCliente, filterCreativosMes]);

  const totalPorHacer = rowsCreativos.reduce((s, r) => s + r.porHacer, 0);
  const totalEnDiseno = rowsCreativos.reduce((s, r) => s + r.enDiseno, 0);
  const totalEntregado = rowsCreativos.reduce((s, r) => s + r.entregado, 0);

  // ---- Pagos publicitarios: filtrado por cliente; totales siempre agregados ----
  const rowsPagos = filterPagosCliente === "Todos" ? rows : rows.filter((r) => r.client.name === filterPagosCliente);
  const totalGastado = rows.reduce((s, r) => s + r.gastado, 0);
  const totalPendiente = rows.reduce((s, r) => s + r.pendiente, 0);
  const totalGastadoMes = payments.filter((p) => p.fecha.startsWith(monthStart)).reduce((s, p) => s + Number(p.monto || 0), 0);

  const totalPostsMes = rows.reduce((s, r) => s + r.postsMes, 0);

  // ---- Calendario: por red social / por formato, filtrable por cliente y mes ----
  const calMesesDisponibles = useMemo(() => {
    const set = new Set(posts.map((p) => (p.fecha || "").slice(0, 7)).filter(Boolean));
    set.add(monthStart);
    return [...set].sort().reverse();
  }, [posts]);

  const calPostsFiltrados = useMemo(() => {
    let p = posts;
    if (filterCalCliente !== "Todos") p = p.filter((x) => x.empresa === filterCalCliente);
    if (filterCalMes !== "Todos") p = p.filter((x) => (x.fecha || "").startsWith(filterCalMes));
    return p;
  }, [posts, filterCalCliente, filterCalMes]);

  const porFormato = useMemo(() => {
    const map = {};
    calPostsFiltrados.forEach((p) => { map[p.formato] = (map[p.formato] || 0) + 1; });
    return map;
  }, [calPostsFiltrados]);
  const porRed = useMemo(() => {
    const map = {};
    calPostsFiltrados.forEach((p) => { map[p.redSocial] = (map[p.redSocial] || 0) + 1; });
    return map;
  }, [calPostsFiltrados]);

  const recentTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.id < b.id ? 1 : -1)).slice(0, 5);
  }, [tasks]);

  const recentTareasGenerales = useMemo(() => {
    return [...(tareasGenerales || [])]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [tareasGenerales]);

  return (
    <main className="pane overview-pane">

      {/* ---- Novedades: últimas tareas de Creativos ---- */}
      {recentTasks.length > 0 && (
        <section className="overview-section recent-section">
          <div className="overview-section-head">
            <span className="overview-section-title"><Sparkles size={15} /> Novedades — últimas tareas de Creativos</span>
          </div>
          <div className="recent-list">
            {recentTasks.map((t) => {
              const cm = clientMeta(t.empresa);
              const CmIcon = cm.icon;
              const est = ESTADOS.find((s) => s.id === t.estado) || ESTADOS[0];
              const EstIcon = est.icon;
              return (
                <button className="recent-row" key={t.id} onClick={() => onSelectClient(t.empresa)}>
                  <span className="recent-titulo">{t.titulo}</span>
                  <span className="recent-empresa" style={{ color: cm.color }}><CmIcon size={12} />{t.empresa}</span>
                  <span className="recent-estado" style={{ color: est.dot }}><EstIcon size={12} />{est.label}</span>
                  <span className="recent-asignado"><User size={12} />{t.asignado}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- Novedades: últimas tareas generales ---- */}
      {recentTareasGenerales.length > 0 && (
        <section className="overview-section recent-section">
          <div className="overview-section-head">
            <span className="overview-section-title"><ListChecks size={15} /> Novedades — últimas tareas generales</span>
          </div>
          <div className="recent-list">
            {recentTareasGenerales.map((t) => {
              const em = tareaEstadoMeta(t.estado);
              return (
                <button className="recent-row" key={t.id} onClick={() => onOpenTareaGeneral(t.id)}>
                  <span className="recent-titulo">{t.titulo}</span>
                  <span className="recent-empresa" style={{ color: em.color }}><FolderKanban size={12} />{t.categoria}</span>
                  <span className="recent-estado" style={{ color: em.color }}>{em.label}</span>
                  <span className="recent-asignado"><User size={12} />{t.asignado}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- Creativos ---- */}
      <section className="overview-section">
        <div className="overview-section-head admin-section-head">
          <span className="overview-section-title"><LayoutGrid size={15} /> Creativos</span>
          <div className="overview-filter-row">
            <div className="toolbar-select">
              <CustomSelect value={filterDesigner} onChange={setFilterDesigner} options={["Todos", ...DISENADORES]} />
            </div>
            <div className="toolbar-select">
              <CustomSelect value={filterCreativosCliente} onChange={setFilterCreativosCliente} options={clienteFilterOptions} />
            </div>
            <div className="toolbar-select">
              <CustomSelect
                value={filterCreativosMes}
                onChange={setFilterCreativosMes}
                options={[{ value: "Todos", label: "Todas las fechas" }, ...creativosMesesDisponibles.map((m) => ({ value: m, label: monthLabelEs(m) }))]}
              />
            </div>
          </div>
        </div>
        <div className="summary-row-v2">
          <div className="summary-card-v2 tone-gold">
            <span className="summary-v2-icon"><Clock size={17} /></span>
            <div className="summary-v2-body">
              <span className="summary-v2-label">Por hacer</span>
              <span className="summary-v2-value">{totalPorHacer}</span>
            </div>
          </div>
          <div className="summary-card-v2 tone-navy">
            <span className="summary-v2-icon"><PenTool size={17} /></span>
            <div className="summary-v2-body">
              <span className="summary-v2-label">En diseño</span>
              <span className="summary-v2-value">{totalEnDiseno}</span>
            </div>
          </div>
          <div className="summary-card-v2 tone-green">
            <span className="summary-v2-icon"><CheckCircle2 size={17} /></span>
            <div className="summary-v2-body">
              <span className="summary-v2-label">Entregado</span>
              <span className="summary-v2-value">{totalEntregado}</span>
            </div>
          </div>
        </div>
        <div className="overview-table">
          <div className="overview-head overview-head-3">
            <span>Cliente</span><span>Por hacer</span><span>En diseño</span><span>Entregado</span>
          </div>
          {rowsCreativos.length === 0 && <div className="hint">Sin resultados para este filtro.</div>}
          {rowsCreativos.map((r) => {
            const Icon = r.client.icon;
            return (
              <button className="overview-row overview-row-3" key={r.client.name} onClick={() => onSelectClient(r.client.name)}>
                <span className="overview-client" style={{ color: r.client.color }}><Icon size={13} />{r.client.name}</span>
                <span data-label="Por hacer">{r.porHacer}</span>
                <span data-label="En diseño">{r.enDiseno}</span>
                <span data-label="Entregado">{r.entregado}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- Pagos ---- */}
      <section className="overview-section">
        <div className="overview-section-head admin-section-head">
          <span className="overview-section-title"><Wallet size={15} /> Pagos publicitarios</span>
          <div className="toolbar-select">
            <CustomSelect value={filterPagosCliente} onChange={setFilterPagosCliente} options={clienteFilterOptions} />
          </div>
        </div>
        <div className="summary-row-v2">
          <div className={"summary-card-v2" + (totalPendiente > 0 ? " tone-red" : " tone-teal")}>
            <span className="summary-v2-icon">{totalPendiente > 0 ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}</span>
            <div className="summary-v2-body">
              <span className="summary-v2-label">Saldo pendiente (todas)</span>
              <span className="summary-v2-value">{mMonto(totalPendiente)}</span>
            </div>
          </div>
          <div className="summary-card-v2 tone-navy">
            <span className="summary-v2-icon"><TrendingUp size={17} /></span>
            <div className="summary-v2-body">
              <span className="summary-v2-label">Invertido este mes</span>
              <span className="summary-v2-value">{mMonto(totalGastadoMes)}</span>
            </div>
          </div>
        </div>
        <div className="summary-line-v2">
          <TrendingUp size={13} />
          <span>Invertido acumulado (todas)</span>
          <b>{mMonto(totalGastado)}</b>
        </div>
        <div className="overview-table">
          <div className="overview-head overview-head-2">
            <span>Cliente</span><span>Invertido</span><span>Pendiente</span>
          </div>
          {rowsPagos.length === 0 && <div className="hint">Sin resultados para este filtro.</div>}
          {rowsPagos.map((r) => {
            const Icon = r.client.icon;
            return (
              <button className="overview-row overview-row-2" key={r.client.name} onClick={() => onSelectClient(r.client.name)}>
                <span className="overview-client" style={{ color: r.client.color }}><Icon size={13} />{r.client.name}</span>
                <span data-label="Invertido">{mMonto(r.gastado)}</span>
                <span data-label="Pendiente" className={r.pendiente > 0 ? "overview-alert" : ""}>{mMonto(r.pendiente)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- Calendario ---- */}
      <section className="overview-section">
        <div className="overview-section-head">
          <span className="overview-section-title"><CalendarDays size={15} /> Calendario</span>
        </div>
        <div className="summary-row-v2">
          <div className="summary-card-v2 tone-purple">
            <span className="summary-v2-icon"><CalendarDays size={17} /></span>
            <div className="summary-v2-body">
              <span className="summary-v2-label">Publicaciones este mes</span>
              <span className="summary-v2-value">{totalPostsMes}</span>
            </div>
          </div>
        </div>
        <div className="overview-table">
          <div className="overview-head overview-head-1">
            <span>Cliente</span><span>Posts este mes</span>
          </div>
          {rows.map((r) => {
            const Icon = r.client.icon;
            return (
              <button className="overview-row overview-row-1" key={r.client.name} onClick={() => onSelectClient(r.client.name)}>
                <span className="overview-client" style={{ color: r.client.color }}><Icon size={13} />{r.client.name}</span>
                <span data-label="Posts este mes">{r.postsMes}</span>
              </button>
            );
          })}
        </div>
        <div className="overview-filter-row overview-cols-filter">
          <span className="overview-filter-label">Filtrar por red social y formato:</span>
          <div className="toolbar-select">
            <CustomSelect value={filterCalCliente} onChange={setFilterCalCliente} options={clienteFilterOptions} />
          </div>
          <div className="toolbar-select">
            <CustomSelect
              value={filterCalMes}
              onChange={setFilterCalMes}
              options={[{ value: "Todos", label: "Todas las fechas" }, ...calMesesDisponibles.map((m) => ({ value: m, label: monthLabelEs(m) }))]}
            />
          </div>
        </div>
        <div className="overview-cols">
          <div className="overview-block">
            <h4><Share2 size={13} /> Por red social</h4>
            {Object.keys(porRed).length === 0 && <div className="hint">Sin publicaciones en este período.</div>}
            {Object.entries(porRed).map(([red, n]) => {
              const rm = redMeta(red);
              const RedIcon = rm.icon;
              return <div className="overview-bar-row" key={red}><span style={{ color: rm.color }}><RedIcon size={12} />{red}</span><b>{n}</b></div>;
            })}
          </div>
          <div className="overview-block">
            <h4><Tag size={13} /> Por formato</h4>
            {Object.keys(porFormato).length === 0 && <div className="hint">Sin publicaciones en este período.</div>}
            {Object.entries(porFormato).map(([f, n]) => (
              <div className="overview-bar-row" key={f}><span>{f}</span><b>{n}</b></div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
