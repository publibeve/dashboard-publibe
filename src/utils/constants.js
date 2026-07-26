import {
  Building2,
  Clock,
  PenTool,
  Eye,
  CheckCircle2,
  LayoutGrid,
  StickyNote,
  Plane,
  Wrench,
  Cog,
  ShieldCheck,
  Globe,
  Car,
  KeyRound,
  Compass,
  Wallet,
  CalendarDays,
  Receipt,
  ListChecks,
  Utensils,
  Stethoscope,
  GraduationCap,
  Home,
  Dumbbell,
  Scissors,
  Scale,
  Landmark,
  Cpu,
  Camera,
  PartyPopper,
  Shirt,
  PawPrint,
  HardHat,
  Wheat,
  Music,
  Sofa,
  Coffee,
  BedDouble,
  Truck,
  ThumbsUp,
  Clapperboard,
  Music2,
  MessageCircle,
  Tag,
  Fuel,
  Pill,
  BookOpen,
  Factory,
  Gem,
} from "lucide-react";

export let CLIENTES = [
  { name: "TransfersMérida",    icon: Plane,       iconKey: "plane",   color: "#0B7FE3" }, // transporte
  { name: "ToyoReyna",          icon: Wrench,      iconKey: "wrench",  color: "#1FA35A" }, // repuestos
  { name: "ToyoMercedes",       icon: Cog,         iconKey: "cog",     color: "#3AAE8C" }, // repuestos
  { name: "ToyoCare Services",  icon: ShieldCheck, iconKey: "shield",  color: "#D9A716" }, // servicio/mantenimiento
  { name: "ToyoMundial",        icon: Globe,       iconKey: "globe",   color: "#E08A1E" }, // vehículos
  { name: "MundoFord",          icon: Car,         iconKey: "car",     color: "#D2492B" }, // vehículos
  { name: "Méri Car Rental",    icon: KeyRound,    iconKey: "key",     color: "#A23B7C" }, // alquiler de autos
  { name: "Atlantic HS Tours",  icon: Compass,     iconKey: "compass", color: "#6B3FA0" }, // agencia de viajes
];

export const ICONS_CATALOG = [
  { key: "plane", icon: Plane, label: "Transporte" },
  { key: "wrench", icon: Wrench, label: "Taller / repuestos" },
  { key: "cog", icon: Cog, label: "Mecánica" },
  { key: "shield", icon: ShieldCheck, label: "Servicio" },
  { key: "globe", icon: Globe, label: "Internacional" },
  { key: "car", icon: Car, label: "Vehículos" },
  { key: "key", icon: KeyRound, label: "Alquiler" },
  { key: "compass", icon: Compass, label: "Turismo" },
  { key: "building", icon: Building2, label: "Empresa" },
  { key: "wallet", icon: Wallet, label: "Finanzas" },
  { key: "tag", icon: Tag, label: "Retail" },
  { key: "utensils", icon: Utensils, label: "Restaurante" },
  { key: "stethoscope", icon: Stethoscope, label: "Salud" },
  { key: "graduation", icon: GraduationCap, label: "Educación" },
  { key: "home", icon: Home, label: "Bienes raíces" },
  { key: "dumbbell", icon: Dumbbell, label: "Gimnasio" },
  { key: "scissors", icon: Scissors, label: "Belleza / peluquería" },
  { key: "scale", icon: Scale, label: "Legal" },
  { key: "landmark", icon: Landmark, label: "Banca" },
  { key: "cpu", icon: Cpu, label: "Tecnología" },
  { key: "camera", icon: Camera, label: "Fotografía" },
  { key: "party", icon: PartyPopper, label: "Eventos" },
  { key: "shirt", icon: Shirt, label: "Moda" },
  { key: "paw", icon: PawPrint, label: "Mascotas" },
  { key: "hardhat", icon: HardHat, label: "Construcción" },
  { key: "wheat", icon: Wheat, label: "Agro" },
  { key: "music", icon: Music, label: "Entretenimiento" },
  { key: "sofa", icon: Sofa, label: "Hogar / mobiliario" },
  { key: "coffee", icon: Coffee, label: "Café" },
  { key: "bed", icon: BedDouble, label: "Hotelería" },
  { key: "truck", icon: Truck, label: "Logística" },
  { key: "fuel", icon: Fuel, label: "Gasolinera" },
  { key: "pill", icon: Pill, label: "Farmacia" },
  { key: "bookopen", icon: BookOpen, label: "Librería" },
  { key: "factory", icon: Factory, label: "Industria" },
  { key: "gem", icon: Gem, label: "Joyería" },
];

export const CLIENT_COLOR_PALETTE = [
  "#0B7FE3", "#1FA35A", "#3AAE8C", "#D9A716", "#E08A1E", "#D2492B", "#A23B7C", "#6B3FA0", "#2B8CB0", "#7A8C1F",
  "#E85D9E", "#4C5FD5", "#0F766E", "#8B5E34", "#5B6B7A",
];

export const PRIMARY_DEFAULT = "#1D3557";

export const ESTADOS = [
  { id: "pendiente", label: "Por hacer", icon: Clock, dot: "#0B84FF" },
  { id: "proceso", label: "En diseño", icon: PenTool, dot: "#E8B923" },
  { id: "revision", label: "Revisión", icon: Eye, dot: "#F2790A" },
  { id: "listo", label: "Entregado", icon: CheckCircle2, dot: "#2E7D46" },
];

export const DISENADORES = ["Diego Toro", "Ariana Martínez"];

export const PERMISOS_LIST = [
  { key: "editar", label: "Editar campos bloqueados", desc: "Modificar tareas, pagos, publicaciones, facturas, etc. ya creados" },
  { key: "eliminar", label: "Eliminar registros", desc: "Borrar tareas, pagos, clientes, y limpiar el historial" },
  { key: "administrativo", label: "Panel Administrativo", desc: "Entrar a facturación, gastos, accesos y configuración" },
  { key: "verClaves", label: "Ver claves guardadas", desc: "Revelar las contraseñas guardadas en Datos de clientes" },
  { key: "gestionarClientes", label: "Gestionar clientes", desc: "Agregar, editar la apariencia, o eliminar cuentas de clientes" },
  { key: "datosEjemplo", label: "Datos de ejemplo", desc: "Cargar o borrar los datos ficticios de prueba" },
  { key: "gestionarUsuarios", label: "Gestionar usuarios", desc: "Agregar usuarios y asignarles permisos" },
  { key: "configurarIA", label: "Configurar asistente IA", desc: "Guardar o cambiar la clave de Gemini para el asistente" },
  { key: "configurarIntegraciones", label: "Configurar integraciones", desc: "Conectar o desconectar Google Drive para los adjuntos" },
];

export const PERMISOS_TODOS = Object.fromEntries(PERMISOS_LIST.map((p) => [p.key, true]));

export const PERMISOS_NINGUNO = Object.fromEntries(PERMISOS_LIST.map((p) => [p.key, false]));

export const METODOS_PAGO = ["PayPal", "Zelle", "Transferencia bancaria", "WallyPay", "Efectivo", "Tarjeta", "Otro"];

export const REDES = [
  { name: "Instagram", icon: Camera, color: "#C1443C" },
  { name: "Facebook", icon: ThumbsUp, color: "#1D3557" },
  { name: "TikTok", icon: Music2, color: "#1C1C1E" },
  { name: "WhatsApp", icon: MessageCircle, color: "#2E7D46" },
  { name: "YouTube", icon: Clapperboard, color: "#C1443C" },
];

export const FORMATOS = ["Post", "Reel", "Historia", "Carrusel", "Video"];

export const BRAND_GRADIENT = "linear-gradient(115deg, #0B84FF 0%, #17C3A2 22%, #F4D53E 45%, #F2790A 65%, #C1443C 82%, #6B3FA0 100%)";

export const ALL_ACCOUNTS_GRADIENT = "linear-gradient(115deg, #17181A 0%, #1C1C1E 30%, #1E3A5F 42%, #0B84FF 52%, #17C3A2 62%, #F4D53E 72%, #F2790A 81%, #C1443C 89%, #6B3FA0 96%, #E85D9E 100%)";

export const ADMIN_PRIMARY = "#797D82";

export const ADMIN_GRADIENT = "linear-gradient(120deg, #6B6E72 0%, #86898D 55%, #A3A6AA 100%)";

export const NOTE_COLORS = ["#FFFFFF", "#FEF7CD", "#D7F2DD", "#D6E7FA", "#FBDCE4", "#EBDCF9"];

export const NOTE_SIZES = [
  { value: "standard", label: "Estándar", short: "S" },
  { value: "medium", label: "Intermedio (como una hoja)", short: "M" },
  { value: "wide", label: "Ancho completo", short: "L" },
];

export const NOTE_TAGS = [
  { key: "pautas", label: "Pautas", color: "#0B7FE3" },
  { key: "reuniones", label: "Reuniones", color: "#7A8C1F" },
  { key: "decisiones", label: "Decisiones", color: "#A23B7C" },
  { key: "ideas", label: "Ideas", color: "#E08A1E" },
];

export const EXPENSE_CATEGORIAS = ["Nómina", "Herramienta / software", "Servicio", "Otro"];

export const EXPENSE_FRECUENCIAS = ["Mensual", "Anual", "Único"];

export const DEMO_MODULES = [
  { key: "tasks", label: "Creativos", hasEmpresa: true },
  { key: "posts", label: "Planificación", hasEmpresa: true },
  { key: "notes", label: "Notas", hasEmpresa: true },
  { key: "payments", label: "Pagos publicitarios", hasEmpresa: true },
  { key: "invoices", label: "Facturas", hasEmpresa: true },
  { key: "accesos", label: "Accesos", hasEmpresa: true },
  { key: "tareasGenerales", label: "Tareas generales", hasEmpresa: false },
  { key: "expenses", label: "Gastos / nómina", hasEmpresa: false },
];

export const DEMO_MODULE_KEYS = DEMO_MODULES.map((m) => m.key);

export const TAREA_ESTADOS = [
  { id: "pendiente", label: "Pendiente", color: "#0B84FF" },
  { id: "completado", label: "Completado", color: "#2E7D46" },
  { id: "incompleto", label: "Incompleto", color: "#C1443C" },
  { id: "correccion", label: "Corrección", color: "#E8B923" },
];

export const PLATAFORMAS = ["Instagram", "Facebook", "TripAdvisor", "Microsoft", "Otro"];

export const SEARCH_TYPE_META = {
  tarea: { label: "Creativos", icon: LayoutGrid },
  nota: { label: "Notas", icon: StickyNote },
  pago: { label: "Pagos publicitarios", icon: Wallet },
  post: { label: "Planificación", icon: CalendarDays },
  tareaGeneral: { label: "Tareas generales", icon: ListChecks },
  factura: { label: "Facturas", icon: Receipt },
  acceso: { label: "Accesos", icon: KeyRound },
};
