import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  History,
  LayoutGrid,
  ListChecks,
  Menu,
  Plus,
  Printer,
  Search,
  StickyNote,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import "./styles/index.css";
import { AccesoModal, NewAccesoModal } from "./components/admin/AccesosTab";
import { AdminModule } from "./components/admin/AdminModule";
import { ExpenseModal, NewExpenseModal } from "./components/admin/ExpensesTab";
import { InvoiceModal, NewInvoiceModal } from "./components/admin/InvoicesTab";
import { AIChatButton, AIChatPanel } from "./components/ai/AIChatPanel";
import { CustomSelect } from "./components/common/CustomSelect";
import { GlobalSearchModal, SidebarSearchBox } from "./components/common/GlobalSearch";
import { HistoryModal } from "./components/common/HistoryModal";
import { ImagePreviewModal } from "./components/common/ImagePreviewModal";
import { NotificationsPanel } from "./components/common/NotificationsPanel";
import { PermissionDeniedModal } from "./components/common/PermissionDeniedModal";
import { AddClientModal, EditClientModal } from "./components/dashboard/AddEditClientModal";
import { CalendarioView } from "./components/dashboard/CalendarioView";
import { InversionModal, NewInversionModal } from "./components/dashboard/InversionesModal";
import { NewPaymentModal } from "./components/dashboard/NewPaymentModal";
import { NewPostModal } from "./components/dashboard/NewPostModal";
import { OverviewView } from "./components/dashboard/OverviewView";
import { NewSaldoFavorModal, PagosView } from "./components/dashboard/PagosView";
import { PaymentModal } from "./components/dashboard/PaymentModal";
import { PostModal } from "./components/dashboard/PostModal";
import { LoginExitOverlay, LoginScreen } from "./components/layout/LoginScreen";
import { HeaderUserButton, Sidebar } from "./components/layout/Sidebar";
import { NotesView } from "./components/notes/NotesView";
import { NewDebtModal } from "./components/task/NewDebtModal";
import { NewTareaGeneralModal } from "./components/task/NewTareaGeneralModal";
import { NewTaskModal } from "./components/task/NewTaskModal";
import { TareaGeneralModal } from "./components/task/TareaGeneralModal";
import { TareasGeneralesView } from "./components/task/TareasGeneralesView";
import { TaskCard } from "./components/task/TaskCard";
import { TaskModal } from "./components/task/TaskModal";
import { useAI } from "./hooks/useAI";
import { useAccesos } from "./hooks/useAccesos";
import { useActivity } from "./hooks/useActivity";
import { useAuth } from "./hooks/useAuth";
import { useBackup } from "./hooks/useBackup";
import { useClients } from "./hooks/useClients";
import { useDebts } from "./hooks/useDebts";
import { useExpenses } from "./hooks/useExpenses";
import { useInversiones } from "./hooks/useInversiones";
import { useInvoices } from "./hooks/useInvoices";
import { useNotes } from "./hooks/useNotes";
import { usePayments } from "./hooks/usePayments";
import { usePermissions } from "./hooks/usePermissions";
import { usePosts } from "./hooks/usePosts";
import { useTareasGenerales } from "./hooks/useTareasGenerales";
import { useTasks } from "./hooks/useTasks";
import { demoAccesos, demoExpenses, demoInversiones, demoInvoices, demoNotes, demoPayments, demoPosts, demoTareasGenerales, demoTasks } from "./services/data.service";
import { CLIENTES, DEMO_MODULES, DEMO_MODULE_KEYS, DISENADORES, ESTADOS, EXPENSE_CATEGORIAS, FORMATOS, PRIMARY_DEFAULT, REDES } from "./utils/constants";
import { clientMeta, darkenHex, daysUntil, fmtDate, hasUnreadComments, hexToRgba, monthLabelEs, tagColor } from "./utils/helpers";

function App() {
  const [appError, setAppError] = useState("");

  const { users, currentUser, currentUserId, showLoginOverlay, loginOverlayExiting, loginAs, logout, addUser, patchUser, deleteUser } = useAuth(
    (text) => logActivity(text), (msg) => setAppError(msg)
  );
  const { can, requestPermission, permDeniedLabel, setPermDeniedLabel } = usePermissions(currentUser);
  const { activity, logActivity, clearActivity, commentReads, markTaskSeen } = useActivity(currentUser);

  const {
    tasks, updateTasks, addTask, patchTask, deleteTask, restoreTask, purgeTask, openTaskId, setOpenTaskId,
  } = useTasks(logActivity, setAppError);
  const {
    payments, updatePayments, addPayment, patchPayment, deletePayment, restorePayment, purgePayment,
    openPaymentId, setOpenPaymentId,
  } = usePayments(logActivity, setAppError);
  const {
    posts, updatePosts, addPost, patchPost, deletePost, restorePost, purgePost, openPostId, setOpenPostId,
  } = usePosts(logActivity, setAppError);
  const {
    debts, updateDebts, addDebt, resolveDebt,
    saldosFavor, updateSaldosFavor, addSaldoFavor, removeSaldoFavor,
  } = useDebts(logActivity, setAppError);
  const { notes, updateNotes, addNote, patchNote, trashNote, restoreNote, purgeNote } = useNotes(logActivity, setAppError);
  const {
    invoices, updateInvoices, addInvoice, patchInvoice, deleteInvoice, openInvoiceId, setOpenInvoiceId,
  } = useInvoices(logActivity, setAppError);
  const {
    expenses, updateExpenses, addExpense, patchExpense, deleteExpense,
    openExpenseId, setOpenExpenseId, newExpenseCategoria, setNewExpenseCategoria,
  } = useExpenses(logActivity, setAppError);
  const {
    accesos, updateAccesos, addAcceso, patchAcceso, deleteAcceso, openAccesoId, setOpenAccesoId,
  } = useAccesos(logActivity, setAppError);
  const {
    inversiones, updateInversiones, addInversion, patchInversion, deleteInversion,
    openInversionId, setOpenInversionId,
  } = useInversiones(logActivity, setAppError);
  const {
    tareasGenerales, updateTareasGenerales, addTareaGeneral, patchTareaGeneral, deleteTareaGeneral,
    openTareaGeneralId, setOpenTareaGeneralId,
  } = useTareasGenerales(logActivity, setAppError);

  const {
    geminiKey, saveGeminiKey, aiMessages, aiSending, aiError,
    showAIChat, setShowAIChat, sendAIMessage, clearAIChat,
  } = useAI(logActivity);
  const { driveConnected, toggleDriveConnected, lastBackupDate, runBackup, restoreBackup } = useBackup(logActivity);

  const [selectedClient, setSelectedClient] = useState("__ALL__");
  const {
    clientsBump, addClient, editClient, deleteClientCompletely,
  } = useClients({
    tasks, payments, posts, notes, debts, invoices, accesos,
    updateTasks, updatePayments, updatePosts, updateNotes, updateDebts, updateInvoices, updateAccesos,
    selectedClient, setSelectedClient, logActivity, setAppError,
  });

  function handleRunBackup() {
    runBackup({ tasks, payments, posts, debts, notes, tareasGenerales, inversiones, invoices, expenses, accesos });
  }
  function handleRestoreBackup(payload) {
    return restoreBackup(payload, {
      setTasks: updateTasks, setPayments: updatePayments, setPosts: updatePosts, setDebts: updateDebts,
      setNotes: updateNotes, setTareasGenerales: updateTareasGenerales, setInversiones: updateInversiones,
      setInvoices: updateInvoices, setExpenses: updateExpenses, setAccesos: updateAccesos,
    });
  }
  function handleSendAIMessage(text) {
    return sendAIMessage(text, {
      selectedClient, tasks, payments, inversiones, debts, posts, notes, tareasGenerales,
      invoices, expenses, canSeeAdmin: can("administrativo"),
    });
  }

  const [activeTab, setActiveTab] = useState("flujo");
  const [columnVisibleCounts, setColumnVisibleCounts] = useState({});
  useEffect(() => {
    const activeBtn = document.querySelector(".tabbar .tab-active");
    if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeTab]);

  const TAB_ORDER = ["tareas", "flujo", "calendario", "notas", "pagos"];
  const tabSwipeStartX = useRef(null);
  function onTabTouchStart(e) { tabSwipeStartX.current = e.touches[0].clientX; }
  function onTabTouchEnd(e) {
    if (tabSwipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - tabSwipeStartX.current;
    tabSwipeStartX.current = null;
    if (Math.abs(dx) < 40) return; // gesto demasiado corto, lo ignoramos
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx === -1) return;
    if (dx < 0 && idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]); // deslizó a la izquierda -> siguiente
    else if (dx > 0 && idx > 0) setActiveTab(TAB_ORDER[idx - 1]); // deslizó a la derecha -> anterior
  }
  const [query, setQuery] = useState("");
  const [filterDesigner, setFilterDesigner] = useState("Todos");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(222);
  const sidebarRef = useRef(null);
  const [taskPreviewFile, setTaskPreviewFile] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showTaskTrash, setShowTaskTrash] = useState(false);
  const [showPostTrash, setShowPostTrash] = useState(false);
  const [showNotesTrash, setShowNotesTrash] = useState(false);
  const [showPaymentsTrash, setShowPaymentsTrash] = useState(false);
  const [pagosMesFiltro, setPagosMesFiltro] = useState("todos");
  const [pagosSearch, setPagosSearch] = useState("");
  const [showPagosReportPicker, setShowPagosReportPicker] = useState(false);
  const [calFilterRed, setCalFilterRed] = useState("Todas");
  const [calFilterFormato, setCalFilterFormato] = useState("Todos");
  const [calSearch, setCalSearch] = useState("");
  const [showCalReportPicker, setShowCalReportPicker] = useState(false);
  const [notesTagFilter, setNotesTagFilter] = useState("Todas");
  const [tareasFilterPersona, setTareasFilterPersona] = useState("Todos");
  const [tareasSearch, setTareasSearch] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [editClientTarget, setEditClientTarget] = useState(null);
  const [showNewDebt, setShowNewDebt] = useState(false);
  const [showNewSaldoFavor, setShowNewSaldoFavor] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [adminView, setAdminView] = useState(false);
  const [showNewTareaGeneral, setShowNewTareaGeneral] = useState(false);
  const [showNewInversion, setShowNewInversion] = useState(false);
  const [showNewAcceso, setShowNewAcceso] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);

  function goToSearchResult(r) {
    setShowGlobalSearch(false);
    setAdminView(false);
    if (r.type === "tarea") {
      setSelectedClient(r.empresa); setActiveTab("flujo"); setOpenTaskId(r.id);
    } else if (r.type === "nota") {
      setSelectedClient(r.empresa); setActiveTab("notas");
    } else if (r.type === "pago") {
      setSelectedClient(r.empresa); setActiveTab("pagos"); setOpenPaymentId(r.id);
    } else if (r.type === "post") {
      setSelectedClient(r.empresa); setActiveTab("calendario"); setOpenPostId(r.id);
    } else if (r.type === "tareaGeneral") {
      if (selectedClient === "__ALL__") setSelectedClient(CLIENTES[0].name);
      setActiveTab("tareas"); setOpenTareaGeneralId(r.id);
    } else if (r.type === "factura") {
      setAdminView(true); setOpenInvoiceId(r.id);
    } else if (r.type === "acceso") {
      setAdminView(true); setOpenAccesoId(r.id);
    }
  }

  useEffect(() => {
    /* Safari/iOS detecta automáticamente números sueltos ("1.15", "1.5", "2.5")
       como si fueran teléfonos y los convierte en links azules subrayados.
       Esto rompía la coherencia visual del menú de Interlineado/Interletrado
       (las opciones numéricas se veían distintas a "Sencillo"/"Doble").
       Se desactiva explícitamente esa detección para toda la app. */
    let meta = document.querySelector('meta[name="format-detection"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "format-detection";
      document.head.appendChild(meta);
    }
    meta.content = "telephone=no, date=no, address=no, email=no";
  }, []);

  useLayoutEffect(() => {
    // En vez de asumir el ancho de la barra lateral (222px / 72px), lo medimos de
    // verdad en pantalla. Así los pop-ups quedan centrados respecto al área de
    // contenido visible sin importar si algo externo (el panel de vista previa,
    // el margen del navegador, etc.) desplaza un poco el layout.
    function measureSidebar() {
      const el = document.querySelector(".sidebar");
      if (el) setSidebarOffset(el.getBoundingClientRect().right);
    }
    measureSidebar();
    window.addEventListener("resize", measureSidebar);
    // La barra lateral tiene una transición de ancho al expandir/contraer; volvemos
    // a medir cuando termina para no quedarnos con el valor a mitad de la animación.
    const t = setTimeout(measureSidebar, 220);
    return () => { window.removeEventListener("resize", measureSidebar); clearTimeout(t); };
  }, [collapsed]);

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === "Escape") setShowGlobalSearch(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function openAdmin() {
    requestPermission("administrativo", () => setAdminView(true));
  }
  function loadDemoDataAll(scopeClient, modules) {
    // Fuerza a que se usen los datos de ejemplo actuales en vez de lo que ya
    // estuviera guardado en el almacenamiento (que siempre tiene prioridad al cargar).
    // Si se pasa una empresa puntual, solo se reemplaza esa porción y se conserva
    // el resto tal cual estaba. "modules" filtra qué pestañas se tocan.
    try {
      const scope = scopeClient || "__ALL__";
      const mods = modules && modules.length ? modules : DEMO_MODULE_KEYS;
      const scopeNames = scope === "__ALL__" ? CLIENTES.map((c) => c.name) : [scope];
      const inScope = (arr) => (arr || []).filter((x) => scopeNames.includes(x.empresa));
      const mergeIn = (current, fresh) => [...(current || []).filter((x) => !scopeNames.includes(x.empresa)), ...fresh];

      if (mods.includes("tasks")) updateTasks(mergeIn(tasks, inScope(demoTasks())));
      if (mods.includes("posts")) updatePosts(mergeIn(posts, inScope(demoPosts())));
      if (mods.includes("notes")) updateNotes(mergeIn(notes, inScope(demoNotes())));
      if (mods.includes("payments")) {
        updatePayments(mergeIn(payments, inScope(demoPayments())));
        updateInversiones(mergeIn(inversiones, inScope(demoInversiones())));
      }
      if (mods.includes("invoices")) updateInvoices(mergeIn(invoices, inScope(demoInvoices())));
      if (mods.includes("accesos")) updateAccesos(mergeIn(accesos, inScope(demoAccesos())));
      // Gastos y tareas generales no están ligados a un cliente: se cargan completos si están seleccionados, sin importar la empresa elegida.
      if (mods.includes("tareasGenerales")) updateTareasGenerales(demoTareasGenerales());
      if (mods.includes("expenses")) updateExpenses(demoExpenses());

      const modLabels = DEMO_MODULES.filter((m) => mods.includes(m.key)).map((m) => m.label).join(", ");
      logActivity(`Se cargaron datos de ejemplo (${modLabels}) para ${scope === "__ALL__" ? "todas las empresas" : scope}`);
    } catch (e) {
      setAppError("No se pudieron cargar los datos de ejemplo: " + (e && e.message ? e.message : e));
    }
  }
  function deleteDemoData(scopeClient, modules) {
    // Borra registros de los módulos seleccionados para el alcance elegido.
    try {
      const scope = scopeClient || "__ALL__";
      const mods = modules && modules.length ? modules : DEMO_MODULE_KEYS;
      const scopeNames = scope === "__ALL__" ? CLIENTES.map((c) => c.name) : [scope];
      const strip = (arr) => (arr || []).filter((x) => !scopeNames.includes(x.empresa));

      if (mods.includes("tasks")) updateTasks(strip(tasks));
      if (mods.includes("posts")) updatePosts(strip(posts));
      if (mods.includes("notes")) updateNotes(strip(notes));
      if (mods.includes("payments")) {
        updatePayments(strip(payments));
        updateInversiones(strip(inversiones));
      }
      if (mods.includes("invoices")) updateInvoices(strip(invoices));
      if (mods.includes("accesos")) updateAccesos(strip(accesos));
      if (mods.includes("tareasGenerales")) updateTareasGenerales([]);
      if (mods.includes("expenses")) updateExpenses([]);

      const modLabels = DEMO_MODULES.filter((m) => mods.includes(m.key)).map((m) => m.label).join(", ");
      logActivity(`Se borraron registros (${modLabels}) de ${scope === "__ALL__" ? "todas las empresas" : scope}`);
    } catch (e) {
      setAppError("No se pudieron borrar los registros: " + (e && e.message ? e.message : e));
    }
  }
  function openEditClient(name) {
    requestPermission("gestionarClientes", () => { setEditClientTarget(name || selectedClient); setShowEditClient(true); });
  }
  function selectClientAndExitAdmin(name) {
    setAdminView(false);
    setSelectedClient(name);
  }


  const clientCounts = useMemo(() => {
    const map = Object.fromEntries(CLIENTES.map((c) => [c.name, 0]));
    (tasks || []).forEach((t) => { if (map[t.empresa] !== undefined && t.estado !== "listo") map[t.empresa]++; });
    return map;
  }, [tasks]);

  const notifications = useMemo(() => {
    return (tasks || [])
      .filter((t) => t.estado !== "listo")
      .map((t) => ({ task: t, days: daysUntil(t.fechaEntrega) }))
      .filter((x) => x.days !== null && x.days <= 3)
      .sort((a, b) => a.days - b.days)
      .slice(0, 30);
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (t.deletedAt) return false;
      const matchesClient = selectedClient === "__ALL__" || t.empresa === selectedClient;
      const matchesQ = !q || t.titulo.toLowerCase().includes(q) || t.empresa.toLowerCase().includes(q);
      const matchesD = filterDesigner === "Todos" || t.asignado === filterDesigner;
      return matchesClient && matchesQ && matchesD;
    });
  }, [tasks, query, filterDesigner, selectedClient]);

  const trashedTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter((t) => (selectedClient === "__ALL__" || t.empresa === selectedClient) && t.deletedAt)
      .sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || ""));
  }, [tasks, selectedClient]);

  const openTask = tasks ? tasks.find((t) => t.id === openTaskId) : null;
  const defaultClientForNew = selectedClient === "__ALL__" ? CLIENTES[0].name : selectedClient;
  const accent = selectedClient === "__ALL__" ? PRIMARY_DEFAULT : clientMeta(selectedClient).color;
  const TopIcon = selectedClient === "__ALL__" ? LayoutGrid : clientMeta(selectedClient).icon;
  const topbarColored = true;
  const topbarBg = selectedClient === "__ALL__" ? undefined : `linear-gradient(115deg, ${darkenHex(accent, 0.55)} 0%, ${darkenHex(accent, 0.3)} 30%, ${accent} 100%)`;
  const watermarkColor = selectedClient === "__ALL__" ? "rgba(255,255,255,0.16)" : hexToRgba(darkenHex(accent, 0.22), 0.35);

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments
      .filter((p) => (selectedClient === "__ALL__" || p.empresa === selectedClient) && !p.deletedAt)
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }, [payments, selectedClient]);

  const trashedPayments = useMemo(() => {
    if (!payments) return [];
    return payments
      .filter((p) => (selectedClient === "__ALL__" || p.empresa === selectedClient) && p.deletedAt)
      .sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));
  }, [payments, selectedClient]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts
      .filter((p) => (selectedClient === "__ALL__" || p.empresa === selectedClient) && !p.deletedAt)
      .sort((a, b) => (a.fecha === b.fecha ? (a.hora || "").localeCompare(b.hora || "") : a.fecha < b.fecha ? 1 : -1));
  }, [posts, selectedClient]);

  const trashedPosts = useMemo(() => {
    if (!posts) return [];
    return posts
      .filter((p) => (selectedClient === "__ALL__" || p.empresa === selectedClient) && p.deletedAt)
      .sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || ""));
  }, [posts, selectedClient]);

  const openPayment = payments ? payments.find((p) => p.id === openPaymentId) : null;
  const openPost = posts ? posts.find((p) => p.id === openPostId) : null;
  const filteredDebts = useMemo(() => {
    if (!debts) return [];
    return debts
      .filter((d) => selectedClient === "__ALL__" || d.empresa === selectedClient)
      .sort((a, b) => (a.fecha || "") < (b.fecha || "") ? 1 : -1);
  }, [debts, selectedClient]);
  const filteredSaldosFavor = useMemo(() => {
    if (!saldosFavor) return [];
    return saldosFavor
      .filter((s) => selectedClient === "__ALL__" || s.empresa === selectedClient)
      .sort((a, b) => (a.fecha || "") < (b.fecha || "") ? 1 : -1);
  }, [saldosFavor, selectedClient]);

  const filteredInversiones = useMemo(() => {
    if (!inversiones) return [];
    return inversiones.filter((i) => selectedClient === "__ALL__" || i.empresa === selectedClient);
  }, [inversiones, selectedClient]);

  const pagosMesesDisponibles = useMemo(() => {
    const set = new Set([
      ...filteredPayments.map((p) => p.fecha.slice(0, 7)),
      ...(filteredInversiones || []).map((i) => i.fecha.slice(0, 7)),
    ]);
    return [...set].sort().reverse();
  }, [filteredPayments, filteredInversiones]);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    return notes
      .filter((n) => (selectedClient === "__ALL__" || n.empresa === selectedClient) && !n.deletedAt)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [notes, selectedClient]);

  const availableNoteTags = useMemo(() => {
    const set = new Set();
    filteredNotes.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return [...set];
  }, [filteredNotes]);

  const trashedNotes = useMemo(() => {
    if (!notes) return [];
    return notes
      .filter((n) => (selectedClient === "__ALL__" || n.empresa === selectedClient) && n.deletedAt)
      .sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || ""));
  }, [notes, selectedClient]);

  if (currentUserId === undefined || users === null) {
    // Todavía cargando la sesión guardada — no mostramos nada para evitar un parpadeo
    // entre "pantalla de login" y "dashboard" mientras se resuelve.
    return <div className="app" style={{ background: "var(--bg)" }} />;
  }
  if (!currentUser) {
    return (
      <div className="app" style={{ background: "var(--bg)" }}>
        <LoginScreen users={users} onLogin={loginAs} />
      </div>
    );
  }

  return (
    <>
    <div
      className="app app-enter"
      style={{ "--sidebar-width": `${sidebarOffset}px` }}
      onAnimationEnd={(e) => {
        // El "filter: blur(...)" de esta animación de entrada, mientras sigue aplicado (aunque
        // sea blur(0)), crea sin querer un nuevo "contenedor" para los elementos position:fixed
        // de adentro — eso hacía que los pop-ups (que deberían quedar fijos en pantalla) se
        // movieran junto con el scroll de la página en vez de quedarse quietos. Al sacar la
        // clase apenas termina la animación, se libera ese filtro y los pop-ups vuelven a fijarse
        // correctamente a la ventana.
        if (e.animationName === "appFadeIn" && e.target === e.currentTarget) e.currentTarget.classList.remove("app-enter");
      }}
    >

      <Sidebar
        selected={selectedClient}
        onSelect={(name) => { selectClientAndExitAdmin(name); setMobileSidebarOpen(false); }}
        counts={clientCounts}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onOpenHistory={() => { setShowHistory(true); setMobileSidebarOpen(false); }}
        onOpenAdmin={() => { openAdmin(); setMobileSidebarOpen(false); }}
        adminActive={adminView}
        currentUser={currentUser}
        onLogout={logout}
        onSelectSearchResult={goToSearchResult}
        searchData={{
          tasks: tasks || [], notes: notes || [], payments: payments || [], invoices: invoices || [],
          posts: posts || [], tareasGenerales: tareasGenerales || [], accesos: accesos || [],
        }}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="main" style={{ "--primary": accent, "--tint": hexToRgba(accent, 0.05) }}>
        {adminView ? (
          <AdminModule
            invoices={invoices || []}
            expenses={expenses || []}
            onOpenInvoice={(id) => setOpenInvoiceId(id)}
            onNewInvoice={() => setShowNewInvoice(true)}
            onOpenExpense={(id) => setOpenExpenseId(id)}
            onNewExpense={(cat) => { setNewExpenseCategoria(cat || EXPENSE_CATEGORIAS[0]); setShowNewExpense(true); }}
            accesos={accesos || []}
            onOpenAcceso={(id) => setOpenAccesoId(id)}
            onNewAcceso={() => setShowNewAcceso(true)}
            clientsBump={clientsBump}
            onDeleteClient={deleteClientCompletely}
            activity={activity || []}
            onClearHistory={clearActivity}
            onLoadDemoData={loadDemoDataAll}
            onDeleteDemoData={deleteDemoData}
            can={can}
            users={users || []}
            currentUser={currentUser}
            onAddUser={addUser}
            onPatchUser={patchUser}
            onDeleteUser={deleteUser}
            geminiKey={geminiKey}
            onSaveGeminiKey={saveGeminiKey}
            driveConnected={driveConnected}
            onToggleDriveConnected={toggleDriveConnected}
            onAddClient={() => setShowAddClient(true)}
            onEditClient={openEditClient}
            lastBackupDate={lastBackupDate}
            onRunBackup={handleRunBackup}
            onRestoreBackup={handleRestoreBackup}
            onOpenMobileMenu={() => setMobileSidebarOpen(true)}
            onLogout={logout}
          />
        ) : (
        <>
        {appError && (
          <div className="app-error">
            <AlertTriangle size={14} /> {appError}
            <button className="app-error-close" onClick={() => setAppError("")}><X size={13} /></button>
          </div>
        )}
        <header className={"topbar topbar-colored" + (selectedClient === "__ALL__" ? " topbar-all-accounts" : "")} style={{ background: topbarBg }}>
          <button type="button" className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(true)} title="Menú">
            <Menu size={20} />
          </button>
          <span className="mobile-brand-mark">publi<span className="brand-b">B</span>e</span>
          <HeaderUserButton currentUser={currentUser} onLogout={logout} />
          {selectedClient !== "__ALL__" && (
            <span className="topbar-watermark-clip"><span className="topbar-watermark" style={{ color: watermarkColor }}><TopIcon size={110} strokeWidth={1.4} /></span></span>
          )}
          <div className="topbar-title">
            <div>
              <h1>{selectedClient === "__ALL__" ? "Dashboard general" : selectedClient}</h1>
              <span className="topbar-sub">
                {selectedClient === "__ALL__" ? "Vista general del estudio" : "Panel del cliente"}
              </span>
            </div>
          </div>

          <div className="controls">
            {activeTab === "tareas" && (
              <>
                <div className="search">
                  <Search size={15} />
                  <input placeholder="Buscar tarea, categoría…" value={tareasSearch} onChange={(e) => setTareasSearch(e.target.value)} />
                </div>
                <div className="toolbar-select">
                  <CustomSelect
                    value={tareasFilterPersona}
                    onChange={setTareasFilterPersona}
                    options={[{ value: "Todos", label: "Elegir usuario" }, ...DISENADORES.map((d) => ({ value: d, label: d }))]}
                  />
                </div>
                <button className="btn-primary" onClick={() => setShowNewTareaGeneral(true)}>
                  <Plus size={16} strokeWidth={2.5} /> Nueva tarea
                </button>
              </>
            )}
            {selectedClient !== "__ALL__" && activeTab === "flujo" && (
              <>
                <div className="search">
                  <Search size={15} />
                  <input placeholder="Buscar tarea…" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <div className="toolbar-select">
                  <CustomSelect
                    value={filterDesigner}
                    onChange={setFilterDesigner}
                    options={[{ value: "Todos", label: "Elegir usuario" }, ...DISENADORES.map((d) => ({ value: d, label: d }))]}
                  />
                </div>
                <div className="header-btn-row">
                  <button className="btn-primary" onClick={() => setShowNew(true)}>
                    <Plus size={16} strokeWidth={2.5} /> Nueva tarea
                  </button>
                  <button type="button" className="notes-trash-toggle" onClick={() => setShowTaskTrash((s) => !s)}>
                    <Trash2 size={13} /> {showTaskTrash ? "Volver a Creativos" : `Papelera${trashedTasks.length ? ` (${trashedTasks.length})` : ""}`}
                  </button>
                </div>
              </>
            )}
            {selectedClient !== "__ALL__" && activeTab === "pagos" && (
              <>
                <div className="toolbar-select">
                  <CustomSelect
                    value={pagosMesFiltro}
                    onChange={setPagosMesFiltro}
                    options={[{ value: "todos", label: "Todos los meses" }, ...pagosMesesDisponibles.map((m) => ({ value: m, label: monthLabelEs(m) }))]}
                  />
                </div>
                <div className="search">
                  <Search size={15} />
                  <input placeholder="Buscar por fecha, mes, monto, método…" value={pagosSearch} onChange={(e) => setPagosSearch(e.target.value)} />
                  {pagosSearch && <button type="button" className="icon-btn subtle" onClick={() => setPagosSearch("")}><X size={13} /></button>}
                </div>
                <button className="btn-primary" onClick={() => setShowNewPayment(true)}>
                  <Plus size={16} strokeWidth={2.5} /> Nuevo pago
                </button>
                <div className="header-btn-row">
                  <button type="button" className="btn-secondary" onClick={() => setShowPagosReportPicker(true)}>
                    <Printer size={13} /> Compartir info
                  </button>
                  <button type="button" className="notes-trash-toggle" onClick={() => setShowPaymentsTrash((s) => !s)}>
                    <Trash2 size={13} /> {showPaymentsTrash ? "Volver a Pagos" : `Papelera${trashedPayments.length ? ` (${trashedPayments.length})` : ""}`}
                  </button>
                </div>
              </>
            )}
            {selectedClient !== "__ALL__" && activeTab === "calendario" && (
              <>
                <div className="search">
                  <Search size={15} />
                  <input placeholder="Buscar por tema, título, fecha, mes…" value={calSearch} onChange={(e) => setCalSearch(e.target.value)} />
                  {calSearch && <button type="button" className="icon-btn subtle" onClick={() => setCalSearch("")}><X size={13} /></button>}
                </div>
                <div className="toolbar-select">
                  <CustomSelect
                    value={calFilterRed}
                    onChange={setCalFilterRed}
                    options={[{ value: "Todas", label: "Plataforma" }, ...REDES.map((r) => ({ value: r.name, label: r.name, icon: r.icon, color: r.color }))]}
                  />
                </div>
                <div className="toolbar-select">
                  <CustomSelect
                    value={calFilterFormato}
                    onChange={setCalFilterFormato}
                    options={[{ value: "Todos", label: "Tipo de contenido" }, ...FORMATOS.map((f) => ({ value: f, label: f }))]}
                  />
                </div>
                <button className="btn-primary" onClick={() => setShowNewPost(true)}>
                  <Plus size={16} strokeWidth={2.5} /> Nueva publicación
                </button>
                <div className="header-btn-row">
                  <button type="button" className="btn-secondary" onClick={() => setShowCalReportPicker(true)}>
                    <Printer size={13} /> Compartir info
                  </button>
                  <button type="button" className="notes-trash-toggle" onClick={() => setShowPostTrash((s) => !s)}>
                    <Trash2 size={13} /> {showPostTrash ? "Volver a Planificación" : `Papelera${trashedPosts.length ? ` (${trashedPosts.length})` : ""}`}
                  </button>
                </div>
              </>
            )}
            {selectedClient !== "__ALL__" && activeTab === "notas" && (
              <div className="header-btn-row">
                {availableNoteTags.length > 0 && (
                  <div className="toolbar-select">
                    <CustomSelect
                      value={notesTagFilter}
                      onChange={setNotesTagFilter}
                      options={[{ value: "Todas", label: "Todas las etiquetas" }, ...availableNoteTags.map((t) => ({ value: t, label: t, color: tagColor(t) }))]}
                    />
                  </div>
                )}
                <button type="button" className="notes-trash-toggle" onClick={() => setShowNotesTrash((s) => !s)}>
                  <Trash2 size={13} /> {showNotesTrash ? "Volver a Notas" : `Papelera${trashedNotes.length ? ` (${trashedNotes.length})` : ""}`}
                </button>
              </div>
            )}
            {selectedClient === "__ALL__" && activeTab !== "tareas" && (
              <div className="all-accounts-search-row">
                <SidebarSearchBox
                  variant="header"
                  onSelect={goToSearchResult}
                  tasks={tasks || []}
                  notes={notes || []}
                  payments={payments || []}
                  invoices={invoices || []}
                  posts={posts || []}
                  tareasGenerales={tareasGenerales || []}
                  accesos={accesos || []}
                />
              </div>
            )}
          </div>
          <button
            type="button"
            className={"header-bell-btn" + (selectedClient !== "__ALL__" ? " header-bell-mobile-hide" : "")}
            onClick={() => setShowNotifications((s) => !s)}
            title="Notificaciones"
          >
            <Bell size={16} />
            {notifications.length > 0 && <span className="notif-bell-badge">{notifications.length}</span>}
          </button>
        </header>

        {showNotifications && (
          <NotificationsPanel
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onSelectTask={(t) => { setShowNotifications(false); setSelectedClient(t.empresa); setActiveTab("flujo"); setOpenTaskId(t.id); }}
          />
        )}

        {selectedClient === "__ALL__" ? (
          <OverviewView
            tasks={tasks || []} payments={payments || []} debts={debts || []} posts={posts || []}
            tareasGenerales={tareasGenerales || []}
            onSelectClient={setSelectedClient}
            onOpenTareaGeneral={(id) => setOpenTareaGeneralId(id)}
          />
        ) : (
        <>
        <div className="tabbar" onTouchStart={onTabTouchStart} onTouchEnd={onTabTouchEnd}>
          <button className={"tab" + (activeTab === "tareas" ? " tab-active" : "")} onClick={() => setActiveTab("tareas")}>
            <ListChecks size={14} /> Tareas
          </button>
          <button className={"tab" + (activeTab === "flujo" ? " tab-active" : "")} onClick={() => setActiveTab("flujo")}>
            <LayoutGrid size={14} /> Creativos
          </button>
          <button className={"tab" + (activeTab === "calendario" ? " tab-active" : "")} onClick={() => setActiveTab("calendario")}>
            <CalendarDays size={14} /> Planificación
          </button>
          <button className={"tab" + (activeTab === "notas" ? " tab-active" : "")} onClick={() => setActiveTab("notas")}>
            <StickyNote size={14} /> Notas
          </button>
          <button className={"tab" + (activeTab === "pagos" ? " tab-active" : "")} onClick={() => setActiveTab("pagos")}>
            <Wallet size={14} /> Pagos publicitarios
          </button>
        </div>

        {activeTab === "flujo" && showTaskTrash && (
          <main className="pane">
            <div className="pay-table">
              {trashedTasks.length === 0 && <div className="hint">La papelera de Creativos está vacía.</div>}
              {trashedTasks.map((t) => {
                const daysLeft = 30 - Math.floor((Date.now() - new Date(t.deletedAt).getTime()) / 86400000);
                return (
                  <div className="pay-row" key={t.id}>
                    <div className="pay-row-top">
                      <span className="inv-concepto">{t.titulo}</span>
                      <span className="post-formato">{t.empresa}</span>
                      <span className="trash-days-left">Se elimina en {Math.max(0, daysLeft)} día(s)</span>
                    </div>
                    <div className="pay-cobertura">
                      <button type="button" className="btn-secondary" onClick={() => restoreTask(t.id)}><History size={12} /> Restaurar</button>
                      <button type="button" className="btn-danger-ghost" onClick={() => purgeTask(t.id)}><Trash2 size={12} /> Eliminar para siempre</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}
        {activeTab === "flujo" && !showTaskTrash && (
          <main className="board">
            {ESTADOS.map((col) => {
              const items = filtered.filter((t) => t.estado === col.id);
              const visibleCount = columnVisibleCounts[col.id] || 5;
              const visibleItems = items.slice(0, visibleCount);
              const Icon = col.icon;
              const isDragOver = dragOverCol === col.id;
              return (
                <section
                  className={"column" + (isDragOver ? " column-drop" : "")}
                  key={col.id}
                  onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                  onDragEnter={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                  onDragLeave={(e) => {
                    // Solo quitamos el resaltado si de verdad salimos de la columna,
                    // no cuando pasamos sobre una tarjeta hija dentro de ella.
                    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol((c) => (c === col.id ? null : c));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    setDraggingId(null);
                    const taskId = e.dataTransfer.getData("text/plain");
                    if (taskId) patchTask(taskId, { estado: col.id });
                  }}
                >
                  <div className="column-head">
                    <span className="col-dot" style={{ background: col.dot }} />
                    <Icon size={14} strokeWidth={2.2} />
                    <h2>{col.label}</h2>
                    <span className="count">{items.length}</span>
                  </div>
                  <div className="column-body">
                    {items.length === 0 && <div className="empty-col">Suelta aquí una tarea</div>}
                    {visibleItems.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onOpen={() => setOpenTaskId(t.id)}
                        showClient={selectedClient === "__ALL__"}
                        dragging={draggingId === t.id}
                        canDrag={draggingId === null || draggingId === t.id}
                        unread={hasUnreadComments(t, commentReads, currentUser)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", t.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(t.id);
                        }}
                        onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                      />
                    ))}
                    {items.length > visibleCount && (
                      <button
                        type="button"
                        className="column-show-more"
                        onClick={() => setColumnVisibleCounts((prev) => ({ ...prev, [col.id]: visibleCount + 5 }))}
                      >
                        Ver 5 más ({items.length - visibleCount} restantes)
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </main>
        )}

        {activeTab === "pagos" && (
          <PagosView
            payments={filteredPayments}
            trashedPayments={trashedPayments}
            debts={filteredDebts}
            saldosFavor={filteredSaldosFavor}
            inversiones={filteredInversiones}
            showClient={selectedClient === "__ALL__"}
            defaultClient={defaultClientForNew}
            onOpen={(id) => setOpenPaymentId(id)}
            onAddDebt={() => setShowNewDebt(true)}
            onResolveDebt={resolveDebt}
            onAddSaldoFavor={() => setShowNewSaldoFavor(true)}
            onRemoveSaldoFavor={removeSaldoFavor}
            onNewInversion={() => setShowNewInversion(true)}
            onOpenInversion={(id) => setOpenInversionId(id)}
            onRestorePayment={restorePayment}
            onPurgePayment={purgePayment}
            showTrash={showPaymentsTrash}
            mesFiltro={pagosMesFiltro}
            search={pagosSearch}
            showReportPicker={showPagosReportPicker}
            onCloseReportPicker={() => setShowPagosReportPicker(false)}
          />
        )}

        {activeTab === "calendario" && showPostTrash && (
          <main className="pane">
            <div className="pay-table">
              {trashedPosts.length === 0 && <div className="hint">La papelera de Planificación está vacía.</div>}
              {trashedPosts.map((p) => {
                const daysLeft = 30 - Math.floor((Date.now() - new Date(p.deletedAt).getTime()) / 86400000);
                return (
                  <div className="pay-row" key={p.id}>
                    <div className="pay-row-top">
                      <span className="inv-concepto">{p.titulo}</span>
                      <span className="post-formato">{p.empresa} · {fmtDate(p.fecha)}</span>
                      <span className="trash-days-left">Se elimina en {Math.max(0, daysLeft)} día(s)</span>
                    </div>
                    <div className="pay-cobertura">
                      <button type="button" className="btn-secondary" onClick={() => restorePost(p.id)}><History size={12} /> Restaurar</button>
                      <button type="button" className="btn-danger-ghost" onClick={() => purgePost(p.id)}><Trash2 size={12} /> Eliminar para siempre</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}
        {activeTab === "calendario" && !showPostTrash && (
          <CalendarioView
            posts={filteredPosts}
            showClient={selectedClient === "__ALL__"}
            empresaLabel={selectedClient === "__ALL__" ? "Dashboard general" : selectedClient}
            month={calMonth}
            onMonthChange={setCalMonth}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onOpen={(id) => setOpenPostId(id)}
            filterRed={calFilterRed}
            filterFormato={calFilterFormato}
            search={calSearch}
            showReportPicker={showCalReportPicker}
            onCloseReportPicker={() => setShowCalReportPicker(false)}
          />
        )}

        {activeTab === "notas" && (
          <NotesView
            notes={filteredNotes}
            trashedNotes={trashedNotes}
            showClient={selectedClient === "__ALL__"}
            defaultClient={defaultClientForNew}
            onAdd={addNote}
            onPatch={patchNote}
            onTrash={trashNote}
            onRestore={restoreNote}
            onPurge={purgeNote}
            showTrash={showNotesTrash}
            tagFilter={notesTagFilter}
            driveConnected={driveConnected}
          />
        )}

        {activeTab === "tareas" && (
          <TareasGeneralesView
            tareas={tareasGenerales || []}
            onNew={() => setShowNewTareaGeneral(true)}
            onOpen={(id) => setOpenTareaGeneralId(id)}
            filterPersona={tareasFilterPersona}
            search={tareasSearch}
            commentReads={commentReads}
            currentUser={currentUser}
          />
        )}
        </>
        )}
        </>
        )}
      </div>

      {showNew && (
        <NewTaskModal
          defaultClient={defaultClientForNew}
          lockedClient={selectedClient !== "__ALL__" ? selectedClient : null}
          onClose={() => setShowNew(false)}
          onCreate={(t) => { addTask(t); setShowNew(false); }}
        />
      )}

      {openTask && (
        <TaskModal
          task={openTask}
          unlocked={can("editar")}
          onRequestUnlock={() => requestPermission("editar", () => {})}
          onClose={() => setOpenTaskId(null)}
          onPatch={(patch) => patchTask(openTask.id, patch)}
          onDelete={() => deleteTask(openTask.id)}
          onPreviewImage={setTaskPreviewFile}
          currentUser={currentUser}
          driveConnected={driveConnected}
          onMarkSeen={markTaskSeen}
        />
      )}
      {taskPreviewFile && <ImagePreviewModal file={taskPreviewFile} onClose={() => setTaskPreviewFile(null)} />}

      {showNewPayment && (
        <NewPaymentModal
          defaultClient={defaultClientForNew}
          lockedClient={selectedClient !== "__ALL__" ? selectedClient : null}
          onClose={() => setShowNewPayment(false)}
          onCreate={(p) => { addPayment(p); setShowNewPayment(false); }}
        />
      )}
      {openPayment && (
        <PaymentModal
          payment={openPayment}
          unlocked={can("editar")}
          onRequestUnlock={() => requestPermission("editar", () => {})}
          onClose={() => setOpenPaymentId(null)}
          onPatch={(patch) => patchPayment(openPayment.id, patch)}
          onDelete={() => deletePayment(openPayment.id)}
          driveConnected={driveConnected}
        />
      )}

      {showNewPost && (
        <NewPostModal
          defaultClient={defaultClientForNew}
          lockedClient={selectedClient !== "__ALL__" ? selectedClient : null}
          defaultDate={selectedDay}
          onClose={() => setShowNewPost(false)}
          onCreate={(p) => { addPost(p); setShowNewPost(false); }}
        />
      )}
      {openPost && (
        <PostModal
          post={openPost}
          unlocked={can("editar")}
          onRequestUnlock={() => requestPermission("editar", () => {})}
          onClose={() => setOpenPostId(null)}
          onPatch={(patch) => patchPost(openPost.id, patch)}
          onDelete={() => deletePost(openPost.id)}
          driveConnected={driveConnected}
        />
      )}

      {showNewDebt && (
        <NewDebtModal
          defaultClient={defaultClientForNew}
          lockedClient={selectedClient !== "__ALL__" ? selectedClient : null}
          onClose={() => setShowNewDebt(false)}
          onCreate={(d) => { addDebt(d); setShowNewDebt(false); }}
        />
      )}

      {showNewSaldoFavor && (
        <NewSaldoFavorModal
          defaultClient={defaultClientForNew}
          lockedClient={selectedClient !== "__ALL__" ? selectedClient : null}
          onClose={() => setShowNewSaldoFavor(false)}
          onCreate={(s) => { addSaldoFavor(s); setShowNewSaldoFavor(false); }}
        />
      )}

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onCreate={(c) => { addClient(c); setShowAddClient(false); }}
        />
      )}

      {showEditClient && editClientTarget && (
        <EditClientModal
          client={clientMeta(editClientTarget)}
          onClose={() => setShowEditClient(false)}
          onSave={(patch) => editClient(editClientTarget, patch)}
        />
      )}

      {showHistory && (
        <HistoryModal activity={activity} onClose={() => setShowHistory(false)} />
      )}

      {showNewInvoice && (
        <NewInvoiceModal
          onClose={() => setShowNewInvoice(false)}
          onCreate={(inv) => { addInvoice(inv); setShowNewInvoice(false); }}
        />
      )}
      {openInvoiceId && invoices && (
        (() => {
          const inv = invoices.find((i) => i.id === openInvoiceId);
          return inv ? (
            <InvoiceModal
              invoice={inv}
              unlocked={can("editar")}
              onRequestUnlock={() => requestPermission("editar", () => {})}
              onClose={() => setOpenInvoiceId(null)}
              onPatch={(patch) => patchInvoice(inv.id, patch)}
              onDelete={() => deleteInvoice(inv.id)}
              driveConnected={driveConnected}
            />
          ) : null;
        })()
      )}

      {showNewExpense && (
        <NewExpenseModal
          defaultCategoria={newExpenseCategoria}
          onClose={() => setShowNewExpense(false)}
          onCreate={(ex) => { addExpense(ex); setShowNewExpense(false); }}
        />
      )}
      {openExpenseId && expenses && (
        (() => {
          const ex = expenses.find((x) => x.id === openExpenseId);
          return ex ? (
            <ExpenseModal
              expense={ex}
              unlocked={can("editar")}
              onRequestUnlock={() => requestPermission("editar", () => {})}
              onClose={() => setOpenExpenseId(null)}
              onPatch={(patch) => patchExpense(ex.id, patch)}
              onDelete={() => deleteExpense(ex.id)}
              driveConnected={driveConnected}
            />
          ) : null;
        })()
      )}

      {showNewAcceso && (
        <NewAccesoModal
          onClose={() => setShowNewAcceso(false)}
          onCreate={(a) => { addAcceso(a); setShowNewAcceso(false); }}
        />
      )}
      {openAccesoId && accesos && (
        (() => {
          const a = accesos.find((x) => x.id === openAccesoId);
          return a ? (
            <AccesoModal
              acceso={a}
              unlocked={can("editar")}
              onRequestUnlock={() => requestPermission("editar", () => {})}
              onClose={() => setOpenAccesoId(null)}
              onPatch={(patch) => patchAcceso(a.id, patch)}
              onDelete={() => deleteAcceso(a.id)}
            />
          ) : null;
        })()
      )}

      {showNewInversion && (
        <NewInversionModal
          defaultClient={defaultClientForNew}
          lockedClient={selectedClient !== "__ALL__" ? selectedClient : null}
          onClose={() => setShowNewInversion(false)}
          onCreate={(inv) => { addInversion(inv); setShowNewInversion(false); }}
        />
      )}
      {openInversionId && inversiones && (
        (() => {
          const inv = inversiones.find((x) => x.id === openInversionId);
          return inv ? (
            <InversionModal
              inversion={inv}
              onClose={() => setOpenInversionId(null)}
              onPatch={(patch) => patchInversion(inv.id, patch)}
              onDelete={() => deleteInversion(inv.id)}
            />
          ) : null;
        })()
      )}

      {showNewTareaGeneral && (
        <NewTareaGeneralModal
          onClose={() => setShowNewTareaGeneral(false)}
          onCreate={(t) => { addTareaGeneral(t); setShowNewTareaGeneral(false); }}
        />
      )}
      {openTareaGeneralId && tareasGenerales && (
        (() => {
          const t = tareasGenerales.find((x) => x.id === openTareaGeneralId);
          return t ? (
            <TareaGeneralModal
              tarea={t}
              unlocked={can("editar")}
              onRequestUnlock={() => requestPermission("editar", () => {})}
              onClose={() => setOpenTareaGeneralId(null)}
              onPatch={(patch) => patchTareaGeneral(t.id, patch)}
              onDelete={() => deleteTareaGeneral(t.id)}
              currentUser={currentUser}
              driveConnected={driveConnected}
              onMarkSeen={markTaskSeen}
            />
          ) : null;
        })()
      )}

      {permDeniedLabel && (
        <PermissionDeniedModal label={permDeniedLabel} onClose={() => setPermDeniedLabel(null)} />
      )}

      {showGlobalSearch && (
        <GlobalSearchModal
          tasks={tasks || []} notes={notes || []} payments={payments || []} invoices={invoices || []}
          posts={posts || []} tareasGenerales={tareasGenerales || []} accesos={accesos || []}
          onSelect={goToSearchResult}
          onClose={() => setShowGlobalSearch(false)}
        />
      )}

      {showAIChat ? (
        <AIChatPanel
          messages={aiMessages}
          sending={aiSending}
          error={aiError}
          onSend={handleSendAIMessage}
          onClose={() => setShowAIChat(false)}
          onClear={clearAIChat}
        />
      ) : (
        <AIChatButton onClick={() => setShowAIChat(true)} />
      )}
    </div>
    {showLoginOverlay && (
      <LoginExitOverlay userId={currentUserId} users={users} exiting={loginOverlayExiting} />
    )}
    </>
  );
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Error en el dashboard:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          fontFamily: "monospace", padding: 24, background: "#FFF4F2",
          color: "#7A1E15", whiteSpace: "pre-wrap", lineHeight: 1.5, minHeight: "100vh"
        }}>
          <strong style={{ fontSize: 15 }}>⚠ Ocurrió un error al renderizar el dashboard</strong>
          <div style={{ marginTop: 10, fontSize: 12.5 }}>
            {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
