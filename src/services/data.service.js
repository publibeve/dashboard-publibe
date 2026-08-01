import {
  Car,
} from "lucide-react";
import { stripAttachments, todayISO, uid } from "../utils/helpers";
import { readJSON, writeJSON } from "./storage.service";
import { loadObjectsTable, syncObjectsTable } from "./supabaseClient";

// Evita "resembrar" los datos de ejemplo cada vez que una tabla está vacía de
// verdad (por ejemplo, porque se borró todo a propósito). Solo se siembra la
// primera vez que se usa cada tabla.
async function wasSeeded(domain) {
  return await readJSON(`publibe-seeded-${domain}`, true, false);
}
async function markSeeded(domain) {
  await writeJSON(`publibe-seeded-${domain}`, true, true);
}

export const DRIVE_CONNECTED_STORAGE = "publibe-drive-connected-mock-v1";

export async function loadDriveConnected() {
  return await readJSON(DRIVE_CONNECTED_STORAGE, true, false);
}

export async function persistDriveConnected(val) {
  await writeJSON(DRIVE_CONNECTED_STORAGE, val, true);
}

export const LAST_BACKUP_STORAGE = "publibe-last-backup-v1";

export async function loadLastBackupDate() {
  return await readJSON(LAST_BACKUP_STORAGE, true, null);
}

export async function persistLastBackupDate(iso) {
  await writeJSON(LAST_BACKUP_STORAGE, iso, true);
}

export function buildBackupPayload(data) {
  return {
    generadoPor: "publiBe — backup manual",
    generadoEl: new Date().toISOString(),
    version: 1,
    datos: {
      tareasCreativos: stripAttachments(data.tasks),
      pagosPublicitarios: stripAttachments(data.payments),
      publicaciones: stripAttachments(data.posts),
      pendientesPorCobrar: stripAttachments(data.debts),
      notas: stripAttachments(data.notes),
      tareasGenerales: stripAttachments(data.tareasGenerales),
      inversionesPublicitarias: stripAttachments(data.inversiones),
      facturas: stripAttachments(data.invoices),
      gastosYNomina: stripAttachments(data.expenses),
      accesosDeClientes: data.accesos || [],
    },
  };
}

export function downloadBackup(data) {
  const payload = buildBackupPayload(data);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `publibe-backup-${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const STORE_KEY = "publibe-tasks-v2";

export function demoTask() {
  return {
    id: uid(),
    titulo: "Flyer promoción 50% repuestos de inyección",
    empresa: "ToyoReyna",
    asignado: "Ariana Martínez",
    fechaSolicitud: todayISO(),
    fechaEntrega: todayISO(),
    notas: "Debe decir en grande 'Promoción 50%'. Usar fotos de tren delantero. Colores rojo y negro de marca. Formato 1080x1350 para Instagram.",
    estado: "listo",
    comentarios: [
      { id: uid(), autor: "Diego Toro", texto: "Quedó bien, solo sube un poco el tamaño del precio para que se lea desde el feed.", fecha: new Date().toISOString() },
      { id: uid(), autor: "Ariana Martínez", texto: "Listo, lo agrandé y subí la versión final a la carpeta de OneDrive.", fecha: new Date().toISOString() },
    ],
    archivos: [
      { id: uid(), nombre: "flyer-promo-50-final.png", url: "https://onedrive.live.com/edit?id=EJEMPLO-reemplaza-por-tu-link-real" },
      { id: uid(), nombre: "flyer-promo-50.ai", url: "https://onedrive.live.com/edit?id=EJEMPLO-reemplaza-por-tu-link-real" },
    ],
  };
}

export function demoTasks() {
  // Datos ficticios para visualizar el tablero con variedad de estados y clientes.
  // TransfersMérida queda fuera a propósito: su información es real y sensible.
  return [
    demoTask(),
    { id: uid(), titulo: "Post de nuevo stock de correas de distribución", empresa: "ToyoReyna", asignado: "Diego Toro", fechaSolicitud: "2026-06-14", fechaEntrega: "2026-06-19", notas: "Formato cuadrado para feed y vertical para historias.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Flyer promoción de frenos y pastillas", empresa: "ToyoReyna", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-13", fechaEntrega: "2026-06-17", notas: "Debe llevar el logo en la esquina superior derecha, colores de marca.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Banner para local: repuestos de inyección", empresa: "ToyoReyna", asignado: "Diego Toro", fechaSolicitud: "2026-05-25", fechaEntrega: "2026-07-03", notas: "Formato cuadrado para feed y vertical para historias.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Carrusel: kits de suspensión disponibles", empresa: "ToyoReyna", asignado: "Diego Toro", fechaSolicitud: "2026-06-15", fechaEntrega: "2026-06-23", notas: "Revisar con el cliente antes de publicar, aún no está aprobado el copy.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Promoción de baterías para el fin de semana", empresa: "ToyoReyna", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-25", fechaEntrega: "2026-07-01", notas: "Formato cuadrado para feed y vertical para historias.", estado: "revision", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Reel mostrando repuestos originales vs genéricos", empresa: "ToyoReyna", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-11", fechaEntrega: "2026-07-11", notas: "", estado: "listo", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Diseño de catálogo de amortiguadores", empresa: "ToyoReyna", asignado: "Diego Toro", fechaSolicitud: "2026-06-07", fechaEntrega: "2026-06-27", notas: "El cliente pidió que se vea más minimalista, menos texto.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Carrusel: kits de suspensión disponibles", empresa: "ToyoMercedes", asignado: "Diego Toro", fechaSolicitud: "2026-06-02", fechaEntrega: "2026-07-14", notas: "El cliente pidió que se vea más minimalista, menos texto.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Historia de descuento en filtros de aceite", empresa: "ToyoMercedes", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-13", fechaEntrega: "2026-07-10", notas: "Incluir el número de WhatsApp visible.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de temporada: revisión antes de viajar", empresa: "ToyoMercedes", asignado: "Diego Toro", fechaSolicitud: "2026-06-04", fechaEntrega: "2026-06-19", notas: "Formato cuadrado para feed y vertical para historias.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Promoción de baterías para el fin de semana", empresa: "ToyoMercedes", asignado: "Ariana Martínez", fechaSolicitud: "2026-06-03", fechaEntrega: "2026-07-05", notas: "Usar tipografía bold para el titular, que se lea bien en móvil.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Flyer promoción de frenos y pastillas", empresa: "ToyoMercedes", asignado: "Diego Toro", fechaSolicitud: "2026-05-13", fechaEntrega: "2026-07-08", notas: "Usar tipografía bold para el titular, que se lea bien en móvil.", estado: "revision", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Reel mostrando repuestos originales vs genéricos", empresa: "ToyoMercedes", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-16", fechaEntrega: "2026-07-14", notas: "Usar tipografía bold para el titular, que se lea bien en móvil.", estado: "listo", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de nuevo stock de correas de distribución", empresa: "ToyoMercedes", asignado: "Diego Toro", fechaSolicitud: "2026-06-04", fechaEntrega: "2026-06-25", notas: "Incluir el número de WhatsApp visible.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Diseño de tarjeta de presentación del taller", empresa: "ToyoCare Services", asignado: "Diego Toro", fechaSolicitud: "2026-05-21", fechaEntrega: "2026-07-04", notas: "Revisar con el cliente antes de publicar, aún no está aprobado el copy.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Flyer de promoción de cambio de aceite", empresa: "ToyoCare Services", asignado: "Diego Toro", fechaSolicitud: "2026-05-21", fechaEntrega: "2026-07-01", notas: "Incluir el número de WhatsApp visible.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Reel del taller mostrando el proceso de servicio", empresa: "ToyoCare Services", asignado: "Ariana Martínez", fechaSolicitud: "2026-06-15", fechaEntrega: "2026-06-24", notas: "Revisar con el cliente antes de publicar, aún no está aprobado el copy.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Banner de servicio express de 30 minutos", empresa: "ToyoCare Services", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-14", fechaEntrega: "2026-06-24", notas: "", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de alineación y balanceo con descuento", empresa: "ToyoCare Services", asignado: "Diego Toro", fechaSolicitud: "2026-05-31", fechaEntrega: "2026-06-29", notas: "El cliente pidió que se vea más minimalista, menos texto.", estado: "revision", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Historia de cupo disponible esta semana", empresa: "ToyoCare Services", asignado: "Diego Toro", fechaSolicitud: "2026-05-24", fechaEntrega: "2026-07-05", notas: "Revisar con el cliente antes de publicar, aún no está aprobado el copy.", estado: "listo", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Carrusel de testimonios de clientes satisfechos", empresa: "ToyoCare Services", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-24", fechaEntrega: "2026-07-07", notas: "Incluir el número de WhatsApp visible.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de financiamiento disponible", empresa: "ToyoMundial", asignado: "Ariana Martínez", fechaSolicitud: "2026-06-07", fechaEntrega: "2026-07-15", notas: "Formato cuadrado para feed y vertical para historias.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Diseño de ficha técnica para redes", empresa: "ToyoMundial", asignado: "Ariana Martínez", fechaSolicitud: "2026-06-03", fechaEntrega: "2026-06-24", notas: "Usar tipografía bold para el titular, que se lea bien en móvil.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Carrusel comparando modelos disponibles", empresa: "ToyoMundial", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-16", fechaEntrega: "2026-07-11", notas: "Debe llevar el logo en la esquina superior derecha, colores de marca.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Flyer de promoción de fin de mes en modelos 2026", empresa: "ToyoMundial", asignado: "Diego Toro", fechaSolicitud: "2026-05-20", fechaEntrega: "2026-07-07", notas: "Usar tipografía bold para el titular, que se lea bien en móvil.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Reel recorriendo el showroom", empresa: "ToyoMundial", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-15", fechaEntrega: "2026-06-29", notas: "Incluir el número de WhatsApp visible.", estado: "revision", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de vehículo destacado del mes", empresa: "ToyoMundial", asignado: "Ariana Martínez", fechaSolicitud: "2026-06-13", fechaEntrega: "2026-06-25", notas: "Formato cuadrado para feed y vertical para historias.", estado: "listo", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Banner de jornada de puertas abiertas", empresa: "ToyoMundial", asignado: "Diego Toro", fechaSolicitud: "2026-05-18", fechaEntrega: "2026-07-08", notas: "Formato cuadrado para feed y vertical para historias.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Historia de nueva llegada de inventario", empresa: "MundoFord", asignado: "Diego Toro", fechaSolicitud: "2026-06-09", fechaEntrega: "2026-06-17", notas: "Revisar con el cliente antes de publicar, aún no está aprobado el copy.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de financiamiento disponible", empresa: "MundoFord", asignado: "Ariana Martínez", fechaSolicitud: "2026-06-12", fechaEntrega: "2026-07-11", notas: "Usar tipografía bold para el titular, que se lea bien en móvil.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Diseño de ficha técnica para redes", empresa: "MundoFord", asignado: "Diego Toro", fechaSolicitud: "2026-05-30", fechaEntrega: "2026-07-13", notas: "Revisar con el cliente antes de publicar, aún no está aprobado el copy.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Reel recorriendo el showroom", empresa: "MundoFord", asignado: "Diego Toro", fechaSolicitud: "2026-05-20", fechaEntrega: "2026-06-28", notas: "", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de vehículo destacado del mes", empresa: "MundoFord", asignado: "Diego Toro", fechaSolicitud: "2026-06-14", fechaEntrega: "2026-07-11", notas: "Formato cuadrado para feed y vertical para historias.", estado: "revision", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Flyer de promoción de fin de mes en modelos 2026", empresa: "MundoFord", asignado: "Diego Toro", fechaSolicitud: "2026-05-31", fechaEntrega: "2026-07-02", notas: "Debe llevar el logo en la esquina superior derecha, colores de marca.", estado: "listo", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Banner de jornada de puertas abiertas", empresa: "MundoFord", asignado: "Diego Toro", fechaSolicitud: "2026-06-03", fechaEntrega: "2026-07-15", notas: "", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de alquiler con conductor incluido", empresa: "Méri Car Rental", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-15", fechaEntrega: "2026-07-11", notas: "Formato cuadrado para feed y vertical para historias.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Reel mostrando la flota disponible", empresa: "Méri Car Rental", asignado: "Diego Toro", fechaSolicitud: "2026-05-19", fechaEntrega: "2026-07-08", notas: "Incluir el número de WhatsApp visible.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Flyer de tarifas especiales de temporada", empresa: "Méri Car Rental", asignado: "Diego Toro", fechaSolicitud: "2026-05-27", fechaEntrega: "2026-07-03", notas: "", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de promoción de alquiler por fin de semana", empresa: "Méri Car Rental", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-24", fechaEntrega: "2026-07-04", notas: "", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Carrusel de rutas recomendadas para turistas", empresa: "Méri Car Rental", asignado: "Diego Toro", fechaSolicitud: "2026-05-30", fechaEntrega: "2026-06-29", notas: "Revisar con el cliente antes de publicar, aún no está aprobado el copy.", estado: "revision", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Diseño de tarjeta con tarifas por día", empresa: "Méri Car Rental", asignado: "Ariana Martínez", fechaSolicitud: "2026-06-08", fechaEntrega: "2026-07-15", notas: "Formato cuadrado para feed y vertical para historias.", estado: "listo", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Historia de disponibilidad para el feriado", empresa: "Méri Car Rental", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-18", fechaEntrega: "2026-06-24", notas: "Usar tipografía bold para el titular, que se lea bien en móvil.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Flyer de tour a Los Aleros con descuento", empresa: "Atlantic HS Tours", asignado: "Diego Toro", fechaSolicitud: "2026-05-15", fechaEntrega: "2026-07-09", notas: "Revisar con el cliente antes de publicar, aún no está aprobado el copy.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Reel del recorrido por el teleférico", empresa: "Atlantic HS Tours", asignado: "Diego Toro", fechaSolicitud: "2026-05-25", fechaEntrega: "2026-06-19", notas: "Debe llevar el logo en la esquina superior derecha, colores de marca.", estado: "pendiente", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de paquete turístico a Los Llanos", empresa: "Atlantic HS Tours", asignado: "Ariana Martínez", fechaSolicitud: "2026-05-15", fechaEntrega: "2026-07-03", notas: "Usar tipografía bold para el titular, que se lea bien en móvil.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Historia de cupos limitados para excursión", empresa: "Atlantic HS Tours", asignado: "Ariana Martínez", fechaSolicitud: "2026-06-11", fechaEntrega: "2026-06-23", notas: "Formato cuadrado para feed y vertical para historias.", estado: "proceso", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Banner de nuevo paquete familiar", empresa: "Atlantic HS Tours", asignado: "Diego Toro", fechaSolicitud: "2026-06-10", fechaEntrega: "2026-06-24", notas: "", estado: "revision", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Post de promoción de temporada vacacional", empresa: "Atlantic HS Tours", asignado: "Ariana Martínez", fechaSolicitud: "2026-06-06", fechaEntrega: "2026-06-23", notas: "Debe llevar el logo en la esquina superior derecha, colores de marca.", estado: "listo", comentarios: [], archivos: [] },
    { id: uid(), titulo: "Diseño de itinerario para redes", empresa: "Atlantic HS Tours", asignado: "Diego Toro", fechaSolicitud: "2026-06-07", fechaEntrega: "2026-06-28", notas: "Incluir el número de WhatsApp visible.", estado: "pendiente", comentarios: [], archivos: [] }
  ];
}

export async function loadTasks() {
  try {
    const list = await loadObjectsTable("tasks");
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const purged = list.filter((t) => !t.deletedAt || new Date(t.deletedAt).getTime() >= cutoff);
    if (purged.length !== list.length) persist(purged);
    if (list.length || (await wasSeeded("tasks"))) return purged;
  } catch (e) {
    console.error("No se pudo leer la tabla 'tasks' de Supabase, se usará modo local:", e);
  }
  // Tabla vacía y nunca sembrada -> cargamos datos de ejemplo la primera vez.
  const seeded = demoTasks();
  persist(seeded);
  markSeeded("tasks");
  return seeded;
}

export async function persist(tasks) {
  await syncObjectsTable("tasks", tasks);
}

export const PAYMENTS_KEY = "publibe-payments-v6";

export function demoPayments() {
  // Historial real de pagos de publicidad de TransfersMérida, reconstruido desde
  // "ADS_TRANSFERSMERIDA - Relación de pagos.xlsx", desglosando qué semana(s)
  // cubrió cada abono y cuánto de cada una. Cada línea del desglose lleva la fecha
  // real de esa semana de inversión (no la fecha del pago).
  return [
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-01-14", monto: 90.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 54889.2, tasaCambio: 609.88, refBancaria: "7404 + 1886", nota: "Dos transferencias 42691,60 + 12197,60", cobertura: [{ id: uid(), semana: "29 al 04 enero", monto: 90.0, fecha: "2025-12-29" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-01-20", monto: 90.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 39689.1, tasaCambio: 440.99, refBancaria: "4671", nota: "", cobertura: [{ id: uid(), semana: "5 al 11 enero", monto: 90.0, fecha: "2026-01-05" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-01-22", monto: 40.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 18395.6, tasaCambio: 459.89, refBancaria: "3641", nota: "", cobertura: [{ id: uid(), semana: "12 al 18 enero", monto: 40.0, fecha: "2026-01-12" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-01-29", monto: 50.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 26600.0, tasaCambio: 532.0, refBancaria: "8812", nota: "", cobertura: [{ id: uid(), semana: "12 al 18 enero", monto: 50.0, fecha: "2026-01-12" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-02-02", monto: 50.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 25880.5, tasaCambio: 517.61, refBancaria: "1044", nota: "", cobertura: [{ id: uid(), semana: "19 al 25 enero", monto: 50.0, fecha: "2026-01-19" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-02-02", monto: 100.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 52300.0, tasaCambio: 523.0, refBancaria: "3071", nota: "Son los 'USDT' que Elizabeth abonó, fueron en Bs. Usó Mercantil", cobertura: [{ id: uid(), semana: "19 al 25 ene", monto: 40.0, fecha: "2026-01-19" }, { id: uid(), semana: "26 al 01 feb", monto: 60.0, fecha: "2026-01-26" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-02-05", monto: 30.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 16452.9, tasaCambio: 548.43, refBancaria: "7195", nota: "", cobertura: [{ id: uid(), semana: "26 al 1 feb", monto: 30.0, fecha: "2026-01-26" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-02-18", monto: 40.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 21901.2, tasaCambio: 547.53, refBancaria: "3617", nota: "", cobertura: [{ id: uid(), semana: "2 al 8 feb (abono)", monto: 40.0, fecha: "2026-02-02" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-02-24", monto: 100.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 55477.0, tasaCambio: 554.77, refBancaria: "3508", nota: "Abono temporal en ItalBank mientras pasaba la TDD.", cobertura: [{ id: uid(), semana: "2 al 8 feb", monto: 45.0, fecha: "2026-02-02" }, { id: uid(), semana: "9 al 15 feb", monto: 55.0, fecha: "2026-02-09" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-03-09", monto: 50.0, metodoPago: "Transferencia bancaria", moneda: "Bs", montoBs: 29802.98, tasaCambio: 596.06, refBancaria: "8182", nota: "Abono temporal en Binance mientras pasaba la TDD.", cobertura: [{ id: uid(), semana: "9 al 15 feb (abono)", monto: 30.0, fecha: "2026-02-09" }, { id: uid(), semana: "Extra Ferias", monto: 20.0, fecha: "2026-02-09" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-03-13", monto: 308.57, metodoPago: "WallyPay", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "16 al 22 feb", monto: 85.0, fecha: "2026-02-16" }, { id: uid(), semana: "23 al 01 mar", monto: 85.0, fecha: "2026-02-23" }, { id: uid(), semana: "02 al 08 mar", monto: 90.0, fecha: "2026-03-02" }, { id: uid(), semana: "09 al 15 mar (parcial)", monto: 48.57, fecha: "2026-03-09" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-04-01", monto: 309.23, metodoPago: "WallyPay", moneda: "USD", nota: "Se descontó comisión por pagar con tarjeta; semana 30 mar-5 abr se redujo el gasto por 3 días de problemas de facturación.", cobertura: [{ id: uid(), semana: "09 al 15 mar (resto)", monto: 38.57, fecha: "2026-03-09" }, { id: uid(), semana: "17 al 22 mar", monto: 85.0, fecha: "2026-03-17" }, { id: uid(), semana: "Extra GFCDC (12 al 21 mar)", monto: 28.0, fecha: "2026-03-12" }, { id: uid(), semana: "23 al 29 mar", monto: 85.0, fecha: "2026-03-23" }, { id: uid(), semana: "30 mar al 5 abr", monto: 50.0, fecha: "2026-03-30" }, { id: uid(), semana: "6 al 12 abr (abono)", monto: 24.78, fecha: "2026-04-06" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-04-14", monto: 203.74, metodoPago: "WallyPay", moneda: "USD", nota: "Abono", cobertura: [{ id: uid(), semana: "6 al 12 abr (resto)", monto: 60.2, fecha: "2026-04-06" }, { id: uid(), semana: "13 al 19 abr", monto: 85.0, fecha: "2026-04-13" }, { id: uid(), semana: "20 al 26 abr (abono)", monto: 58.54, fecha: "2026-04-20" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-04-29", monto: 203.18, metodoPago: "WallyPay", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "20 al 26 abr (resto)", monto: 26.46, fecha: "2026-04-20" }, { id: uid(), semana: "Extra video 'Mérida es nuestra'", monto: 20.0, fecha: "2026-04-20" }, { id: uid(), semana: "27 abr al 3 may", monto: 85.0, fecha: "2026-04-27" }, { id: uid(), semana: "4 al 10 may (abono)", monto: 71.72, fecha: "2026-05-04" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-05-14", monto: 199.99, metodoPago: "WallyPay", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "4 al 10 may (resto)", monto: 13.28, fecha: "2026-05-04" }, { id: uid(), semana: "Extra Mamás y Mérida", monto: 30.0, fecha: "2026-05-04" }, { id: uid(), semana: "11 al 17 may", monto: 85.0, fecha: "2026-05-11" }, { id: uid(), semana: "Extra AVAVIT", monto: 21.0, fecha: "2026-05-11" }, { id: uid(), semana: "18 al 24 may (abono)", monto: 50.71, fecha: "2026-05-18" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-05-27", monto: 100.0, metodoPago: "WallyPay", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "18 al 24 may (resto)", monto: 47.29, fecha: "2026-05-18" }, { id: uid(), semana: "25 al 31 may (abono)", monto: 52.71, fecha: "2026-05-25" }] },
    { id: uid(), empresa: "TransfersMérida", fecha: "2026-06-17", monto: 299.99, metodoPago: "WallyPay", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "25 al 31 may (resto)", monto: 32.29, fecha: "2026-05-25" }, { id: uid(), semana: "1 al 7 junio", monto: 85.0, fecha: "2026-06-01" }, { id: uid(), semana: "8 al 14 junio", monto: 98.0, fecha: "2026-06-08" }, { id: uid(), semana: "15 al 21 junio", monto: 84.71, fecha: "2026-06-15" }] },
    // --- Datos ficticios del resto de clientes (TransfersMérida queda con su historial real, sin tocar) ---
    { id: uid(), empresa: "ToyoReyna", fecha: "2026-05-10", monto: 64.52, metodoPago: "Tarjeta", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 64.52, fecha: "2026-05-05" }] },
    { id: uid(), empresa: "ToyoReyna", fecha: "2026-06-01", monto: 76.11, metodoPago: "PayPal", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 76.11, fecha: "2026-05-16" }] },
    { id: uid(), empresa: "ToyoReyna", fecha: "2026-05-25", monto: 110.56, metodoPago: "WallyPay", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 110.56, fecha: "2026-06-18" }] },
    { id: uid(), empresa: "ToyoMercedes", fecha: "2026-05-23", monto: 143.32, metodoPago: "PayPal", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 143.32, fecha: "2026-05-14" }] },
    { id: uid(), empresa: "ToyoMercedes", fecha: "2026-05-03", monto: 103.86, metodoPago: "Transferencia bancaria", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 103.86, fecha: "2026-04-15" }] },
    { id: uid(), empresa: "ToyoMercedes", fecha: "2026-04-24", monto: 105.62, metodoPago: "Transferencia bancaria", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 105.62, fecha: "2026-05-21" }] },
    { id: uid(), empresa: "ToyoCare Services", fecha: "2026-06-05", monto: 106.68, metodoPago: "Efectivo", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 106.68, fecha: "2026-04-25" }] },
    { id: uid(), empresa: "ToyoCare Services", fecha: "2026-05-30", monto: 138.95, metodoPago: "Zelle", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 138.95, fecha: "2026-05-13" }] },
    { id: uid(), empresa: "ToyoCare Services", fecha: "2026-04-16", monto: 117.97, metodoPago: "PayPal", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 117.97, fecha: "2026-06-16" }] },
    { id: uid(), empresa: "ToyoMundial", fecha: "2026-06-18", monto: 115.55, metodoPago: "Tarjeta", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 115.55, fecha: "2026-05-06" }] },
    { id: uid(), empresa: "ToyoMundial", fecha: "2026-05-27", monto: 87.44, metodoPago: "Tarjeta", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 87.44, fecha: "2026-05-23" }] },
    { id: uid(), empresa: "ToyoMundial", fecha: "2026-05-21", monto: 112.97, metodoPago: "PayPal", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 112.97, fecha: "2026-05-19" }] },
    { id: uid(), empresa: "MundoFord", fecha: "2026-06-14", monto: 74.02, metodoPago: "WallyPay", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 74.02, fecha: "2026-05-22" }] },
    { id: uid(), empresa: "MundoFord", fecha: "2026-06-01", monto: 116.69, metodoPago: "Efectivo", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 116.69, fecha: "2026-04-27" }] },
    { id: uid(), empresa: "MundoFord", fecha: "2026-05-05", monto: 86.25, metodoPago: "WallyPay", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 86.25, fecha: "2026-05-03" }] },
    { id: uid(), empresa: "Méri Car Rental", fecha: "2026-05-19", monto: 84.67, metodoPago: "PayPal", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 84.67, fecha: "2026-05-19" }] },
    { id: uid(), empresa: "Méri Car Rental", fecha: "2026-05-17", monto: 63.12, metodoPago: "Efectivo", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 63.12, fecha: "2026-05-22" }] },
    { id: uid(), empresa: "Méri Car Rental", fecha: "2026-06-09", monto: 88.60, metodoPago: "Tarjeta", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 88.60, fecha: "2026-05-08" }] },
    { id: uid(), empresa: "Atlantic HS Tours", fecha: "2026-06-15", monto: 92.05, metodoPago: "Tarjeta", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 92.05, fecha: "2026-05-02" }] },
    { id: uid(), empresa: "Atlantic HS Tours", fecha: "2026-04-21", monto: 71.22, metodoPago: "Tarjeta", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 71.22, fecha: "2026-05-23" }] },
    { id: uid(), empresa: "Atlantic HS Tours", fecha: "2026-04-22", monto: 130.03, metodoPago: "Zelle", moneda: "USD", nota: "", cobertura: [{ id: uid(), semana: "Semana de pauta", monto: 130.03, fecha: "2026-05-20" }] },
  ];
}

export async function loadPayments() {
  try {
    const list = await loadObjectsTable("payments");
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const purged = list.filter((p) => !p.deletedAt || new Date(p.deletedAt).getTime() >= cutoff);
    if (purged.length !== list.length) persistPayments(purged);
    if (list.length || (await wasSeeded("payments"))) return purged;
  } catch (e) { console.error("No se pudo leer la tabla 'payments' de Supabase, se usará modo local:", e); }
  const seeded = demoPayments();
  persistPayments(seeded);
  markSeeded("payments");
  return seeded;
}

export async function persistPayments(payments) {
  await syncObjectsTable("payments", payments);
}

export const POSTS_KEY = "publibe-calendar-v3";

export function demoPost() {
  return {
    id: uid(),
    empresa: "ToyoReyna",
    fecha: todayISO(),
    hora: "17:00",
    redSocial: "Instagram",
    formato: "Reel",
    titulo: "Promoción 50% repuestos de inyección",
    copy: "🔧 ¡Promoción del 50%! Repuestos de inyección y tren delantero con garantía. Visítanos o escríbenos por WhatsApp.",
  };
}

export function demoPosts() {
  // Publicaciones ficticias para visualizar la planificación de todos los clientes
  // menos TransfersMérida, que se deja sin tocar por tener información real.
  return [
    demoPost(),
    { id: uid(), empresa: "ToyoReyna", fecha: "2026-06-29", hora: "09:00", redSocial: "Instagram", formato: "Post", titulo: "Post de temporada: revisión antes de viajar", copy: "🔧 Encuentra los mejores repuestos al mejor precio. Visítanos o escríbenos por WhatsApp." },
    { id: uid(), empresa: "ToyoReyna", fecha: "2026-07-16", hora: "14:00", redSocial: "Instagram", formato: "Reel", titulo: "Post de temporada: revisión antes de viajar", copy: "🔧 Encuentra los mejores repuestos al mejor precio. Visítanos o escríbenos por WhatsApp." },
    { id: uid(), empresa: "ToyoReyna", fecha: "2026-06-12", hora: "19:00", redSocial: "WhatsApp", formato: "Reel", titulo: "Historia de descuento en filtros de aceite", copy: "🔧 Encuentra los mejores repuestos al mejor precio. Visítanos o escríbenos por WhatsApp." },
    { id: uid(), empresa: "ToyoReyna", fecha: "2026-06-11", hora: "14:00", redSocial: "WhatsApp", formato: "Reel", titulo: "Post de temporada: revisión antes de viajar", copy: "🔧 Encuentra los mejores repuestos al mejor precio. Visítanos o escríbenos por WhatsApp." },
    { id: uid(), empresa: "ToyoMercedes", fecha: "2026-06-28", hora: "19:00", redSocial: "Instagram", formato: "Post", titulo: "Post de nuevo stock de correas de distribución", copy: "🔧 Encuentra los mejores repuestos al mejor precio. Visítanos o escríbenos por WhatsApp." },
    { id: uid(), empresa: "ToyoMercedes", fecha: "2026-05-31", hora: "09:00", redSocial: "Facebook", formato: "Reel", titulo: "Promoción de baterías para el fin de semana", copy: "🔧 Encuentra los mejores repuestos al mejor precio. Visítanos o escríbenos por WhatsApp." },
    { id: uid(), empresa: "ToyoMercedes", fecha: "2026-07-01", hora: "17:00", redSocial: "Facebook", formato: "Carrusel", titulo: "Post de temporada: revisión antes de viajar", copy: "🔧 Encuentra los mejores repuestos al mejor precio. Visítanos o escríbenos por WhatsApp." },
    { id: uid(), empresa: "ToyoMercedes", fecha: "2026-06-10", hora: "17:00", redSocial: "Instagram", formato: "Carrusel", titulo: "Flyer promoción de frenos y pastillas", copy: "🔧 Encuentra los mejores repuestos al mejor precio. Visítanos o escríbenos por WhatsApp." },
    { id: uid(), empresa: "ToyoCare Services", fecha: "2026-07-20", hora: "17:00", redSocial: "TikTok", formato: "Carrusel", titulo: "Historia de cupo disponible esta semana", copy: "🛠️ Tu vehículo en las mejores manos. Agenda tu cita hoy mismo." },
    { id: uid(), empresa: "ToyoCare Services", fecha: "2026-06-09", hora: "11:00", redSocial: "TikTok", formato: "Reel", titulo: "Banner de servicio express de 30 minutos", copy: "🛠️ Tu vehículo en las mejores manos. Agenda tu cita hoy mismo." },
    { id: uid(), empresa: "ToyoCare Services", fecha: "2026-07-07", hora: "19:00", redSocial: "Instagram", formato: "Historia", titulo: "Post de paquete de mantenimiento preventivo", copy: "🛠️ Tu vehículo en las mejores manos. Agenda tu cita hoy mismo." },
    { id: uid(), empresa: "ToyoCare Services", fecha: "2026-06-03", hora: "19:00", redSocial: "WhatsApp", formato: "Video", titulo: "Post de paquete de mantenimiento preventivo", copy: "🛠️ Tu vehículo en las mejores manos. Agenda tu cita hoy mismo." },
    { id: uid(), empresa: "ToyoMundial", fecha: "2026-06-03", hora: "19:00", redSocial: "Instagram", formato: "Reel", titulo: "Reel recorriendo el showroom", copy: "🚗 Conoce nuestra selección de vehículos disponibles. Financiamiento a tu medida." },
    { id: uid(), empresa: "ToyoMundial", fecha: "2026-07-08", hora: "09:00", redSocial: "Facebook", formato: "Carrusel", titulo: "Flyer de promoción de fin de mes en modelos 2026", copy: "🚗 Conoce nuestra selección de vehículos disponibles. Financiamiento a tu medida." },
    { id: uid(), empresa: "ToyoMundial", fecha: "2026-07-06", hora: "11:00", redSocial: "YouTube", formato: "Video", titulo: "Flyer de promoción de fin de mes en modelos 2026", copy: "🚗 Conoce nuestra selección de vehículos disponibles. Financiamiento a tu medida." },
    { id: uid(), empresa: "ToyoMundial", fecha: "2026-07-09", hora: "09:00", redSocial: "WhatsApp", formato: "Video", titulo: "Post de vehículo destacado del mes", copy: "🚗 Conoce nuestra selección de vehículos disponibles. Financiamiento a tu medida." },
    { id: uid(), empresa: "MundoFord", fecha: "2026-06-16", hora: "11:00", redSocial: "TikTok", formato: "Reel", titulo: "Diseño de ficha técnica para redes", copy: "🚗 Conoce nuestra selección de vehículos disponibles. Financiamiento a tu medida." },
    { id: uid(), empresa: "MundoFord", fecha: "2026-06-25", hora: "11:00", redSocial: "TikTok", formato: "Carrusel", titulo: "Historia de nueva llegada de inventario", copy: "🚗 Conoce nuestra selección de vehículos disponibles. Financiamiento a tu medida." },
    { id: uid(), empresa: "MundoFord", fecha: "2026-07-18", hora: "09:00", redSocial: "Instagram", formato: "Carrusel", titulo: "Diseño de ficha técnica para redes", copy: "🚗 Conoce nuestra selección de vehículos disponibles. Financiamiento a tu medida." },
    { id: uid(), empresa: "MundoFord", fecha: "2026-06-04", hora: "19:00", redSocial: "Facebook", formato: "Video", titulo: "Flyer de promoción de fin de mes en modelos 2026", copy: "🚗 Conoce nuestra selección de vehículos disponibles. Financiamiento a tu medida." },
    { id: uid(), empresa: "Méri Car Rental", fecha: "2026-06-08", hora: "14:00", redSocial: "Instagram", formato: "Reel", titulo: "Reel mostrando la flota disponible", copy: "🔑 Alquila el vehículo perfecto para tu viaje. Reserva ahora." },
    { id: uid(), empresa: "Méri Car Rental", fecha: "2026-06-18", hora: "11:00", redSocial: "WhatsApp", formato: "Video", titulo: "Reel mostrando la flota disponible", copy: "🔑 Alquila el vehículo perfecto para tu viaje. Reserva ahora." },
    { id: uid(), empresa: "Méri Car Rental", fecha: "2026-06-19", hora: "19:00", redSocial: "YouTube", formato: "Post", titulo: "Diseño de tarjeta con tarifas por día", copy: "🔑 Alquila el vehículo perfecto para tu viaje. Reserva ahora." },
    { id: uid(), empresa: "Méri Car Rental", fecha: "2026-07-05", hora: "14:00", redSocial: "Instagram", formato: "Reel", titulo: "Diseño de tarjeta con tarifas por día", copy: "🔑 Alquila el vehículo perfecto para tu viaje. Reserva ahora." },
    { id: uid(), empresa: "Atlantic HS Tours", fecha: "2026-06-07", hora: "09:00", redSocial: "YouTube", formato: "Reel", titulo: "Historia de cupos limitados para excursión", copy: "✈️ Vive una experiencia inolvidable con nuestros paquetes turísticos." },
    { id: uid(), empresa: "Atlantic HS Tours", fecha: "2026-06-18", hora: "19:00", redSocial: "Facebook", formato: "Historia", titulo: "Historia de cupos limitados para excursión", copy: "✈️ Vive una experiencia inolvidable con nuestros paquetes turísticos." },
    { id: uid(), empresa: "Atlantic HS Tours", fecha: "2026-07-13", hora: "14:00", redSocial: "YouTube", formato: "Carrusel", titulo: "Carrusel de destinos disponibles este mes", copy: "✈️ Vive una experiencia inolvidable con nuestros paquetes turísticos." },
    { id: uid(), empresa: "Atlantic HS Tours", fecha: "2026-06-03", hora: "09:00", redSocial: "WhatsApp", formato: "Historia", titulo: "Historia de cupos limitados para excursión", copy: "✈️ Vive una experiencia inolvidable con nuestros paquetes turísticos." }
  ];
}

export async function loadPosts() {
  let list = await readJSON(POSTS_KEY, true, null);
  if (!Array.isArray(list)) list = null;
  if (list) {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const purged = list.filter((p) => !p.deletedAt || new Date(p.deletedAt).getTime() >= cutoff);
    if (purged.length !== list.length) persistPosts(purged);
    return purged;
  }
  const seeded = demoPosts();
  persistPosts(seeded);
  return seeded;
}

export async function persistPosts(posts) {
  await writeJSON(POSTS_KEY, posts, true);
}

export const DEBTS_KEY = "publibe-debts-v1";

export async function loadDebts() {
  const list = await readJSON(DEBTS_KEY, true, []);
  return Array.isArray(list) ? list : [];
}

export async function persistDebts(debts) {
  await writeJSON(DEBTS_KEY, debts, true);
}

export const SALDOS_FAVOR_KEY = "publibe-saldos-favor-v1";

export async function loadSaldosFavor() {
  const list = await readJSON(SALDOS_FAVOR_KEY, true, []);
  return Array.isArray(list) ? list : [];
}

export async function persistSaldosFavor(list) {
  await writeJSON(SALDOS_FAVOR_KEY, list, true);
}

export const NOTES_KEY = "publibe-notes-v4";

export function demoNotes() {
  return [
    {
      id: uid(), empresa: "TransfersMérida", titulo: "Enunciados para post de Transfers",
      tipo: "texto",
      cuerpo: "<h1>Ideas de copy</h1><p><b>¡Viaja seguro, viaja con nosotros!</b> Rutas directas a toda Mérida.</p><p><i>Reserva tu cupo con anticipación</i> y evita quedarte sin puesto.</p>",
      items: [], color: "#FEF7CD", pinned: false, tags: ["Ideas"],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), orden: Date.now() - 1000 * 60 * 60 * 2,
    },
    {
      id: uid(), empresa: "TransfersMérida", titulo: "Pendientes de la semana",
      tipo: "lista",
      cuerpo: "",
      items: [
        { id: uid(), texto: "Grabar reel del terminal nuevo", marcado: false },
        { id: uid(), texto: "Pedir fotos de la flota a Reinaldo", marcado: true },
        { id: uid(), texto: "Revisar comentarios de Instagram", marcado: false },
      ],
      color: "#D7F2DD", pinned: true, tags: ["Pautas"],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), orden: Date.now() - 1000 * 60 * 60 * 26,
    },
    // --- Notas ficticias del resto de clientes (TransfersMérida no se toca) ---
    { id: uid(), empresa: "ToyoReyna", titulo: "Ideas para próxima campaña", tipo: "texto", cuerpo: "<p><b>Ideas para próxima campaña</b></p><p>Revisar tono de comunicación y mantener coherencia con la marca.</p>", items: [], color: "#FFFFFF", pinned: false, tags: ["Pautas"], createdAt: new Date(Date.now() - 327 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 135 * 60 * 60 * 1000 },
    { id: uid(), empresa: "ToyoReyna", titulo: "Ideas para próxima campaña", tipo: "lista", cuerpo: "", items: [{ id: uid(), texto: "Confirmar fecha de publicación", marcado: false }, { id: uid(), texto: "Enviar propuesta al cliente", marcado: true }], color: "#D6E7FA", pinned: false, tags: [], createdAt: new Date(Date.now() - 288 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 5 * 60 * 60 * 1000 },
    { id: uid(), empresa: "ToyoMercedes", titulo: "Ideas para próxima campaña", tipo: "texto", cuerpo: "<p><b>Ideas para próxima campaña</b></p><p>Revisar tono de comunicación y mantener coherencia con la marca.</p>", items: [], color: "#FFFFFF", pinned: false, tags: ["Pautas"], createdAt: new Date(Date.now() - 280 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 19 * 60 * 60 * 1000 },
    { id: uid(), empresa: "ToyoMercedes", titulo: "Pendientes de la semana", tipo: "lista", cuerpo: "", items: [{ id: uid(), texto: "Confirmar fecha de publicación", marcado: false }, { id: uid(), texto: "Enviar propuesta al cliente", marcado: true }], color: "#FBDCE4", pinned: false, tags: ["Pautas"], createdAt: new Date(Date.now() - 221 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 66 * 60 * 60 * 1000 },
    { id: uid(), empresa: "ToyoCare Services", titulo: "Ideas para próxima campaña", tipo: "texto", cuerpo: "<p><b>Ideas para próxima campaña</b></p><p>Revisar tono de comunicación y mantener coherencia con la marca.</p>", items: [], color: "#D7F2DD", pinned: false, tags: ["Ideas"], createdAt: new Date(Date.now() - 461 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 184 * 60 * 60 * 1000 },
    { id: uid(), empresa: "ToyoCare Services", titulo: "Ideas para próxima campaña", tipo: "lista", cuerpo: "", items: [{ id: uid(), texto: "Confirmar fecha de publicación", marcado: false }, { id: uid(), texto: "Enviar propuesta al cliente", marcado: true }], color: "#FEF7CD", pinned: false, tags: ["Ideas"], createdAt: new Date(Date.now() - 182 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 400 * 60 * 60 * 1000 },
    { id: uid(), empresa: "ToyoMundial", titulo: "Referencias de diseño enviadas por el cliente", tipo: "texto", cuerpo: "<p><b>Referencias de diseño enviadas por el cliente</b></p><p>Revisar tono de comunicación y mantener coherencia con la marca.</p>", items: [], color: "#D6E7FA", pinned: false, tags: ["Pautas"], createdAt: new Date(Date.now() - 474 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 477 * 60 * 60 * 1000 },
    { id: uid(), empresa: "ToyoMundial", titulo: "Ideas para próxima campaña", tipo: "lista", cuerpo: "", items: [{ id: uid(), texto: "Confirmar fecha de publicación", marcado: false }, { id: uid(), texto: "Enviar propuesta al cliente", marcado: true }], color: "#FEF7CD", pinned: false, tags: ["Pautas"], createdAt: new Date(Date.now() - 452 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 212 * 60 * 60 * 1000 },
    { id: uid(), empresa: "MundoFord", titulo: "Ideas para próxima campaña", tipo: "texto", cuerpo: "<p><b>Ideas para próxima campaña</b></p><p>Revisar tono de comunicación y mantener coherencia con la marca.</p>", items: [], color: "#FEF7CD", pinned: false, tags: ["Reuniones"], createdAt: new Date(Date.now() - 401 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 477 * 60 * 60 * 1000 },
    { id: uid(), empresa: "MundoFord", titulo: "Pendientes de la semana", tipo: "lista", cuerpo: "", items: [{ id: uid(), texto: "Confirmar fecha de publicación", marcado: false }, { id: uid(), texto: "Enviar propuesta al cliente", marcado: true }], color: "#FEF7CD", pinned: false, tags: ["Reuniones"], createdAt: new Date(Date.now() - 82 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 404 * 60 * 60 * 1000 },
    { id: uid(), empresa: "Méri Car Rental", titulo: "Referencias de diseño enviadas por el cliente", tipo: "texto", cuerpo: "<p><b>Referencias de diseño enviadas por el cliente</b></p><p>Revisar tono de comunicación y mantener coherencia con la marca.</p>", items: [], color: "#FFFFFF", pinned: false, tags: ["Ideas"], createdAt: new Date(Date.now() - 440 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 241 * 60 * 60 * 1000 },
    { id: uid(), empresa: "Méri Car Rental", titulo: "Ideas para próxima campaña", tipo: "lista", cuerpo: "", items: [{ id: uid(), texto: "Confirmar fecha de publicación", marcado: false }, { id: uid(), texto: "Enviar propuesta al cliente", marcado: true }], color: "#FEF7CD", pinned: false, tags: [], createdAt: new Date(Date.now() - 180 * 60 * 60 * 1000).toISOString(), orden: Date.now() - 157 * 60 * 60 * 1000 },
  ];
}

const DEMO_PAUTA_ID = "demo-pauta-1";

function demoPautas() {
  return [
    { id: DEMO_PAUTA_ID, empresa: "TransfersMérida", etiqueta: "Primera pauta", createdAt: new Date(Date.now() - 41 * 60 * 60 * 1000).toISOString() },
  ];
}

export async function loadPautas() {
  try {
    const list = await loadObjectsTable("pautas");
    if (list.length || (await wasSeeded("pautas"))) return list;
  } catch (e) { console.error("No se pudo leer la tabla 'pautas' de Supabase, se usará modo local:", e); }
  const seeded = demoPautas();
  persistPautas(seeded);
  markSeeded("pautas");
  return seeded;
}

export async function persistPautas(pautas) {
  await syncObjectsTable("pautas", pautas);
}

function demoGuiones() {
  // Un guion de ejemplo, chico, para que la pantalla no se vea vacía la
  // primera vez — mismo criterio que demoNotes/demoTasks. "completo" es el
  // mismo campo interno para ambos tipos de bloque (Toma/Secuencia-Voz); la
  // UI le pone la etiqueta correspondiente ("Grabada"/"Voz grabada") según
  // el tipo — ver bloqueLabelCompleto en utils/helpers.js.
  const tomaEj = (planoLugar, queSeRealiza, vozTexto, completo) => ({
    id: uid(), tipo: "toma", planoLugar, queSeRealiza: `<p>${queSeRealiza}</p>`, vozTexto: `<p>${vozTexto}</p>`, linkReferencia: "", completo,
  });
  return [
    {
      id: uid(), empresa: "TransfersMérida", pautaId: DEMO_PAUTA_ID,
      titulo: "Reel — Cómo reservar tu traslado", duracionEstimada: "45 seg",
      categoria: "Contenido de valor", linkReferencia: "", archivoFinal: null,
      bloques: [
        tomaEj("En mostrador, primer plano", "Se muestra la app abierta en el celular", "¿Sabías que podés reservar tu traslado en menos de un minuto?", true),
        tomaEj("Plano medio, afuera del local", "Cliente sube a la unidad con su equipaje", "Así de fácil: reservás, confirmás, y listo.", false),
        tomaEj("Primer plano del conductor", "Saluda a cámara", "Te esperamos.", false),
      ],
      createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export async function loadGuiones() {
  try {
    const list = await loadObjectsTable("guiones");
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const purged = list.filter((g) => !g.deletedAt || new Date(g.deletedAt).getTime() >= cutoff);
    if (purged.length !== list.length) persistGuiones(purged);
    if (list.length || (await wasSeeded("guiones"))) return purged;
  } catch (e) { console.error("No se pudo leer la tabla 'guiones' de Supabase, se usará modo local:", e); }
  const seeded = demoGuiones();
  persistGuiones(seeded);
  markSeeded("guiones");
  return seeded;
}

export async function persistGuiones(guiones) {
  await syncObjectsTable("guiones", guiones);
}

export async function loadNotes() {
  try {
    const list = await loadObjectsTable("notes");
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const purged = list.filter((n) => !n.deletedAt || new Date(n.deletedAt).getTime() >= cutoff);
    if (purged.length !== list.length) persistNotes(purged);
    if (list.length || (await wasSeeded("notes"))) return purged;
  } catch (e) { console.error("No se pudo leer la tabla 'notes' de Supabase, se usará modo local:", e); }
  const seeded = demoNotes();
  persistNotes(seeded);
  markSeeded("notes");
  return seeded;
}

export async function persistNotes(notes) {
  await syncObjectsTable("notes", notes);
}

export const ACTIVITY_KEY = "publibe-activity-log-v1";

export async function loadActivity() {
  const list = await readJSON(ACTIVITY_KEY, true, []);
  return Array.isArray(list) ? list : [];
}

export async function persistActivity(list) {
  await writeJSON(ACTIVITY_KEY, list, true);
}

export const COMMENT_READS_KEY = "publibe-comment-reads-v1";

export async function loadCommentReads() {
  return await readJSON(COMMENT_READS_KEY, true, {});
}

export async function persistCommentReads(map) {
  await writeJSON(COMMENT_READS_KEY, map, true);
}

export const INVOICES_KEY = "publibe-admin-invoices-v3";

export function demoInvoices() {
  // Facturas ficticias para el módulo administrativo. TransfersMérida queda fuera
  // a propósito por tener información financiera real y sensible.
  return [
    { id: uid(), empresa: "Atlantic HS Tours", numeroFactura: "1000", concepto: "Paquete de campaña publicitaria", monto: 178.00, fechaEmision: "2026-06-13", fechaVencimiento: "2026-06-16", pdfUrl: "", nota: "Cliente pagó parcial por Zelle, resto pendiente para la próxima quincena.", abonos: [{ id: uid(), monto: 72.83, fecha: "2026-06-10" }] },
    { id: uid(), empresa: "ToyoReyna", numeroFactura: "1001", concepto: "Paquete de campaña publicitaria", monto: 177.77, fechaEmision: "2026-06-02", fechaVencimiento: "2026-06-15", pdfUrl: "", nota: "Pagó completo por transferencia bancaria el mismo día de emisión.", abonos: [{ id: uid(), monto: 177.77, fecha: "2026-05-30" }] },
    { id: uid(), empresa: "MundoFord", numeroFactura: "1002", concepto: "Diseño gráfico — mensualidad", monto: 206.82, fechaEmision: "2026-05-16", fechaVencimiento: "2026-06-27", pdfUrl: "", nota: "Aún sin abono registrado, se envió recordatorio por WhatsApp.", abonos: [] },
    { id: uid(), empresa: "ToyoMundial", numeroFactura: "1003", concepto: "Diseño gráfico — mensualidad", monto: 127.14, fechaEmision: "2026-05-20", fechaVencimiento: "2026-06-01", pdfUrl: "", nota: "Aún sin abono registrado, factura enviada por correo.", abonos: [] },
    { id: uid(), empresa: "ToyoCare Services", numeroFactura: "1004", concepto: "Gestión de redes sociales — mensualidad", monto: 142.33, fechaEmision: "2026-05-11", fechaVencimiento: "2026-06-11", pdfUrl: "", nota: "Aún sin abono registrado, cliente pidió unos días más para pagar.", abonos: [] },
    { id: uid(), empresa: "Atlantic HS Tours", numeroFactura: "1005", concepto: "Gestión de redes sociales — mensualidad", monto: 184.31, fechaEmision: "2026-06-13", fechaVencimiento: "2026-05-26", pdfUrl: "", nota: "Aún sin abono registrado, pendiente de confirmación del cliente.", abonos: [] },
    { id: uid(), empresa: "MundoFord", numeroFactura: "1006", concepto: "Diseño gráfico — mensualidad", monto: 110.42, fechaEmision: "2026-05-13", fechaVencimiento: "2026-06-04", pdfUrl: "", nota: "Pagó completo en efectivo directamente en el estudio.", abonos: [{ id: uid(), monto: 110.42, fecha: "2026-06-15" }] },
    { id: uid(), empresa: "ToyoReyna", numeroFactura: "1007", concepto: "Diseño gráfico — mensualidad", monto: 250.85, fechaEmision: "2026-05-06", fechaVencimiento: "2026-06-02", pdfUrl: "", nota: "Pagó parcial por WallyPay, resto se acordó para fin de mes.", abonos: [{ id: uid(), monto: 99.19, fecha: "2026-06-10" }] },
    { id: uid(), empresa: "Méri Car Rental", numeroFactura: "1008", concepto: "Diseño de material impreso", monto: 122.88, fechaEmision: "2026-05-04", fechaVencimiento: "2026-06-19", pdfUrl: "", nota: "Pagó completo por Zelle a nombre de Publibe.", abonos: [{ id: uid(), monto: 122.88, fecha: "2026-05-31" }] },
    { id: uid(), empresa: "MundoFord", numeroFactura: "1009", concepto: "Paquete de campaña publicitaria", monto: 221.45, fechaEmision: "2026-06-07", fechaVencimiento: "2026-05-28", pdfUrl: "", nota: "Pagó completo por transferencia, comprobante enviado por correo.", abonos: [{ id: uid(), monto: 221.45, fecha: "2026-05-29" }] }
  ];
}

export async function loadInvoices() {
  try {
    const list = await loadObjectsTable("invoices");
    if (list.length || (await wasSeeded("invoices"))) return list;
  } catch (e) { console.error("No se pudo leer la tabla 'invoices' de Supabase, se usará modo local:", e); }
  const seeded = demoInvoices();
  persistInvoices(seeded);
  markSeeded("invoices");
  return seeded;
}

export async function persistInvoices(list) {
  await syncObjectsTable("invoices", list);
}

export const EXPENSES_KEY = "publibe-admin-expenses-v2";

export const INVERSIONES_KEY = "publibe-inversiones-v3";

export function demoInversiones() {
  const empresa = "TransfersMérida";
  const rows = [
    ["29 al 04 enero", "2025-12-29", 90.00],
    ["5 al 11 enero", "2026-01-05", 90.00],
    ["12 al 18 enero", "2026-01-12", 90.00],
    ["19 al 25 enero", "2026-01-19", 90.00],
    ["26 al 01 feb", "2026-01-26", 90.00],
    ["2 al 8 feb", "2026-02-02", 85.00],
    ["9 al 15 feb", "2026-02-09", 85.00],
    ["Extra Ferias", "2026-02-11", 20.00],
    ["16 al 22 feb", "2026-02-16", 85.00],
    ["23 al 01 mar", "2026-02-23", 90.00],
    ["02 al 08 mar", "2026-03-02", 90.00],
    ["09 al 15 mar", "2026-03-09", 85.00],
    ["17 al 22 mar", "2026-03-17", 85.00],
    ["Extra GFCDC (12 al 21 de mar)", "2026-03-12", 28.00],
    ["23 al 29 mar", "2026-03-23", 85.00],
    ["30 mar al 5 abr", "2026-03-30", 50.00],
    ["6 al 12 abr", "2026-04-06", 85.00],
    ["13 al 19 abr", "2026-04-13", 85.00],
    ["20 al 26 abr", "2026-04-20", 85.00],
    ["Extra video \"Mérida es nuestra\" - Tráfico (20 al 23 de abr)", "2026-04-20", 20.00],
    ["27 de abr al 3 de may", "2026-04-27", 85.00],
    ["4 al 10 de may", "2026-05-04", 85.00],
    ["Extra video (4 al 10 de mayo) - Tráfico", "2026-05-04", 30.00],
    ["11 al 17 de may", "2026-05-11", 85.00],
    ["Extra video (18 al 23 de mayo) - Tráfico", "2026-05-18", 21.00],
    ["18 al 24 de may", "2026-05-18", 85.00],
    ["25 al 31 de may", "2026-05-25", 85.00],
    ["1 al 7 de junio", "2026-06-01", 85.00],
    ["8 al 14 de junio", "2026-06-08", 98.00],
    ["15 al 21 de junio", "2026-06-15", 90.00],
    ["22 al 25 de junio (un abono por la situación del 24 de junio)", "2026-06-22", 45.59],
    ["5 al 12 de junio (aprobado por Elizabeth)", "2026-06-05", 112.00],
    ["13 al 20 de junio", "2026-06-13", 85.00],
  ];
  const meridaRows = rows.map(([semana, fecha, monto]) => ({
    id: uid(), empresa, semana, fecha, monto, desglose: [], createdAt: new Date().toISOString(),
  }));
  // Datos ficticios del resto de clientes (TransfersMérida queda con su historial real, sin tocar).
  const otrosClientes = [
    { id: uid(), empresa: "ToyoReyna", semana: "8 al 14 de mayo", fecha: "2026-05-05", monto: 83.39, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoReyna", semana: "22 al 28 de julio", fecha: "2026-04-23", monto: 49.69, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoReyna", semana: "22 al 28 de junio", fecha: "2026-06-14", monto: 81.11, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoMercedes", semana: "8 al 14 de julio", fecha: "2026-06-16", monto: 72.79, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoMercedes", semana: "22 al 28 de mayo", fecha: "2026-06-04", monto: 58.04, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoMercedes", semana: "1 al 7 de mayo", fecha: "2026-04-30", monto: 74.36, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoCare Services", semana: "8 al 14 de julio", fecha: "2026-06-09", monto: 60.51, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoCare Services", semana: "8 al 14 de mayo", fecha: "2026-05-24", monto: 62.87, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoCare Services", semana: "22 al 28 de julio", fecha: "2026-05-20", monto: 43.00, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoMundial", semana: "15 al 21 de junio", fecha: "2026-05-24", monto: 94.27, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoMundial", semana: "22 al 28 de julio", fecha: "2026-05-30", monto: 83.90, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "ToyoMundial", semana: "22 al 28 de junio", fecha: "2026-05-19", monto: 88.83, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "MundoFord", semana: "15 al 21 de julio", fecha: "2026-05-07", monto: 80.11, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "MundoFord", semana: "15 al 21 de junio", fecha: "2026-05-22", monto: 72.60, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "MundoFord", semana: "8 al 14 de junio", fecha: "2026-04-25", monto: 77.81, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "Méri Car Rental", semana: "1 al 7 de mayo", fecha: "2026-05-12", monto: 54.18, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "Méri Car Rental", semana: "8 al 14 de julio", fecha: "2026-04-30", monto: 48.88, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "Méri Car Rental", semana: "22 al 28 de junio", fecha: "2026-05-04", monto: 38.85, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "Atlantic HS Tours", semana: "1 al 7 de mayo", fecha: "2026-05-25", monto: 62.96, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "Atlantic HS Tours", semana: "1 al 7 de julio", fecha: "2026-06-13", monto: 60.21, desglose: [], createdAt: new Date().toISOString() },
    { id: uid(), empresa: "Atlantic HS Tours", semana: "15 al 21 de junio", fecha: "2026-05-15", monto: 63.62, desglose: [], createdAt: new Date().toISOString() }
  ];
  return [...meridaRows, ...otrosClientes];
}

export async function loadInversiones() {
  const list = await readJSON(INVERSIONES_KEY, true, null);
  if (Array.isArray(list)) return list;
  const seeded = demoInversiones();
  persistInversiones(seeded);
  return seeded;
}

export async function persistInversiones(list) {
  await writeJSON(INVERSIONES_KEY, list, true);
}

export const TAREAS_KEY = "publibe-tareas-generales-v2";

export function demoTareasGenerales() {
  return [
    {
      id: uid(), asignado: "Ariana Martínez", categoria: "Planificación y parte organizativa",
      titulo: "Revisar los archivos/material de todas las cuentas en la carpeta del Drive \"MATERIAL COMPLETO\" y generar grillas de contenido",
      estado: "pendiente", fecha: "2026-05-25", notas: "<p>No está la carpeta. Pendiente para: ToyoReyna, TransfersMérida, ToyoMercedes, ToyoMundial, ToyoCare / El Rey del Amortiguador.</p>",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(), asignado: "Ariana Martínez", categoria: "Reuniones y Coordinación",
      titulo: "Reunión de personal — firma de Acuerdo de colaboración y prestación de servicios",
      estado: "completado", fecha: "2026-05-19", notas: "<p>Lluvia de ideas para gestionar grilla de contenido. Evaluación de desempeño mensual.</p>",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(), asignado: "Diego Toro", categoria: "Contenido mes de marzo",
      titulo: "Generar guiones e ideas para video publicitario anual con TransfersMérida",
      estado: "correccion", fecha: "2026-04-02",
      notas: "<h1>Transfers Mérida: Campaña para Cashea</h1><p><b>Reel de intro o sobre nuevas noticias (Cashea):</b></p><p>En esta se tiene la idea de recrear videos con inteligencia artificial y superposición de texto, con links de reels para tomar como referencia y adaptarlo al nicho de nuestro cliente.</p>",
      createdAt: new Date().toISOString(),
    },
    // --- Tareas generales adicionales, ficticias ---
    { id: uid(), asignado: "Ariana Martínez", categoria: "Planificación y parte organizativa", titulo: "Actualizar calendario de contenido del mes", estado: "correccion", fecha: "2026-06-17", notas: "", createdAt: new Date().toISOString() },
    { id: uid(), asignado: "Diego Toro", categoria: "Contenido mes de julio", titulo: "Editar videos pendientes de la carpeta compartida", estado: "incompleto", fecha: "2026-06-10", notas: "", createdAt: new Date().toISOString() },
    { id: uid(), asignado: "Ariana Martínez", categoria: "Reuniones y Coordinación", titulo: "Reunión de seguimiento quincenal con el equipo", estado: "completado", fecha: "2026-05-26", notas: "", createdAt: new Date().toISOString() },
    { id: uid(), asignado: "Diego Toro", categoria: "Planificación y parte organizativa", titulo: "Organizar carpeta de assets de marca por cliente", estado: "incompleto", fecha: "2026-06-18", notas: "", createdAt: new Date().toISOString() },
    { id: uid(), asignado: "Ariana Martínez", categoria: "Contenido mes de julio", titulo: "Revisar métricas del mes anterior", estado: "completado", fecha: "2026-06-19", notas: "", createdAt: new Date().toISOString() },
    { id: uid(), asignado: "Diego Toro", categoria: "Reuniones y Coordinación", titulo: "Coordinar sesión de fotos para catálogo", estado: "correccion", fecha: "2026-06-11", notas: "", createdAt: new Date().toISOString() },
    { id: uid(), asignado: "Ariana Martínez", categoria: "Planificación y parte organizativa", titulo: "Actualizar plantillas de presupuesto", estado: "pendiente", fecha: "2026-06-21", notas: "", createdAt: new Date().toISOString() },
    { id: uid(), asignado: "Diego Toro", categoria: "Contenido mes de julio", titulo: "Grabar tomas adicionales para reels pendientes", estado: "incompleto", fecha: "2026-06-01", notas: "", createdAt: new Date().toISOString() },
  ];
}

export async function loadTareasGenerales() {
  const list = await readJSON(TAREAS_KEY, true, null);
  if (Array.isArray(list)) return list;
  const seeded = demoTareasGenerales();
  persistTareasGenerales(seeded);
  return seeded;
}

export async function persistTareasGenerales(list) {
  await writeJSON(TAREAS_KEY, list, true);
}

export const ACCESOS_KEY = "publibe-accesos-v2";

export function demoAccesos() {
  // Accesos ficticios para el módulo administrativo. TransfersMérida queda fuera
  // a propósito por tener credenciales reales y sensibles.
  return [
    { id: uid(), empresa: "Méri Car Rental", usuario: "mericarrental.fac", clave: "Publibe2026!", plataforma: "Facebook", plataformaOtro: "" },
    { id: uid(), empresa: "ToyoReyna", usuario: "toyoreyna.fac", clave: "Publibe2026!", plataforma: "Facebook", plataformaOtro: "" },
    { id: uid(), empresa: "ToyoReyna", usuario: "toyoreyna.tri", clave: "Publibe2026!", plataforma: "TripAdvisor", plataformaOtro: "" },
    { id: uid(), empresa: "Atlantic HS Tours", usuario: "atlantichstours.ins", clave: "Publibe2026!", plataforma: "Instagram", plataformaOtro: "" },
    { id: uid(), empresa: "ToyoCare Services", usuario: "toyocareservices.mic", clave: "Publibe2026!", plataforma: "Microsoft", plataformaOtro: "" },
    { id: uid(), empresa: "Méri Car Rental", usuario: "mericarrental.tri", clave: "Publibe2026!", plataforma: "TripAdvisor", plataformaOtro: "" },
    { id: uid(), empresa: "ToyoReyna", usuario: "toyoreyna.mic", clave: "Publibe2026!", plataforma: "Microsoft", plataformaOtro: "" },
    { id: uid(), empresa: "Atlantic HS Tours", usuario: "atlantichstours.mic", clave: "Publibe2026!", plataforma: "Microsoft", plataformaOtro: "" },
    { id: uid(), empresa: "ToyoMundial", usuario: "toyomundial.fac", clave: "Publibe2026!", plataforma: "Facebook", plataformaOtro: "" },
    { id: uid(), empresa: "MundoFord", usuario: "mundoford.mic", clave: "Publibe2026!", plataforma: "Microsoft", plataformaOtro: "" }
  ];
}

export async function loadAccesos() {
  const list = await readJSON(ACCESOS_KEY, true, null);
  if (Array.isArray(list)) return list;
  const seeded = demoAccesos();
  persistAccesos(seeded);
  return seeded;
}

export async function persistAccesos(list) {
  await writeJSON(ACCESOS_KEY, list, true);
}

export function demoExpenses() {
  // Gastos y nómina ficticios para el módulo administrativo (no están ligados a un cliente).
  return [
    { id: uid(), concepto: "Diego Toro — nómina", categoria: "Nómina", monto: 250, frecuencia: "Mensual", proximoPago: "2026-07-03", notas: "" },
    { id: uid(), concepto: "Ariana Martínez — nómina", categoria: "Nómina", monto: 200, frecuencia: "Mensual", proximoPago: "2026-06-15", notas: "" },
    { id: uid(), concepto: "Canva Pro", categoria: "Herramienta / software", monto: 15, frecuencia: "Mensual", proximoPago: "2026-07-14", notas: "" },
    { id: uid(), concepto: "Adobe Creative Cloud", categoria: "Herramienta / software", monto: 55, frecuencia: "Mensual", proximoPago: "2026-06-24", notas: "" },
    { id: uid(), concepto: "Hosting del sitio web", categoria: "Servicio", monto: 80, frecuencia: "Anual", proximoPago: "2026-07-03", notas: "" },
    { id: uid(), concepto: "Internet del estudio", categoria: "Servicio", monto: 45, frecuencia: "Mensual", proximoPago: "2026-07-06", notas: "" },
    { id: uid(), concepto: "Licencia de fuentes tipográficas", categoria: "Herramienta / software", monto: 60, frecuencia: "Único", proximoPago: "2026-07-14", notas: "" },
    { id: uid(), concepto: "Contador — honorarios", categoria: "Servicio", monto: 90, frecuencia: "Mensual", proximoPago: "2026-07-15", notas: "" },
    { id: uid(), concepto: "Mantenimiento de equipos", categoria: "Otro", monto: 120, frecuencia: "Único", proximoPago: "2026-06-27", notas: "" },
    { id: uid(), concepto: "Suscripción banco de imágenes", categoria: "Herramienta / software", monto: 150, frecuencia: "Anual", proximoPago: "2026-06-27", notas: "" }
  ];
}

export async function loadExpenses() {
  const list = await readJSON(EXPENSES_KEY, true, null);
  if (Array.isArray(list)) return list;
  const seeded = demoExpenses();
  persistExpenses(seeded);
  return seeded;
}

export async function persistExpenses(list) {
  await writeJSON(EXPENSES_KEY, list, true);
}
