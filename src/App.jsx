import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildPath, parsePath } from "./routes";
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
  FileText,
  Search,
  StickyNote,
  Clapperboard,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import "./styles/index.css";
import { AccesoModal, NewAccesoModal } from "./components/admin/AccesosTab";
import { AdminModule } from "./components/admin/AdminModule";
import { ExpenseModal, NewExpenseModal } from "./components/admin/ExpensesTab";
import { InvoiceDocumentModal } from "./components/common/InvoiceDocumentModal";
import { InvoiceLiveEditor } from "./components/common/InvoiceLiveEditor";
import { loadPaymentInfo } from "./services/billing.service";
import { AIChatButton, AIChatPanel } from "./components/ai/AIChatPanel";
import { CustomSelect } from "./components/common/CustomSelect";
import { GlobalSearchModal, SidebarSearchBox } from "./components/common/GlobalSearch";
import { HistoryModal } from "./components/common/HistoryModal";
import { ImagePreviewModal } from "./components/common/ImagePreviewModal";
import { NotificationsPanel } from "./components/common/NotificationsPanel";
import { PermissionDeniedModal } from "./components/common/PermissionDeniedModal";
import { AddClientModal, EditClientModal } from "./components/dashboard/AddEditClientModal";
import { ClientLogo } from "./components/common/ClientLogo";
import { CalendarioView } from "./components/dashboard/CalendarioView";
import { InversionModal, NewInversionModal } from "./components/dashboard/InversionesModal";
import { MetaImportModal } from "./components/dashboard/MetaImportModal";
import { TextImportModal } from "./components/dashboard/TextImportModal";
import { ReceiptImportModal } from "./components/dashboard/ReceiptImportModal";
import { NewPaymentModal } from "./components/dashboard/NewPaymentModal";
import { NewPostModal } from "./components/dashboard/NewPostModal";
import { OverviewView } from "./components/dashboard/OverviewView";
import { NewSaldoFavorModal, PagosView } from "./components/dashboard/PagosView";
import { PaymentModal } from "./components/dashboard/PaymentModal";
import { PostModal } from "./components/dashboard/PostModal";
import { LoginExitOverlay, LoginScreen } from "./components/layout/LoginScreen";
import { ResetPasswordScreen } from "./components/layout/ResetPasswordScreen";
import { HeaderUserButton, Sidebar } from "./components/layout/Sidebar";
import { NotesView } from "./components/notes/NotesView";
import { GuionesView } from "./components/guiones/GuionesView";
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
import { useGuiones } from "./hooks/useGuiones";
import { useGuionCategoriasCustom } from "./hooks/useGuionCategorias";
import { usePautas } from "./hooks/usePautas";
import { usePayments } from "./hooks/usePayments";
import { usePermissions } from "./hooks/usePermissions";
import { usePosts } from "./hooks/usePosts";
import { useTareasGenerales } from "./hooks/useTareasGenerales";
import { useTasks } from "./hooks/useTasks";
import { demoAccesos, demoExpenses, demoInversiones, demoInvoices, demoNotes, demoPayments, demoPosts, demoTareasGenerales, demoTasks } from "./services/data.service";
import { CLIENTES, DEMO_MODULES, DEMO_MODULE_KEYS, DISENADORES, ESTADOS, EXPENSE_CATEGORIAS, FORMATOS, PRIMARY_DEFAULT, REDES } from "./utils/constants";
import { clientMeta, darkenHex, daysUntil, fmtDate, hasUnreadComments, hexToRgba, monthLabelEs, tagColor, guionEstaGrabado, guionEstaCompletado } from "./utils/helpers";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [appError, setAppError] = useState("");

  const {
    users, currentUser, currentUserId, authLoading, authErrorMsg, pendingEmail,
    showLoginOverlay, loginOverlayExiting, recoveryMode, completePasswordRecovery, justLoggedIn,
    login, logout, addUser, patchUser, deleteUser, saveUsersNow,
  } = useAuth(
    (text) => logActivity(text), (msg) => setAppError(msg)
  );
  const { can, canView, requestPermission, permDeniedLabel, setPermDeniedLabel } = usePermissions(currentUser);
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
    debts, updateDebts, addDebt, patchDebt, resolveDebt,
    saldosFavor, updateSaldosFavor, addSaldoFavor, patchSaldoFavor, removeSaldoFavor,
  } = useDebts(logActivity, setAppError);
  const { notes, updateNotes, addNote, patchNote, trashNote, restoreNote, purgeNote } = useNotes(logActivity, setAppError);
  const { guiones, updateGuiones, addGuion, addGuiones, patchGuion, trashGuion, restoreGuion, purgeGuion, syncStatus: guionesSyncStatus } = useGuiones(logActivity, setAppError);
  const { customCategorias, addCategoria: addGuionCategoria } = useGuionCategoriasCustom(setAppError);
  const { pautas, addPauta, patchPauta, deletePauta, reorderPautas } = usePautas(logActivity, setAppError);
  function handleDeletePauta(pautaId) {
    // Los guiones de esta pauta NO se borran — quedan "Sin pauta" (pautaId
    // null). Se hace con una sola llamada a updateGuiones (no un forEach de
    // patchGuion por cada uno) por el mismo motivo que ya se corrigió en la
    // importación con IA: varias llamadas seguidas a una función que lee el
    // mismo estado capturado se pisan entre sí.
    const afectados = (guiones || []).filter((g) => g.pautaId === pautaId);
    if (afectados.length) {
      updateGuiones((guiones || []).map((g) => (g.pautaId === pautaId ? { ...g, pautaId: null } : g)));
    }
    deletePauta(pautaId);
  }
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
    inversiones, updateInversiones, addInversion, addInversiones, patchInversion,
    deleteInversion, restoreInversion, purgeInversion,
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
  const { driveConnected, toggleDriveConnected, lastBackupDate, runBackup, runWorkDriveBackup, restoreBackup } = useBackup(logActivity);

  const [selectedClient, setSelectedClient] = useState("__ALL__");
  const {
    clientsBump, addClient, editClient, deleteClientCompletely,
  } = useClients({
    tasks, payments, posts, notes, debts, invoices, accesos, saldosFavor, inversiones, guiones, expenses, tareasGenerales, pautas,
    updateTasks, updatePayments, updatePosts, updateNotes, updateDebts, updateInvoices, updateAccesos,
    updateSaldosFavor, updateInversiones, updateGuiones, updateExpenses, updateTareasGenerales, patchPauta,
    selectedClient, setSelectedClient, logActivity, setAppError,
  });

  function handleRunBackup() {
    runBackup({ tasks, payments, posts, debts, notes, tareasGenerales, inversiones, invoices, expenses, accesos });
  }
  async function handleRunWorkDriveBackup() {
    // Deja que el error suba tal cual a quien llama (BackupPanel), que ya
    // tiene su propio manejo de "subiendo…"/error — mismo patrón que
    // AttachmentsBlock con sus adjuntos.
    await runWorkDriveBackup({ tasks, payments, posts, debts, notes, tareasGenerales, inversiones, invoices, expenses, accesos });
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
      invoices, expenses, canSeeAdmin: can("administrativo"), canSeeMontos: can("verMontos"),
    });
  }

  const [activeTab, setActiveTab] = useState("flujo");
  // Si en algún momento activeTab quedara en "pagos" sin el permiso
  // verMontos (por ejemplo, Diego le revoca el permiso a alguien que lo
  // tenía abierto, o quedó guardado de una sesión anterior), lo saca de ahí
  // solo — así ningún bloque que renderiza según activeTab==="pagos" (o
  // cualquier otro módulo con acceso restringido) puede llegar a mostrarse
  // sin permiso, sin tener que repetir el chequeo en cada uno de esos
  // lugares por separado. Mismo criterio para "Ver montos" (pagos) y para
  // el acceso a módulos por usuario (canView) — si el módulo activo deja de
  // estar permitido (se lo restringieron en Admin mientras estaba ahí
  // adentro, por ejemplo), rebota al primer módulo accesible.
  useEffect(() => {
    const permitido = activeTab === "pagos" ? can("verMontos") : canView(activeTab);
    if (permitido) return;
    const orden = ["tareas", "flujo", "calendario", "notas", "guiones"];
    const siguiente = orden.find((t) => canView(t)) || "flujo";
    setActiveTab(siguiente);
  }, [activeTab, can, canView]);
  const [columnVisibleCounts, setColumnVisibleCounts] = useState({});
  useEffect(() => {
    const activeBtn = document.querySelector(".tabbar .tab-active");
    if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeTab]);

  const TAB_ORDER_ALL = ["tareas", "flujo", "calendario", "notas", "guiones", "pagos"];
  const TAB_ORDER = TAB_ORDER_ALL.filter((t) => (t === "pagos" ? can("verMontos") : canView(t)));
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
  const [showGuionesTrash, setShowGuionesTrash] = useState(false);
  const [openGuionId, setOpenGuionId] = useState(null);
  const [guionesSearch, setGuionesSearch] = useState("");
  const [guionesPautaFiltro, setGuionesPautaFiltro] = useState("todas");
  // Al cambiar de cliente, la pauta seleccionada (si había una puntual, no
  // "todas") casi seguro no le pertenece al cliente nuevo — se resetea para
  // no quedar mostrando un filtro que no corresponde a nadie ahí.
  useEffect(() => { setGuionesPautaFiltro("todas"); }, [selectedClient]);
  const [guionesEstadoFiltro, setGuionesEstadoFiltro] = useState("todos");
  const [showNewGuion, setShowNewGuion] = useState(false);
  const [showImportGuiones, setShowImportGuiones] = useState(false);
  const [showPaymentsTrash, setShowPaymentsTrash] = useState(false);
  const [showInversionesTrash, setShowInversionesTrash] = useState(false);
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
  const [duplicatePayment, setDuplicatePayment] = useState(null);
  const [showReceiptImport, setShowReceiptImport] = useState(false);
  const [receiptDraft, setReceiptDraft] = useState(null);
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
  const [adminSubTab, setAdminSubTab] = useState("finanzas");
  const [openNoteId, setOpenNoteId] = useState(null);
  const [showNewTareaGeneral, setShowNewTareaGeneral] = useState(false);
  const [showNewInversion, setShowNewInversion] = useState(false);
  const [duplicateInversion, setDuplicateInversion] = useState(null);
  const [showMetaImport, setShowMetaImport] = useState(false);
  const [showTextImport, setShowTextImport] = useState(false);
  const [showNewAcceso, setShowNewAcceso] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewNomina, setShowNewNomina] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState([]);
  useEffect(() => { loadPaymentInfo().then((list) => setPaymentInfo(list || [])); }, []);
  const [showNewExpense, setShowNewExpense] = useState(false);

  // ---------------------------------------------------------------------
  // Enrutamiento — URLs persistentes al refrescar/compartir un link.
  //
  // Principio de seguridad (no negociable): la URL decide A DÓNDE apunta la
  // app, JAMÁS qué permisos tiene la sesión. Por eso, al leer una URL, esto
  // pasa por los MISMOS checks que ya existían para un clic normal
  // (requestPermission / can()) — nunca setea adminView o el monto de un
  // pago directamente sin pasar por ahí. Alguien sin permiso que entra
  // directo a una URL restringida ve exactamente lo mismo que vería
  // navegando: el modal de "permiso denegado", o el monto enmascarado —
  // nunca el contenido real.
  // useState, no useRef, a propósito: un ref se actualiza al instante, pero
  // el estado de React (selectedClient, activeTab, etc.) que setea el
  // Efecto A recién se aplica en el próximo render. Si esta guarda fuera un
  // ref, el Efecto B podía correr en esa MISMA pasada todavía con los
  // valores viejos (los de arranque) y pisar la URL real con la que llegó
  // la página. Con useState, el Efecto B ve el valor viejo (false) en esa
  // primera pasada y se frena — recién en el próximo render, ya con el
  // estado real aplicado, vuelve a correr y ahí sí sincroniza bien.
  const [routeInitialized, setRouteInitialized] = useState(false);

  // Efecto A: URL -> estado. Corre al cargar la página y cada vez que la
  // URL cambia por fuera de esta misma sincronización (atrás/adelante del
  // navegador, un link pegado, refrescar). Depende también de si ya hay
  // sesión — si alguien entra por un link ANTES de loguearse, se aplica
  // recién cuando el login termina, no antes (no hay permisos que chequear
  // todavía).
  useEffect(() => {
    if (!currentUser || authLoading || recoveryMode) return;
    const loc = parsePath(location.pathname, CLIENTES);

    if (!loc) {
      // Ruta desconocida (por ejemplo, un cliente que ya no existe): se
      // limpia sola en vez de dejar la app en un estado roto.
      navigate("/", { replace: true });
      return;
    }

    if (loc.admin) {
      requestPermission("administrativo", () => {
        setAdminView(true);
        setAdminSubTab(loc.adminSubTab || "finanzas");
        setOpenInvoiceId(loc.adminItemType === "factura" ? loc.adminItemId : null);
        setOpenExpenseId(loc.adminItemType === "gasto" ? loc.adminItemId : null);
      });
      // Si NO tiene el permiso, requestPermission ya muestra el modal de
      // "permiso denegado" — adminView se queda en false, como si nunca
      // hubiese tocado el botón. No se toca nada más.
      setRouteInitialized(true);
      return;
    }

    setAdminView(false);

    if (!loc.cliente || loc.cliente === "__ALL__") {
      // Dashboard general — "fuera del contexto de cliente". Lo único que
      // puede estar abierto acá es una tarea general (desde el feed de
      // Novedades); no hay pestaña que aplicar.
      setSelectedClient("__ALL__");
      setOpenTaskId(null);
      setOpenTareaGeneralId(loc.itemId || null);
      setOpenNoteId(null);
      setOpenGuionId(null);
      setOpenPaymentId(null);
      setOpenPostId(null);
      setRouteInitialized(true);
      return;
    }

    setSelectedClient(loc.cliente);
    // Ni "pagos" sin el permiso verMontos, ni ningún otro módulo restringido
    // por usuario, quedan activos por URL — mismo criterio que ya existía
    // para cuando alguien pierde el acceso estando ahí adentro (ver el otro
    // efecto, más abajo, que hace lo mismo por las dudas). Así nunca hay ni
    // un instante de una pantalla restringida renderizada para quien no
    // debería verla, ni siquiera entrando por un link directo.
    const tabPedido = loc.tab || "flujo";
    const tabPermitido = tabPedido === "pagos" ? can("verMontos") : canView(tabPedido);
    const tab = tabPermitido ? tabPedido : (["tareas", "flujo", "calendario", "notas", "guiones"].find((t) => canView(t)) || "flujo");
    setActiveTab(tab);

    const itemId = tab === loc.tab ? (loc.itemId || null) : null;
    setOpenTaskId(tab === "flujo" ? itemId : null);
    setOpenTareaGeneralId(tab === "tareas" ? itemId : null);
    setOpenNoteId(tab === "notas" ? itemId : null);
    setOpenGuionId(tab === "guiones" ? itemId : null);
    setOpenPaymentId(tab === "pagos" ? itemId : null);
    setOpenPostId(tab === "calendario" ? itemId : null);

    setRouteInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, currentUser, authLoading, recoveryMode]);

  // Efecto B: estado -> URL. Corre cuando cambia cualquier cosa que
  // "dónde estoy" represente. Se salta a propósito la primerísima vez (ver
  // routeInitialized) para no pisar la URL con la que arrancó la página
  // ANTES de que el Efecto A llegue a leerla — si no, un refresh en
  // cualquier URL profunda rebotaría a "/" en el primer instante.
  useEffect(() => {
    if (!currentUser || authLoading || recoveryMode) return;
    if (!routeInitialized) return;

    let loc;
    if (adminView) {
      loc = {
        admin: true,
        adminSubTab,
        adminItemType: openInvoiceId ? "factura" : openExpenseId ? "gasto" : null,
        adminItemId: openInvoiceId || openExpenseId || null,
      };
    } else if (selectedClient === "__ALL__") {
      // Dashboard general: el único ítem posible es una tarea general.
      loc = { cliente: "__ALL__", itemId: openTareaGeneralId || null };
    } else {
      loc = {
        cliente: selectedClient,
        tab: activeTab,
        itemId: openTaskId || openTareaGeneralId || openNoteId || openGuionId || openPaymentId || openPostId || null,
      };
    }

    const path = buildPath(loc, CLIENTES);
    if (path !== location.pathname) navigate(path, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    routeInitialized,
    adminView, adminSubTab, openInvoiceId, openExpenseId,
    selectedClient, activeTab, openTaskId, openTareaGeneralId, openNoteId, openGuionId, openPaymentId, openPostId,
    currentUser, authLoading, recoveryMode,
  ]);
  // ---------------------------------------------------------------------


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


  // Versiones "activas" (sin lo que está en la papelera) de los 3 dominios
  // que tienen soft-delete: tareas, pagos y publicaciones. Una tarea/pago/
  // publicación en papelera ya no forma parte del flujo de trabajo, así que
  // NADA que cuente/resuma "lo activo" (badges del sidebar, notificaciones,
  // Dashboard general) debe incluirla — solo la vista de la papelera en sí
  // debe verla. Se calcula UNA vez acá y se reutiliza en todos los lugares
  // que antes leían el arreglo crudo (tasks/payments/posts) directamente,
  // para no tener que repetir el mismo filtro en cada consumidor y arriesgar
  // que alguno quede afuera.
  const activeTasks = useMemo(() => (tasks || []).filter((t) => !t.deletedAt), [tasks]);
  const activePayments = useMemo(() => (payments || []).filter((p) => !p.deletedAt), [payments]);
  const activePosts = useMemo(() => (posts || []).filter((p) => !p.deletedAt), [posts]);

  const clientCounts = useMemo(() => {
    const map = Object.fromEntries(CLIENTES.map((c) => [c.name, 0]));
    activeTasks.forEach((t) => { if (map[t.empresa] !== undefined && t.estado !== "listo") map[t.empresa]++; });
    return map;
  }, [activeTasks]);

  const notifications = useMemo(() => {
    return activeTasks
      .filter((t) => t.estado !== "listo")
      .map((t) => ({ task: t, days: daysUntil(t.fechaEntrega) }))
      .filter((x) => x.days !== null && x.days <= 3)
      .sort((a, b) => a.days - b.days)
      .slice(0, 30);
  }, [activeTasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeTasks.filter((t) => {
      const matchesClient = selectedClient === "__ALL__" || t.empresa === selectedClient;
      const matchesQ = !q || t.titulo.toLowerCase().includes(q) || t.empresa.toLowerCase().includes(q);
      const matchesD = filterDesigner === "Todos" || t.asignado === filterDesigner;
      return matchesClient && matchesQ && matchesD;
    });
  }, [activeTasks, query, filterDesigner, selectedClient]);

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
    return inversiones.filter((i) => (selectedClient === "__ALL__" || i.empresa === selectedClient) && !i.deletedAt);
  }, [inversiones, selectedClient]);

  const trashedInversiones = useMemo(() => {
    if (!inversiones) return [];
    return inversiones
      .filter((i) => (selectedClient === "__ALL__" || i.empresa === selectedClient) && i.deletedAt)
      .sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));
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

  const filteredPautas = useMemo(() => {
    if (!pautas) return [];
    // Bug corregido: antes se pasaba la lista completa de pautas sin filtrar
    // por cliente — todas compartían la misma barra sin importar en qué
    // cliente estuvieras parado. El campo `empresa` ya existía en cada
    // pauta desde que se creaba (ver handleAddPauta), así que esto es solo
    // agregar el filtro que faltaba — no hace falta migrar ni tocar ningún
    // dato ya guardado.
    return pautas
      .filter((p) => p.empresa === selectedClient)
      // `orden` es nuevo — las pautas creadas antes de este campo no lo
      // tienen, así que caen ordenadas por fecha de creación (su orden
      // natural de siempre) en vez de mezclarse al final o al principio.
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [pautas, selectedClient]);

  const filteredGuiones = useMemo(() => {
    if (!guiones) return [];
    const q = guionesSearch.trim().toLowerCase();
    return guiones
      .filter((g) => (selectedClient === "__ALL__" || g.empresa === selectedClient) && !g.deletedAt)
      .filter((g) => guionesPautaFiltro === "todas" || (g.pautaId || "sin-pauta") === guionesPautaFiltro)
      .filter((g) => !q || `${g.titulo} ${g.tema || ""}`.toLowerCase().includes(q))
      .filter((g) => {
        if (guionesEstadoFiltro === "todos") return true;
        const grabado = guionEstaGrabado(g);
        const completado = guionEstaCompletado(g);
        if (guionesEstadoFiltro === "grabado") return grabado;
        if (guionesEstadoFiltro === "no-grabado") return !grabado;
        if (guionesEstadoFiltro === "completado") return completado;
        if (guionesEstadoFiltro === "incompleto") return !completado;
        return true;
      })
      // Orden estable — por fecha de creación, nunca por "última edición".
      // Antes ordenaba por updatedAt, que cambia con CADA autoguardado — el
      // guion que estabas editando en ese momento se iba al principio de la
      // lista solo, saltando de posición constantemente durante una
      // grabación en vivo. createdAt no cambia nunca después de crear el
      // guion, así que el orden queda fijo y predecible.
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [guiones, selectedClient, guionesSearch, guionesPautaFiltro, guionesEstadoFiltro]);

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

  const trashedGuiones = useMemo(() => {
    if (!guiones) return [];
    return guiones
      .filter((g) => (selectedClient === "__ALL__" || g.empresa === selectedClient) && g.deletedAt)
      .sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || ""));
  }, [guiones, selectedClient]);

  if (recoveryMode) {
    // Se llegó desde el link de "recuperar clave" del correo — se pide la
    // clave nueva antes que cualquier otra cosa, sin importar el resto del
    // estado de sesión (aunque el perfil ya esté cargando de fondo).
    return (
      <div className="app" style={{ background: "var(--bg)" }}>
        <ResetPasswordScreen onSubmit={completePasswordRecovery} />
      </div>
    );
  }
  if (authLoading) {
    // Todavía resolviendo la sesión de Supabase Auth (o, si ya hay sesión, el
    // perfil correspondiente) — no mostramos nada para evitar un parpadeo
    // entre "pantalla de login" y "dashboard" mientras se resuelve.
    return <div className="app" style={{ background: "var(--bg)" }} />;
  }
  if (!currentUser) {
    return (
      <div className="app" style={{ background: "var(--bg)" }}>
        <LoginScreen onLogin={login} authError={authErrorMsg} />
      </div>
    );
  }

  return (
    <>
    <div
      className={"app" + (justLoggedIn ? " app-enter" : "")}
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
            setAppError={setAppError}
            subTab={adminSubTab}
            onSubTabChange={setAdminSubTab}
            onOpenInvoice={(id) => setOpenInvoiceId(id)}
            onNewInvoice={() => setShowNewInvoice(true)}
            onOpenExpense={(id) => setOpenExpenseId(id)}
            onNewExpense={(cat) => { setNewExpenseCategoria(cat || EXPENSE_CATEGORIAS[0]); setShowNewExpense(true); }}
            onNewNomina={() => setShowNewNomina(true)}
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
            onSaveAll={saveUsersNow}
            onDeleteUser={deleteUser}
            geminiKey={geminiKey}
            onSaveGeminiKey={saveGeminiKey}
            driveConnected={driveConnected}
            onToggleDriveConnected={toggleDriveConnected}
            onAddClient={() => setShowAddClient(true)}
            onEditClient={openEditClient}
            lastBackupDate={lastBackupDate}
            onRunBackup={handleRunBackup}
            onRunWorkDriveBackup={handleRunWorkDriveBackup}
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
            {selectedClient !== "__ALL__" && clientMeta(selectedClient).logoSvg && (
              <ClientLogo client={clientMeta(selectedClient)} dark maxHeight={34} className="topbar-client-logo" />
            )}
            <div>
              <h1>{selectedClient === "__ALL__" ? "Dashboard general" : selectedClient}</h1>
              <span className="topbar-sub">
                {selectedClient === "__ALL__" ? "Vista general del estudio" : "Panel del cliente"}
              </span>
            </div>
          </div>

          <div className="controls">
            {selectedClient !== "__ALL__" && activeTab === "tareas" && (
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
            {selectedClient !== "__ALL__" && activeTab === "pagos" && can("verMontos") && (
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
                <button className="btn-secondary" onClick={() => setShowReceiptImport(true)}>
                  <FileText size={14} /> Importar desde PDF de Meta
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
            {selectedClient !== "__ALL__" && activeTab === "guiones" && (
              <div className="header-btn-row">
                {!showGuionesTrash && (
                  <div className="search">
                    <Search size={15} />
                    <input placeholder="Buscar por producto, referencia o tema…" value={guionesSearch} onChange={(e) => setGuionesSearch(e.target.value)} />
                    {guionesSearch && <button type="button" className="icon-btn subtle" onClick={() => setGuionesSearch("")}><X size={13} /></button>}
                  </div>
                )}
                {!showGuionesTrash && (
                  <button type="button" className="btn-primary" onClick={() => setShowNewGuion(true)}>
                    <Plus size={16} strokeWidth={2.5} /> Nuevo guion
                  </button>
                )}
                {!showGuionesTrash && (
                  <button type="button" className="btn-secondary" onClick={() => setShowImportGuiones(true)}>
                    <Sparkles size={14} /> Importar guiones
                  </button>
                )}
                <button type="button" className="notes-trash-toggle" onClick={() => setShowGuionesTrash((s) => !s)}>
                  <Trash2 size={13} /> {showGuionesTrash ? "Volver a Guiones" : `Papelera${trashedGuiones.length ? ` (${trashedGuiones.length})` : ""}`}
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
                  canSeeMontos={can("verMontos")}
                />
              </div>
            )}
          </div>
          {activeTab === "guiones" && selectedClient !== "__ALL__" && guionesSyncStatus && (
            <span className={"header-sync-badge header-sync-badge-" + guionesSyncStatus} title={
              guionesSyncStatus === "offline" ? "Sin conexión — los cambios se guardan en el dispositivo y se suben solos al volver la señal"
              : guionesSyncStatus === "syncing" ? "Sincronizando cambios pendientes…"
              : "En línea — todo sincronizado"
            }>
              {guionesSyncStatus === "offline" ? "Sin conexión" : guionesSyncStatus === "syncing" ? "Sincronizando…" : "En línea"}
            </span>
          )}
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
            tasks={activeTasks} payments={activePayments} debts={debts || []} posts={activePosts}
            tareasGenerales={tareasGenerales || []}
            canSeeMontos={can("verMontos")}
            onSelectClient={setSelectedClient}
            onOpenTareaGeneral={(id) => setOpenTareaGeneralId(id)}
          />
        ) : (
        <>
        <div className="tabbar" onTouchStart={onTabTouchStart} onTouchEnd={onTabTouchEnd}>
          {canView("tareas") && (
          <button className={"tab" + (activeTab === "tareas" ? " tab-active" : "")} onClick={() => setActiveTab("tareas")}>
            <ListChecks size={14} /> Tareas
          </button>
          )}
          {canView("flujo") && (
          <button className={"tab" + (activeTab === "flujo" ? " tab-active" : "")} onClick={() => setActiveTab("flujo")}>
            <LayoutGrid size={14} /> Creativos
          </button>
          )}
          {canView("calendario") && (
          <button className={"tab" + (activeTab === "calendario" ? " tab-active" : "")} onClick={() => setActiveTab("calendario")}>
            <CalendarDays size={14} /> Planificación
          </button>
          )}
          {canView("notas") && (
          <button className={"tab" + (activeTab === "notas" ? " tab-active" : "")} onClick={() => setActiveTab("notas")}>
            <StickyNote size={14} /> Notas
          </button>
          )}
          {canView("guiones") && (
          <button className={"tab" + (activeTab === "guiones" ? " tab-active" : "")} onClick={() => setActiveTab("guiones")}>
            <Clapperboard size={14} /> Guiones
          </button>
          )}
          {can("verMontos") && (
          <button className={"tab" + (activeTab === "pagos" ? " tab-active" : "")} onClick={() => setActiveTab("pagos")}>
            <Wallet size={14} /> Pagos publicitarios
          </button>
          )}
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

        {activeTab === "pagos" && can("verMontos") && (
          <PagosView
            payments={filteredPayments}
            trashedPayments={trashedPayments}
            debts={filteredDebts}
            saldosFavor={filteredSaldosFavor}
            inversiones={filteredInversiones}
            canSeeMontos={can("verMontos")}
            showClient={selectedClient === "__ALL__"}
            defaultClient={defaultClientForNew}
            onOpen={(id) => setOpenPaymentId(id)}
            onAddDebt={() => setShowNewDebt(true)}
            onPatchDebt={patchDebt}
            onResolveDebt={resolveDebt}
            onAddSaldoFavor={() => setShowNewSaldoFavor(true)}
            onPatchSaldoFavor={patchSaldoFavor}
            onRemoveSaldoFavor={removeSaldoFavor}
            onNewInversion={() => setShowNewInversion(true)}
            onImportMeta={() => setShowMetaImport(true)}
            onImportTexto={() => setShowTextImport(true)}
            onOpenInversion={(id) => setOpenInversionId(id)}
            onRestorePayment={restorePayment}
            onPurgePayment={purgePayment}
            showTrash={showPaymentsTrash}
            trashedInversiones={trashedInversiones}
            showInversionesTrash={showInversionesTrash}
            onToggleInversionesTrash={() => setShowInversionesTrash((s) => !s)}
            onRestoreInversion={restoreInversion}
            onPurgeInversion={purgeInversion}
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
            openNoteId={openNoteId}
            onOpenNote={setOpenNoteId}
          />
        )}

        {activeTab === "guiones" && (
          <GuionesView
            guiones={filteredGuiones}
            trashedGuiones={trashedGuiones}
            showClient={selectedClient === "__ALL__"}
            defaultClient={defaultClientForNew}
            onAdd={addGuion}
            onImportMany={addGuiones}
            onPatch={patchGuion}
            onTrash={trashGuion}
            onRestore={restoreGuion}
            onPurge={purgeGuion}
            showTrash={showGuionesTrash}
            openGuionId={openGuionId}
            onOpenGuion={setOpenGuionId}
            customCategorias={customCategorias}
            canAddCategoria={can("administrativo")}
            onAddCategoria={addGuionCategoria}
            pautas={filteredPautas}
            onAddPauta={addPauta}
            onRenamePauta={(id, etiqueta) => patchPauta(id, { etiqueta })}
            onDeletePauta={handleDeletePauta}
            onReorderPautas={reorderPautas}
            accentColor={accent}
            pautaFiltro={guionesPautaFiltro}
            onChangePautaFiltro={setGuionesPautaFiltro}
            estadoFiltro={guionesEstadoFiltro}
            onChangeEstadoFiltro={setGuionesEstadoFiltro}
            showNew={showNewGuion}
            onOpenNew={() => setShowNewGuion(true)}
            onCloseNew={() => setShowNewGuion(false)}
            showImport={showImportGuiones}
            onOpenImport={() => setShowImportGuiones(true)}
            onCloseImport={() => setShowImportGuiones(false)}
            geminiKey={geminiKey}
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
          geminiKey={geminiKey}
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

      {(showNewPayment || duplicatePayment || receiptDraft) && (
        <NewPaymentModal
          defaultClient={defaultClientForNew}
          lockedClient={selectedClient !== "__ALL__" ? selectedClient : null}
          canSeeMontos={can("verMontos")}
          duplicateFrom={duplicatePayment || receiptDraft}
          duplicateLabel={receiptDraft ? {
            title: "Pago importado desde PDF",
            submit: "Crear pago",
            hint: "Estos datos se extrajeron automáticamente del recibo — revisalos antes de confirmar. El desglose y la semana de inversión no se completaron (quedan para cargar a mano si hace falta).",
          } : undefined}
          onClose={() => { setShowNewPayment(false); setDuplicatePayment(null); setReceiptDraft(null); }}
          onCreate={(p) => { addPayment(p); setShowNewPayment(false); setDuplicatePayment(null); setReceiptDraft(null); }}
        />
      )}

      {showReceiptImport && (
        <ReceiptImportModal
          geminiKey={geminiKey}
          onClose={() => setShowReceiptImport(false)}
          onExtracted={(draft) => { setReceiptDraft(draft); setShowReceiptImport(false); }}
        />
      )}
      {openPayment && (
        <PaymentModal
          payment={openPayment}
          unlocked={can("editar")}
          canSeeMontos={can("verMontos")}
          onRequestUnlock={() => requestPermission("editar", () => {})}
          onClose={() => setOpenPaymentId(null)}
          onPatch={(patch) => patchPayment(openPayment.id, patch)}
          onDelete={() => deletePayment(openPayment.id)}
          onDuplicate={(p) => { setDuplicatePayment(p); setOpenPaymentId(null); }}
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
          key={editClientTarget + "|" + clientsBump}
          client={clientMeta(editClientTarget)}
          onClose={() => setShowEditClient(false)}
          onSave={(patch) => editClient(editClientTarget, patch)}
        />
      )}

      {showHistory && (
        <HistoryModal activity={activity} onClose={() => setShowHistory(false)} />
      )}

      {showNewInvoice && (
        <InvoiceLiveEditor
          variant="factura"
          paymentInfo={paymentInfo}
          onClose={() => setShowNewInvoice(false)}
          onSave={async (doc, { imprimir }) => { addInvoice(doc); if (!imprimir) setShowNewInvoice(false); }}
        />
      )}
      {openInvoiceId && invoices && (
        (() => {
          const inv = invoices.find((i) => i.id === openInvoiceId);
          return inv ? (
            <InvoiceLiveEditor
              variant="factura"
              existing={inv}
              paymentInfo={paymentInfo}
              onClose={() => setOpenInvoiceId(null)}
              onSave={async (doc, { imprimir }) => { patchInvoice(inv.id, doc); if (!imprimir) setOpenInvoiceId(null); }}
              onDelete={(id) => { deleteInvoice(id); setOpenInvoiceId(null); }}
              driveConnected={driveConnected}
            />
          ) : null;
        })()
      )}

      {showNewNomina && (
        <InvoiceLiveEditor
          variant="nomina"
          paymentInfo={paymentInfo}
          onClose={() => setShowNewNomina(false)}
          onSave={async (doc, { imprimir }) => { addExpense(doc); if (!imprimir) setShowNewNomina(false); }}
        />
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
          if (!ex) return null;
          if (ex.categoria === "Nómina") {
            return (
              <InvoiceLiveEditor
                variant="nomina"
                existing={{
                  ...ex,
                  // Compatibilidad — los recibos de nómina creados con el
                  // formulario viejo guardaban esto como extraLabel/extraMonto;
                  // el editor usa ajusteLabel/ajusteMonto (mismo campo que
                  // Facturas). Sin este mapeo, un recibo viejo se abriría con
                  // el descuento/extra en blanco, aunque el dato siga ahí.
                  ajusteLabel: ex.ajusteLabel ?? ex.extraLabel ?? "",
                  ajusteMonto: ex.ajusteMonto ?? ex.extraMonto ?? "",
                }}
                paymentInfo={paymentInfo}
                onClose={() => setOpenExpenseId(null)}
                onSave={async (doc, { imprimir }) => { patchExpense(ex.id, doc); if (!imprimir) setOpenExpenseId(null); }}
                onDelete={(id) => { deleteExpense(id); setOpenExpenseId(null); }}
                driveConnected={driveConnected}
              />
            );
          }
          return (
            <ExpenseModal
              expense={ex}
              unlocked={can("editar")}
              onRequestUnlock={() => requestPermission("editar", () => {})}
              onClose={() => setOpenExpenseId(null)}
              onPatch={(patch) => patchExpense(ex.id, patch)}
              onDelete={() => deleteExpense(ex.id)}
              driveConnected={driveConnected}
            />
          );
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

      {(showNewInversion || duplicateInversion) && (
        <NewInversionModal
          defaultClient={defaultClientForNew}
          lockedClient={selectedClient !== "__ALL__" ? selectedClient : null}
          canSeeMontos={can("verMontos")}
          duplicateFrom={duplicateInversion}
          onClose={() => { setShowNewInversion(false); setDuplicateInversion(null); }}
          onCreate={(inv) => { addInversion(inv); setShowNewInversion(false); setDuplicateInversion(null); }}
        />
      )}

      {showMetaImport && (
        <MetaImportModal
          empresa={selectedClient !== "__ALL__" ? selectedClient : null}
          defaultClient={defaultClientForNew}
          canSeeMontos={can("verMontos")}
          onClose={() => setShowMetaImport(false)}
          onImport={addInversiones}
        />
      )}

      {showTextImport && (
        <TextImportModal
          empresa={selectedClient !== "__ALL__" ? selectedClient : null}
          defaultClient={defaultClientForNew}
          geminiKey={geminiKey}
          canSeeMontos={can("verMontos")}
          onClose={() => setShowTextImport(false)}
          onImport={addInversiones}
        />
      )}
      {openInversionId && inversiones && (
        (() => {
          const inv = inversiones.find((x) => x.id === openInversionId);
          return inv ? (
            <InversionModal
              inversion={inv}
              canSeeMontos={can("verMontos")}
              onClose={() => setOpenInversionId(null)}
              onPatch={(patch) => patchInversion(inv.id, patch)}
              onDelete={() => deleteInversion(inv.id)}
              onDuplicate={(i) => { setDuplicateInversion(i); setOpenInversionId(null); }}
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
          canSeeMontos={can("verMontos")}
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
      <LoginExitOverlay email={pendingEmail} exiting={loginOverlayExiting} />
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
