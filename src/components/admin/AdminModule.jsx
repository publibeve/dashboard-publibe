import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  X,
  Building2,
  User,
  Menu,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  FileType,
  StickyNote,
  KeyRound,
  Wallet,
  CalendarDays,
  TrendingUp,
  History,
  Briefcase,
  Receipt,
  Palette,
  Sparkles,
  Settings,
} from "lucide-react";
import { AccesoRow } from "./AccesosTab";
import { BackupPanel } from "./BackupPanel";
import { DriveConnectionPanel } from "./DriveConnectionPanel";
import { GeminiKeyPanel } from "./GeminiKeyPanel";
import { UsersPanel } from "./UsersPanel";
import { CustomSelect } from "../common/CustomSelect";
import { Overlay } from "../common/Overlay";
import { PermissionDeniedModal } from "../common/PermissionDeniedModal";
import { PaymentInfoPanel } from "./PaymentInfoPanel";
import { ItemTemplatesPanel } from "./ItemTemplatesPanel";
import { HeaderUserButton } from "../layout/Sidebar";
import { ADMIN_GRADIENT, ADMIN_PRIMARY, CLIENTES, DEMO_MODULES, DEMO_MODULE_KEYS, PERMISOS_LIST } from "../../utils/constants";
import { clientMeta, fmtDate, fmtMonto, invoiceEstado, monthLabelEs, sumAbonos } from "../../utils/helpers";

export function AdminModule({ invoices = [], expenses = [], onOpenInvoice, onNewInvoice, onOpenExpense, onNewExpense, onNewNomina, accesos = [], onOpenAcceso, onNewAcceso, clientsBump, onDeleteClient, activity, onClearHistory, onLoadDemoData, onDeleteDemoData, can, users, onAddUser, onPatchUser, onSaveAll, onDeleteUser, currentUser, geminiKey, onSaveGeminiKey, driveConnected, onToggleDriveConnected, onAddClient, onEditClient, onOpenMobileMenu, onLogout, lastBackupDate, onRunBackup, onRunWorkDriveBackup, onRestoreBackup, subTab: subTabProp, onSubTabChange, setAppError }) {
  // Controlado desde afuera (App.jsx, para poder reflejarlo en la URL) si se
  // pasan las props; si no, se comporta exactamente como antes (estado
  // propio) — así no rompe nada si en algún momento se usa este componente
  // sin esa integración.
  const [subTabLocal, setSubTabLocal] = useState("finanzas");
  const subTab = subTabProp !== undefined ? subTabProp : subTabLocal;
  const setSubTab = onSubTabChange || setSubTabLocal;
  useEffect(() => {
    // Mismo comportamiento que las pestañas de cada empresa (Tareas/Creativos/etc): al elegir una
    // pestaña que queda parcialmente tapada, se desliza sola hasta dejarla visible.
    const activeBtn = document.querySelector(".admin-tabbar .tab-active");
    if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [subTab]);
  const credsRevealed = can("verClaves");
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [confirmLoadDemo, setConfirmLoadDemo] = useState(false);
  const [confirmDeleteDemo, setConfirmDeleteDemo] = useState(false);
  const [demoScopeClient, setDemoScopeClient] = useState("__ALL__");
  const [demoModules, setDemoModules] = useState(DEMO_MODULE_KEYS);
  const [permDenied, setPermDenied] = useState(null);
  function requirePerm(key, action) {
    if (can(key)) { action(); return; }
    setPermDenied((PERMISOS_LIST.find((p) => p.key === key) || {}).label || key);
  }
  const clienteFilterOptionsAdmin = [
    { value: "Todos", label: "Todos los clientes" },
    ...CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color })),
  ];

  // ---- Facturación a clientes: filtro por empresa + mes, y solo se ven las últimas 3 ----
  // Las tarjetas de totales reflejan el filtro activo (si eliges julio, ves lo facturado/cobrado/
  // por cobrar de julio, no el acumulado histórico).
  const [facturasFiltroEmpresa, setFacturasFiltroEmpresa] = useState("Todos");
  const [facturasFiltroMes, setFacturasFiltroMes] = useState("Todos");
  const [facturasShowAll, setFacturasShowAll] = useState(false);
  const facturasMesesDisponibles = useMemo(() => {
    const set = new Set(invoices.map((i) => (i.fechaEmision || "").slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [invoices]);
  const invoicesFiltradas = invoices
    .filter((i) => facturasFiltroEmpresa === "Todos" || i.empresa === facturasFiltroEmpresa)
    .filter((i) => facturasFiltroMes === "Todos" || (i.fechaEmision || "").startsWith(facturasFiltroMes))
    .sort((a, b) => (b.fechaEmision || "").localeCompare(a.fechaEmision || ""));
  const invoicesVisibles = facturasShowAll ? invoicesFiltradas : invoicesFiltradas.slice(0, 3);
  const totalFacturado = invoicesFiltradas.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalCobrado = invoicesFiltradas.reduce((s, i) => s + sumAbonos(i.abonos), 0);
  const totalPorCobrar = totalFacturado - totalCobrado;

  const nomina = expenses.filter((e) => e.categoria === "Nómina");
  const operativos = expenses.filter((e) => e.categoria !== "Nómina");

  // ---- Nómina: filtro por mes (el total varía mes a mes, no es fijo) ----
  const [nominaFiltroMes, setNominaFiltroMes] = useState("Todos");
  const [nominaShowAll, setNominaShowAll] = useState(false);
  const nominaMesesDisponibles = useMemo(() => {
    const set = new Set(nomina.map((e) => (e.proximoPago || "").slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [nomina]);
  const nominaFiltrada = nomina
    .filter((e) => nominaFiltroMes === "Todos" || (e.proximoPago || "").startsWith(nominaFiltroMes))
    .sort((a, b) => (b.proximoPago || "").localeCompare(a.proximoPago || ""));
  const nominaVisible = nominaShowAll ? nominaFiltrada : nominaFiltrada.slice(0, 3);
  const totalNominaMensual = nominaFiltroMes === "Todos"
    ? nomina.filter((e) => e.frecuencia === "Mensual").reduce((s, e) => s + Number(e.monto || 0), 0)
    : nominaFiltrada.reduce((s, e) => s + Number(e.monto || 0), 0);

  // ---- Gastos operativos: mismo esquema que Nómina — filtro por mes, solo se ven los últimos 3 ----
  const [operativosFiltroMes, setOperativosFiltroMes] = useState("Todos");
  const [operativosShowAll, setOperativosShowAll] = useState(false);
  const operativosMesesDisponibles = useMemo(() => {
    const set = new Set(operativos.map((e) => (e.proximoPago || "").slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [operativos]);
  const operativosFiltrados = operativos
    .filter((e) => operativosFiltroMes === "Todos" || (e.proximoPago || "").startsWith(operativosFiltroMes))
    .sort((a, b) => (b.proximoPago || "").localeCompare(a.proximoPago || ""));
  const operativosVisibles = operativosShowAll ? operativosFiltrados : operativosFiltrados.slice(0, 3);
  const totalOperativosMensual = operativosFiltroMes === "Todos"
    ? operativos.filter((e) => e.frecuencia === "Mensual").reduce((s, e) => s + Number(e.monto || 0), 0)
    : operativosFiltrados.reduce((s, e) => s + Number(e.monto || 0), 0);

  function ExpenseTable({ items }) {
    return (
      <div className="pay-table">
        {items.length === 0 && <div className="hint">No hay gastos registrados aquí.</div>}
        {items.map((ex) => (
          <button className="pay-row" key={ex.id} onClick={() => onOpenExpense(ex.id)}>
            <div className="pay-row-top">
              <span className="inv-concepto">{ex.concepto}</span>
              <span className="post-formato">{ex.categoria}</span>
              <span className="post-formato">{ex.frecuencia}</span>
              <span className="pay-monto">{fmtMonto(ex.monto)}</span>
            </div>
            {ex.proximoPago && <div className="pay-cobertura"><span className="cov-chip">Próximo pago <b>{fmtDate(ex.proximoPago)}</b></span></div>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="admin-wrap" style={{ "--primary": ADMIN_PRIMARY }}>
      <header className="topbar topbar-colored admin-header" style={{ background: ADMIN_GRADIENT }}>
        <button type="button" className="mobile-menu-btn" onClick={onOpenMobileMenu} title="Menú">
          <Menu size={20} />
        </button>
        <span className="mobile-brand-mark">publi<span className="brand-b">B</span>e</span>
        <HeaderUserButton currentUser={currentUser} onLogout={onLogout} />
        <span className="topbar-watermark-clip"><span className="topbar-watermark" style={{ color: "rgba(255,255,255,0.14)" }}><Briefcase size={110} strokeWidth={1.4} /></span></span>
        <div className="topbar-title">
          <div>
            <h1>Administrativo</h1>
            <span className="topbar-sub">Privado — solo para ti</span>
          </div>
        </div>
      </header>

      <div className="tabbar admin-tabbar">
        <button className={"tab" + (subTab === "finanzas" ? " tab-active" : "")} onClick={() => setSubTab("finanzas")}>
          <Wallet size={14} /> Finanzas
        </button>
        <button className={"tab" + (subTab === "datos" ? " tab-active" : "")} onClick={() => setSubTab("datos")}>
          <KeyRound size={14} /> Datos de clientes
        </button>
        <button className={"tab" + (subTab === "config" ? " tab-active" : "")} onClick={() => setSubTab("config")}>
          <Settings size={14} /> Configuración de empresas
        </button>
        <button className={"tab" + (subTab === "usuarios" ? " tab-active" : "")} onClick={() => setSubTab("usuarios")}>
          <User size={14} /> Usuarios y permisos
        </button>
        <button className={"tab" + (subTab === "backup" ? " tab-active" : "")} onClick={() => setSubTab("backup")}>
          <History size={14} /> Backup
        </button>
      </div>

      {permDenied && <PermissionDeniedModal label={permDenied} onClose={() => setPermDenied(null)} />}

      <main className="pane">
        {subTab === "finanzas" && (
          <>
          <ItemTemplatesPanel setAppError={setAppError} />
          <section className="overview-section">
            <div className="overview-section-head admin-section-head">
              <span className="overview-section-title"><Receipt size={15} /> Facturación a clientes</span>
              <div className="admin-section-actions">
                <div className="toolbar-select">
                  <CustomSelect value={facturasFiltroEmpresa} onChange={setFacturasFiltroEmpresa} options={clienteFilterOptionsAdmin} />
                </div>
                <div className="toolbar-select">
                  <CustomSelect
                    value={facturasFiltroMes}
                    onChange={setFacturasFiltroMes}
                    options={[{ value: "Todos", label: "Todas las fechas" }, ...facturasMesesDisponibles.map((m) => ({ value: m, label: monthLabelEs(m) }))]}
                  />
                </div>
                <button className="btn-primary" onClick={onNewInvoice}><Plus size={14} /> Nueva factura</button>
              </div>
            </div>
            <div className="summary-row-v2">
              <div className="summary-card-v2 tone-navy">
                <span className="summary-v2-icon"><TrendingUp size={17} /></span>
                <div className="summary-v2-body">
                  <span className="summary-v2-label">Facturado</span>
                  <span className="summary-v2-value">{fmtMonto(totalFacturado)}</span>
                </div>
              </div>
              <div className="summary-card-v2 tone-green">
                <span className="summary-v2-icon"><Wallet size={17} /></span>
                <div className="summary-v2-body">
                  <span className="summary-v2-label">Cobrado</span>
                  <span className="summary-v2-value">{fmtMonto(totalCobrado)}</span>
                </div>
              </div>
              <div className={"summary-card-v2" + (totalPorCobrar > 0 ? " tone-red" : " tone-teal")}>
                <span className="summary-v2-icon">{totalPorCobrar > 0 ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}</span>
                <div className="summary-v2-body">
                  <span className="summary-v2-label">Por cobrar</span>
                  <span className="summary-v2-value">{fmtMonto(totalPorCobrar)}</span>
                </div>
              </div>
            </div>
            {invoicesFiltradas.length === 0 && <div className="hint">No hay facturas para este filtro.</div>}
            <div className="pay-table">
              {invoicesVisibles.map((inv) => {
                const cm = clientMeta(inv.empresa);
                const CmIcon = cm.icon;
                const abonado = sumAbonos(inv.abonos);
                const saldo = Number(inv.monto || 0) - abonado;
                const est = invoiceEstado(inv);
                return (
                  <button className="pay-row" key={inv.id} onClick={() => onOpenInvoice(inv.id)}>
                    <div className="pay-row-top">
                      <span className="pay-empresa" style={{ color: cm.color }}><CmIcon size={12} />{inv.empresa}</span>
                      {inv.numeroFactura && <span className="inv-numero">#{inv.numeroFactura}</span>}
                      <span className="inv-concepto">{inv.concepto}</span>
                      <span className="inv-badge" style={{ color: est.color, background: est.color + "16" }}>{est.label}</span>
                      <span className="pay-monto">{fmtMonto(inv.monto)}</span>
                    </div>
                    <div className="pay-cobertura">
                      <span className="cov-chip">Cobrado <b>{fmtMonto(abonado)}</b></span>
                      <span className="cov-chip">Saldo <b>{fmtMonto(saldo)}</b></span>
                      {inv.pdfUrl && (
                        <span
                          className="cov-chip cov-chip-link"
                          onClick={(e) => { e.stopPropagation(); window.open(inv.pdfUrl, "_blank", "noopener"); }}
                        >
                          <FileType size={11} /> Ver PDF
                        </span>
                      )}
                    </div>
                    {inv.nota && <div className="inv-nota"><StickyNote size={11} /> {inv.nota}</div>}
                  </button>
                );
              })}
            </div>
            {invoicesFiltradas.length > 3 && (
              <button type="button" className="btn-secondary admin-ver-mas" onClick={() => setFacturasShowAll((s) => !s)}>
                {facturasShowAll ? <>Ver menos</> : <>Ver más ({invoicesFiltradas.length - 3} más)</>}
              </button>
            )}
          </section>

          <section className="overview-section">
            <div className="overview-section-head admin-section-head">
              <span className="overview-section-title"><User size={15} /> Nómina</span>
              <div className="admin-section-actions">
                <div className="toolbar-select">
                  <CustomSelect
                    value={nominaFiltroMes}
                    onChange={setNominaFiltroMes}
                    options={[{ value: "Todos", label: "Todos los meses" }, ...nominaMesesDisponibles.map((m) => ({ value: m, label: monthLabelEs(m) }))]}
                  />
                </div>
                <button className="btn-primary" onClick={onNewNomina}><Plus size={14} /> Nuevo pago de nómina</button>
              </div>
            </div>
            <div className="summary-row-v2">
              <div className="summary-card-v2 tone-gold">
                <span className="summary-v2-icon"><CalendarDays size={17} /></span>
                <div className="summary-v2-body">
                  <span className="summary-v2-label">{nominaFiltroMes === "Todos" ? "Compromiso mensual" : `Nómina de ${monthLabelEs(nominaFiltroMes)}`}</span>
                  <span className="summary-v2-value">{fmtMonto(totalNominaMensual)}</span>
                </div>
              </div>
            </div>
            {nominaFiltrada.length === 0 && <div className="hint">No hay pagos de nómina para este filtro.</div>}
            <ExpenseTable items={nominaVisible} />
            {nominaFiltrada.length > 3 && (
              <button type="button" className="btn-secondary admin-ver-mas" onClick={() => setNominaShowAll((s) => !s)}>
                {nominaShowAll ? <>Ver menos</> : <>Ver más ({nominaFiltrada.length - 3} más)</>}
              </button>
            )}
          </section>

          <section className="overview-section">
            <div className="overview-section-head admin-section-head">
              <span className="overview-section-title"><Briefcase size={15} /> Gastos operativos</span>
              <div className="admin-section-actions">
                <div className="toolbar-select">
                  <CustomSelect
                    value={operativosFiltroMes}
                    onChange={setOperativosFiltroMes}
                    options={[{ value: "Todos", label: "Todos los meses" }, ...operativosMesesDisponibles.map((m) => ({ value: m, label: monthLabelEs(m) }))]}
                  />
                </div>
                <button className="btn-primary" onClick={() => onNewExpense("Herramienta / software")}><Plus size={14} /> Nuevo gasto</button>
              </div>
            </div>
            <div className="summary-row-v2">
              <div className="summary-card-v2 tone-purple">
                <span className="summary-v2-icon"><CalendarDays size={17} /></span>
                <div className="summary-v2-body">
                  <span className="summary-v2-label">{operativosFiltroMes === "Todos" ? "Compromiso mensual" : `Gastos de ${monthLabelEs(operativosFiltroMes)}`}</span>
                  <span className="summary-v2-value">{fmtMonto(totalOperativosMensual)}</span>
                </div>
              </div>
            </div>
            {operativosFiltrados.length === 0 && <div className="hint">No hay gastos operativos para este filtro.</div>}
            <ExpenseTable items={operativosVisibles} />
            {operativosFiltrados.length > 3 && (
              <button type="button" className="btn-secondary admin-ver-mas" onClick={() => setOperativosShowAll((s) => !s)}>
                {operativosShowAll ? <>Ver menos</> : <>Ver más ({operativosFiltrados.length - 3} más)</>}
              </button>
            )}
          </section>

          <PaymentInfoPanel setAppError={setAppError} />
          </>
        )}

        {subTab === "datos" && (
          <section className="overview-section">
            <div className="overview-section-head admin-section-head">
              <span className="overview-section-title"><KeyRound size={15} /> Datos de clientes</span>
              <div className="admin-section-actions">
                <button className="btn-primary" onClick={onNewAcceso}><Plus size={14} /> Nuevo acceso</button>
              </div>
            </div>
            {!credsRevealed && <div className="hint">Tu usuario no tiene el permiso "Ver claves guardadas" — las contraseñas se muestran ocultas.</div>}
            {accesos.length === 0 && <div className="hint">No hay accesos registrados.</div>}
            <div className="accesos-table">
              {accesos.length > 0 && (
                <div className="accesos-head">
                  <span>Cliente</span><span>Plataforma</span><span>Usuario</span><span>Clave</span>
                </div>
              )}
              {accesos.map((a) => (
                <AccesoRow key={a.id} acceso={a} onOpen={() => onOpenAcceso(a.id)} canReveal={credsRevealed} />
              ))}
            </div>
          </section>
        )}

        {subTab === "config" && (
          <>
            <section className="overview-section">
              <div className="overview-section-head admin-section-head">
                <span className="overview-section-title"><Building2 size={15} /> Empresas</span>
                <button type="button" className="btn-secondary" onClick={() => requirePerm("gestionarClientes", onAddClient)}>
                  <Plus size={13} /> Añadir cliente
                </button>
              </div>
              <div className="config-client-list">
                {CLIENTES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div className="config-client-row" key={c.name}>
                      <span className="config-client-name" style={{ color: c.color }}><Icon size={15} />{c.name}</span>
                      <button className="btn-secondary" onClick={() => onEditClient(c.name)}><Palette size={13} /> Editar apariencia</button>
                      <button className="btn-danger-ghost" onClick={() => setConfirmDeleteClient(c.name)}><Trash2 size={13} /> Eliminar cuenta</button>
                    </div>
                  );
                })}
              </div>
              <div className="hint hint-tip">Eliminar una empresa borra también todas sus tareas, pagos, inversión, notas, facturas y accesos. No se puede deshacer.</div>
            </section>

            <section className="overview-section">
              <div className="overview-section-head admin-section-head">
                <span className="overview-section-title"><Sparkles size={15} /> Datos de ejemplo</span>
              </div>
              <div className="hint hint-tip" style={{ marginBottom: 10 }}>
                Rellena o borra tareas, planificación, notas, pagos, facturas, accesos, gastos y tareas generales con
                información ficticia — elige la empresa y qué pestañas quieres afectar.
              </div>
              <label className="field" style={{ maxWidth: 280 }}>
                <span>Empresa</span>
                <CustomSelect
                  value={demoScopeClient}
                  onChange={setDemoScopeClient}
                  options={[
                    { value: "__ALL__", label: "Todas las empresas" },
                    ...CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color })),
                  ]}
                />
              </label>
              <div className="field">
                <span>Pestañas a afectar</span>
                <div className="demo-module-picker">
                  <button
                    type="button"
                    className={"pill" + (demoModules.length === DEMO_MODULE_KEYS.length ? " pill-active" : "")}
                    onClick={() => setDemoModules(demoModules.length === DEMO_MODULE_KEYS.length ? [] : DEMO_MODULE_KEYS)}
                  >
                    Todas
                  </button>
                  {DEMO_MODULES.map((m) => {
                    const active = demoModules.includes(m.key);
                    return (
                      <button
                        key={m.key} type="button" className={"pill" + (active ? " pill-active" : "")}
                        onClick={() => setDemoModules((prev) => (active ? prev.filter((k) => k !== m.key) : [...prev, m.key]))}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="demo-data-actions">
                <button type="button" className="btn-secondary" disabled={demoModules.length === 0} onClick={() => setConfirmLoadDemo(true)}>
                  <Sparkles size={13} /> Cargar datos de ejemplo
                </button>
                <button type="button" className="btn-danger-ghost" disabled={demoModules.length === 0} onClick={() => setConfirmDeleteDemo(true)}>
                  <Trash2 size={13} /> Borrar registros
                </button>
              </div>
              {demoModules.length === 0 && <div className="hint" style={{ marginTop: 6 }}>Elige al menos una pestaña.</div>}
            </section>

            <section className="overview-section">
              <div className="overview-section-head admin-section-head">
                <span className="overview-section-title"><History size={15} /> Historial de actividad</span>
              </div>
              {(activity || []).length === 0 ? (
                <div className="hint">Todavía no hay actividad registrada.</div>
              ) : (
                <button type="button" className="btn-danger-ghost" onClick={() => setConfirmClearHistory(true)}>
                  <Trash2 size={13} /> Limpiar historial ({(activity || []).length})
                </button>
              )}
            </section>

            {confirmDeleteClient && (
              <Overlay onClose={() => setConfirmDeleteClient(null)}>
                <div className="modal small confirm-warning-modal" style={{ maxWidth: 360 }}>
                  <div className="modal-head">
                    <h3><AlertTriangle size={16} color="#B4432F" /> ¿Eliminar {confirmDeleteClient}?</h3>
                    <button type="button" className="icon-btn" onClick={() => setConfirmDeleteClient(null)}><X size={16} /></button>
                  </div>
                  <p className="delete-client-warning">
                    Esta acción es permanente: se perderán todas sus tareas, pagos, inversión, notas, facturas y accesos. No se puede deshacer.
                  </p>
                  <button
                    className="btn-danger full" type="button"
                    onClick={() => requirePerm("gestionarClientes", () => { onDeleteClient(confirmDeleteClient); setConfirmDeleteClient(null); })}
                  >
                    Sí, quiero eliminarla
                  </button>
                </div>
              </Overlay>
            )}

            {confirmClearHistory && (
              <Overlay onClose={() => setConfirmClearHistory(false)}>
                <div className="modal small confirm-warning-modal" style={{ maxWidth: 340 }}>
                  <div className="modal-head">
                    <h3><AlertTriangle size={16} color="#B4432F" /> ¿Limpiar el historial?</h3>
                    <button type="button" className="icon-btn" onClick={() => setConfirmClearHistory(false)}><X size={16} /></button>
                  </div>
                  <p className="delete-client-warning">Se borrará todo el registro de actividad. No se puede deshacer.</p>
                  <button
                    className="btn-danger full" type="button"
                    onClick={() => requirePerm("eliminar", () => { onClearHistory(); setConfirmClearHistory(false); })}
                  >
                    Sí, limpiarlo
                  </button>
                </div>
              </Overlay>
            )}

            {confirmLoadDemo && (
              <Overlay onClose={() => setConfirmLoadDemo(false)}>
                <div className="modal small confirm-warning-modal" style={{ maxWidth: 360 }}>
                  <div className="modal-head">
                    <h3><AlertTriangle size={16} color="#C98A2C" /> ¿Cargar datos de ejemplo?</h3>
                    <button type="button" className="icon-btn" onClick={() => setConfirmLoadDemo(false)}><X size={16} /></button>
                  </div>
                  <p className="delete-client-warning">
                    Se reemplazará la información actual de <b>{DEMO_MODULES.filter((m) => demoModules.includes(m.key)).map((m) => m.label).join(", ")}</b>{" "}
                    con datos ficticios para {demoScopeClient === "__ALL__" ? "todas las empresas" : demoScopeClient}.
                    No se puede deshacer.
                  </p>
                  <button
                    className="btn-danger full" type="button"
                    onClick={() => requirePerm("datosEjemplo", () => { onLoadDemoData(demoScopeClient, demoModules); setConfirmLoadDemo(false); })}
                  >
                    Sí, cargarlos
                  </button>
                </div>
              </Overlay>
            )}

            {confirmDeleteDemo && (
              <Overlay onClose={() => setConfirmDeleteDemo(false)}>
                <div className="modal small confirm-warning-modal" style={{ maxWidth: 360 }}>
                  <div className="modal-head">
                    <h3><AlertTriangle size={16} color="#B4432F" /> ¿Borrar registros?</h3>
                    <button type="button" className="icon-btn" onClick={() => setConfirmDeleteDemo(false)}><X size={16} /></button>
                  </div>
                  <p className="delete-client-warning">
                    Se borrarán los registros de <b>{DEMO_MODULES.filter((m) => demoModules.includes(m.key)).map((m) => m.label).join(", ")}</b>{" "}
                    de {demoScopeClient === "__ALL__" ? "todas las empresas" : demoScopeClient}.
                    No se puede deshacer.
                  </p>
                  <button
                    className="btn-danger full" type="button"
                    onClick={() => requirePerm("datosEjemplo", () => { onDeleteDemoData(demoScopeClient, demoModules); setConfirmDeleteDemo(false); })}
                  >
                    Sí, borrarlos
                  </button>
                </div>
              </Overlay>
            )}
          </>
        )}

        {subTab === "usuarios" && (
          <>
            <UsersPanel
              users={users}
              currentUser={currentUser}
              can={can}
              onAddUser={onAddUser}
              onPatchUser={onPatchUser}
              onSaveAll={onSaveAll}
              onDeleteUser={onDeleteUser}
              requirePerm={requirePerm}
            />
            <GeminiKeyPanel geminiKey={geminiKey} onSaveKey={onSaveGeminiKey} can={can} requirePerm={requirePerm} />
            <DriveConnectionPanel connected={driveConnected} onToggle={onToggleDriveConnected} can={can} requirePerm={requirePerm} />
          </>
        )}

        {subTab === "backup" && (
          <BackupPanel lastBackupDate={lastBackupDate} onRunBackup={onRunBackup} onRunWorkDriveBackup={onRunWorkDriveBackup} onRestoreBackup={onRestoreBackup} can={can} requirePerm={requirePerm} />
        )}
      </main>
    </div>
  );
}
