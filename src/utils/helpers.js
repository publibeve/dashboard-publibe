import {
  Plus,
  Building2,
  Paperclip,
  PenTool,
  Trash2,
  Image as ImageIcon,
  FileType,
  Tag,
} from "lucide-react";
import { CLIENTES, ICONS_CATALOG, NOTE_TAGS, PRIMARY_DEFAULT, REDES, TAREA_ESTADOS, GUION_CATEGORIAS, BLOQUE_TIPOS } from "./constants";

export function iconFor(key) { return (ICONS_CATALOG.find((i) => i.key === key) || ICONS_CATALOG[8]).icon; }

export function stripAttachments(list) {
  return (list || []).map((item) => {
    if (!item || typeof item !== "object") return item;
    const { archivos, adjuntos, ...rest } = item;
    return rest;
  });
}

export function redMeta(name) { return REDES.find((r) => r.name === name) || { icon: Tag, color: "#8A8578" }; }

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
}

export function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

export function urgencyColor(iso, estado) {
  if (estado === "listo") return "var(--ok)";
  const days = daysUntil(iso);
  if (days === null) return "var(--border)";
  if (days < 0) return "var(--accent)";
  if (days <= 1) return "var(--accent)";
  if (days <= 3) return "#C98A2C";
  return "var(--primary)";
}

export function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function initial(name) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}

export function fileKind(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["ai"].includes(ext)) return { icon: FileType, color: "#C1443C" };
  if (["pdf"].includes(ext)) return { icon: FileType, color: "#B3261E" };
  if (["psd"].includes(ext)) return { icon: FileType, color: "#1D3557" };
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return { icon: ImageIcon, color: "#2E7D46" };
  return { icon: Paperclip, color: "#8A8578" };
}

export function clientMeta(name) {
  return CLIENTES.find((c) => c.name === name) || { icon: Building2, color: PRIMARY_DEFAULT };
}

export function weekStart(iso) {
  const d = new Date(iso + "T00:00:00");
  const day = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function weekLabel(startIso) {
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `Semana del ${fmtDate(startIso)} – ${fmtDate(end.toISOString().slice(0, 10))}`;
}

export function fmtMonto(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtBs(n) {
  return Number(n || 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Bs.";
}

export function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function darkenHex(hex, amt) {
  const h = hex.replace("#", "");
  const r = Math.round(parseInt(h.substring(0, 2), 16) * (1 - amt));
  const g = Math.round(parseInt(h.substring(2, 4), 16) * (1 - amt));
  const b = Math.round(parseInt(h.substring(4, 6), 16) * (1 - amt));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function noteDetailMaxWidth(size) {
  if (size === "wide") return "min(1200px, 96vw)";
  if (size === "medium") return "min(760px, 92vw)";
  return "480px";
}

export function noteLinkColor(bg) {
  switch (bg) {
    case "#FEF7CD": return "#8A6D06"; // amarilla → mostaza oscuro
    case "#D7F2DD": return "#1F6B3A"; // verde → verde oscuro
    case "#D6E7FA": return "#134A94"; // azul → azul oscuro
    case "#FBDCE4": return "#7A2140"; // rosa/rojiza → vino tinto
    case "#EBDCF9": return "#5A2E92"; // morada → violeta oscuro
    default: return "#0B84FF"; // blanca / sin color → el azul de siempre
  }
}

export function tagColor(tag) {
  const found = NOTE_TAGS.find((t) => t.label.toLowerCase() === tag.toLowerCase());
  return found ? found.color : "#8A8578";
}

export function hasUnreadComments(task, commentReads, currentUser) {
  if (!currentUser || !task || !task.comentarios || task.comentarios.length === 0) return false;
  const others = task.comentarios.filter((c) => c.autor !== currentUser.nombre);
  if (others.length === 0) return false;
  const lastSeen = commentReads?.[currentUser.id]?.[task.id];
  if (!lastSeen) return true;
  const lastSeenTime = new Date(lastSeen).getTime();
  return others.some((c) => new Date(c.fecha).getTime() > lastSeenTime);
}

export function tareaEstadoMeta(id) { return TAREA_ESTADOS.find((e) => e.id === id) || TAREA_ESTADOS[0]; }

export function sumCobertura(cobertura) {
  return (cobertura || []).reduce((s, c) => s + Number(c.monto || 0), 0);
}

export function sumAbonos(abonos) {
  return (abonos || []).reduce((s, a) => s + Number(a.monto || 0), 0);
}

export function invoiceEstado(inv) {
  const abonado = sumAbonos(inv.abonos);
  if (abonado >= Number(inv.monto || 0) - 0.01) return { label: "Pagada", color: "#2E7D46" };
  if (abonado > 0) return { label: "Parcial", color: "#C98A2C" };
  return { label: "Pendiente", color: "#B4432F" };
}

export function monthLabelEs(yyyymm) {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-VE", { month: "long", year: "numeric" });
}

const MESES_ES_CAP = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/**
 * Nombre de subcarpeta de mes para WorkDrive: "Junio 2026", "Julio 2026" —
 * capitalizado, sin "de", distinto al formato de monthLabelEs (que es para
 * texto de UI, no para nombres de carpeta reales). Si no hay fecha, usa hoy
 * — un adjunto que se sube ahora, sin fecha de solicitud cargada, es
 * razonable que caiga en el mes en curso en vez de quedar en una carpeta
 * "sin fecha".
 */
export function monthFolderName(dateISO) {
  const d = dateISO ? new Date(dateISO.length > 10 ? dateISO : dateISO + "T00:00:00") : new Date();
  return `${MESES_ES_CAP[d.getMonth()]} ${d.getFullYear()}`;
}

export function dateSearchBlob(iso) {
  if (!iso) return "";
  const d = new Date(iso.length > 10 ? iso : iso + "T00:00:00");
  const day = String(d.getDate());
  const dayPadded = String(d.getDate()).padStart(2, "0");
  const monthName = d.toLocaleDateString("es-VE", { month: "long" });
  const year = String(d.getFullYear());
  return `${day} ${dayPadded} ${monthName} ${year}`.toLowerCase();
}

export function hsvToHex(h, s, v) {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hexToHsv(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return { h: 210, s: 90, v: 90 };
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255, g = ((int >> 8) & 255) / 255, b = (int & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100 };
}

export function historyIcon(text) {
  if (text.startsWith("Se eliminó")) return { icon: Trash2, color: "#B4432F" };
  if (text.startsWith("Se creó") || text.startsWith("Se agregó") || text.startsWith("Se registró") || text.startsWith("Se programó")) return { icon: Plus, color: "#2E7D46" };
  return { icon: PenTool, color: "#1D3557" };
}

export function fmtNoteDay(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
}

export function fmtNoteDayTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function computeGlobalSearchResults(query, { tasks, notes, payments, invoices, posts, tareasGenerales, accesos, canSeeMontos = false }) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out = [];
  const montoLabel = (v) => (canSeeMontos ? fmtMonto(v) : "•••");
  tasks.forEach((t) => {
    if ((t.titulo || "").toLowerCase().includes(q) || (t.empresa || "").toLowerCase().includes(q) || (t.asignado || "").toLowerCase().includes(q)) {
      out.push({ type: "tarea", id: t.id, label: t.titulo, sub: t.empresa, empresa: t.empresa });
    }
  });
  notes.forEach((n) => {
    const plain = (n.cuerpo || "").replace(/<[^>]+>/g, " ");
    if ((n.titulo || "").toLowerCase().includes(q) || plain.toLowerCase().includes(q)) {
      out.push({ type: "nota", id: n.id, label: n.titulo || "(sin título)", sub: n.empresa, empresa: n.empresa });
    }
  });
  // Ahora que Pagos publicitarios queda oculto por completo sin el permiso
  // (no solo enmascarado), no tiene sentido que la búsqueda global siga
  // devolviendo resultados de pagos para esa persona — llevaría a un
  // callejón sin salida al tocarlos (goToSearchResult intenta abrir una
  // pestaña que ya no existe para ella). montoLabel queda sin uso acá, pero
  // no hace daño dejarlo por si en el futuro se necesita volver a mostrar
  // algo enmascarado en vez de ocultar.
  if (canSeeMontos) {
    payments.forEach((p) => {
      if ((p.nota || "").toLowerCase().includes(q) || (p.metodoPago || "").toLowerCase().includes(q) || (p.empresa || "").toLowerCase().includes(q)) {
        out.push({ type: "pago", id: p.id, label: `Pago ${montoLabel(p.monto)} — ${p.metodoPago}`, sub: p.empresa, empresa: p.empresa });
      }
    });
  }
  invoices.forEach((i) => {
    if ((i.concepto || "").toLowerCase().includes(q) || (i.numeroFactura || "").toLowerCase().includes(q) || (i.empresa || "").toLowerCase().includes(q)) {
      out.push({ type: "factura", id: i.id, label: i.concepto, sub: `${i.empresa}${i.numeroFactura ? " · #" + i.numeroFactura : ""}`, empresa: i.empresa });
    }
  });
  posts.forEach((p) => {
    if ((p.titulo || "").toLowerCase().includes(q) || (p.copy || "").toLowerCase().includes(q) || (p.empresa || "").toLowerCase().includes(q)) {
      out.push({ type: "post", id: p.id, label: p.titulo, sub: `${p.empresa} · ${fmtDate(p.fecha)}`, empresa: p.empresa });
    }
  });
  tareasGenerales.forEach((t) => {
    if ((t.titulo || "").toLowerCase().includes(q) || (t.categoria || "").toLowerCase().includes(q) || (t.asignado || "").toLowerCase().includes(q)) {
      out.push({ type: "tareaGeneral", id: t.id, label: t.titulo, sub: `${t.categoria} · ${t.asignado}` });
    }
  });
  accesos.forEach((a) => {
    if ((a.usuario || "").toLowerCase().includes(q) || (a.plataforma || "").toLowerCase().includes(q) || (a.empresa || "").toLowerCase().includes(q)) {
      out.push({ type: "acceso", id: a.id, label: a.usuario, sub: `${a.plataforma} · ${a.empresa}`, empresa: a.empresa });
    }
  });
  return out.slice(0, 60);
}

export function groupSearchResults(results) {
  const map = new Map();
  results.forEach((r) => {
    if (!map.has(r.type)) map.set(r.type, []);
    map.get(r.type).push(r);
  });
  return [...map.entries()];
}

export function renderMarkdownLite(text) {
  const escaped = (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const lines = escaped.split("\n");
  let html = "";
  let inList = false;
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  lines.forEach((rawLine) => {
    const line = rawLine.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    const bulletMatch = line.match(/^\s*[*\-]\s+(.*)/);
    if (bulletMatch) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${bulletMatch[1]}</li>`;
    } else {
      closeList();
      if (line.trim()) html += `<p>${line}</p>`;
    }
  });
  closeList();
  return html;
}

export function copyToClipboard(text, onDone) {
  function fallbackCopy() {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.left = "-9999px"; ta.style.top = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) onDone();
    } catch (e) { /* no se pudo copiar */ }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onDone).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
}

/* ---- Guiones ---- */

/** Color de una categoría de guion — busca primero en las 6 fijas, después en las que agregó el admin. */
export function guionCategoriaColor(categoria, customCategorias) {
  const fija = GUION_CATEGORIAS.find((c) => c.value === categoria);
  if (fija) return fija.color;
  const custom = (customCategorias || []).find((c) => c.value === categoria);
  return custom ? custom.color : "#FFFFFF";
}

/** Etiqueta de la casilla de "completo" según el tipo de bloque (Toma -> "Grabada", Secuencia/Voz -> "Voz grabada"). */
export function bloqueLabelCompleto(tipo) {
  const t = BLOQUE_TIPOS.find((t) => t.value === tipo);
  return t ? t.labelCompleto : "Completo";
}

/** Nombre corto del tipo de bloque, para mostrar junto al número (ej. "Toma 3", "Secuencia/Voz 4"). */
export function bloqueLabelTipo(tipo) {
  const t = BLOQUE_TIPOS.find((t) => t.value === tipo);
  return t ? t.label : "Bloque";
}

/**
 * "Grabado" es siempre calculado, nunca un campo que se guarda — se deriva
 * de que TODOS los bloques (sea cual sea su tipo) estén marcados como
 * completos. Un guion sin bloques no cuenta como grabado (no hay nada que
 * mostrar como "listo" todavía).
 */
export function guionEstaGrabado(guion) {
  const bloques = guion.bloques || [];
  return bloques.length > 0 && bloques.every((b) => b.completo);
}

/** "Completado" se activa únicamente al adjuntar el archivo final — nunca a mano. */
export function guionEstaCompletado(guion) {
  return (guion.archivosFinal || []).length > 0;
}

/** Progreso de bloques marcados como completos, para la barra de progreso y la tarjeta de lista. */
export function guionProgreso(guion) {
  const bloques = guion.bloques || [];
  const hechos = bloques.filter((b) => b.completo).length;
  return { hechos, total: bloques.length };
}
