import { readJSON, writeJSON } from "./storage.service";

const PAYMENT_INFO_KEY = "publibe-payment-info-v1";
const INVOICE_COUNTER_KEY = "publibe-invoice-counter-v1";
const NOMINA_COUNTER_KEY = "publibe-nomina-counter-v1";

/**
 * Info de pago de publiBe (Pago Móvil, bancos, Zinli, PayPal, contacto) —
 * fija, se carga una sola vez en Configuración general y se reutiliza tal
 * cual en todas las facturas y recibos de nómina que se impriman. Es una
 * lista de {id, label, valor} en vez de campos fijos (Pago Móvil / Banco /
 * etc.) a propósito: así Diego puede agregar, quitar o reordenar los
 * métodos que use sin que el código tenga que anticipar cada uno.
 */
export async function loadPaymentInfo() {
  return await readJSON(PAYMENT_INFO_KEY, true, []);
}
export async function persistPaymentInfo(list) {
  await writeJSON(PAYMENT_INFO_KEY, list, true);
}

const AGENCY_INFO_KEY = "publibe-agency-info-v1";
const AGENCY_INFO_DEFAULT = { rif: "", firmaPersonal: "", correo: "", instagram: "", telefono: "", copyright: "" };
/**
 * Datos fiscales/de contacto de publiBe que van al pie de cada recibo —
 * RIF, firma personal, correo, Instagram, teléfono, línea de copyright.
 * Configurables acá (igual que los métodos de pago) para que un cambio
 * de dato no requiera pedir un cambio de código — se editan una vez y
 * se repiten en todos los recibos que se impriman de ahí en adelante.
 */
export async function loadAgencyInfo() {
  const saved = await readJSON(AGENCY_INFO_KEY, true, null);
  return { ...AGENCY_INFO_DEFAULT, ...(saved || {}) };
}
export async function persistAgencyInfo(info) {
  await writeJSON(AGENCY_INFO_KEY, info, true);
}

/**
 * Numeración automática — un contador global compartido para Facturas y
 * otro, aparte, para Nómina (confirmado con Diego: no es por cliente/
 * persona). No es perfectamente atómico (lee, calcula, guarda — hay una
 * ventana muy chica de carrera si dos personas crean una factura en el
 * mismo instante exacto), pero el volumen real de uso (Diego + Ariana,
 * facturando una vez por mes por cliente) hace ese riesgo prácticamente
 * nulo, y evita necesitar una función de base de datos aparte solo para
 * esto — mismo criterio de simplicidad que ya se usa en el resto de la app.
 */
/**
 * `peekXNumber` — SOLO lee, nunca incrementa. Se usa para mostrar "esta va
 * a ser la próxima" en el formulario apenas se abre, sin gastar el número
 * si Diego termina cerrando sin registrar nada. El número real se pide
 * recién con `nextXNumber` en el momento de guardar de verdad — ese
 * bug (se gastaba un número cada vez que se abría "Nueva factura", aunque
 * no se guardara nada) fue justo lo que reportó Diego.
 */
export async function peekInvoiceNumber() {
  const current = await readJSON(INVOICE_COUNTER_KEY, true, 0);
  return String(Number(current || 0) + 1).padStart(5, "0");
}
export async function peekNominaNumber() {
  const current = await readJSON(NOMINA_COUNTER_KEY, true, 0);
  return String(Number(current || 0) + 1).padStart(5, "0");
}
async function nextNumber(key) {
  const current = await readJSON(key, true, 0);
  const next = Number(current || 0) + 1;
  await writeJSON(key, next, true);
  return String(next).padStart(5, "0");
}
export async function nextInvoiceNumber() {
  return nextNumber(INVOICE_COUNTER_KEY);
}
export async function nextNominaNumber() {
  return nextNumber(NOMINA_COUNTER_KEY);
}
/** Para "reiniciar" el contador desde Configuración general, si hace falta. */
export async function setInvoiceCounter(n) {
  await writeJSON(INVOICE_COUNTER_KEY, Number(n) || 0, true);
}
export async function setNominaCounter(n) {
  await writeJSON(NOMINA_COUNTER_KEY, Number(n) || 0, true);
}
export async function loadInvoiceCounter() {
  return await readJSON(INVOICE_COUNTER_KEY, true, 0);
}
export async function loadNominaCounter() {
  return await readJSON(NOMINA_COUNTER_KEY, true, 0);
}

/**
 * Al borrar un recibo/factura, el número que tenía SOLO se libera para
 * reutilizar si era el más alto en uso (el último creado) — si se borra
 * uno de en medio, el contador no se toca: el número borrado queda
 * "perdido" para siempre, para no chocar con documentos posteriores que
 * ya usan números más altos. `numero` viene con el padding de 5 dígitos
 * ("00009") tal como se guarda en el documento — se compara como número,
 * no como texto, para que el padding no afecte la comparación.
 */
async function releaseNumberIfLast(key, numero) {
  const n = Number(numero);
  if (!n || isNaN(n)) return;
  const current = Number((await readJSON(key, true, 0)) || 0);
  if (n === current) {
    await writeJSON(key, current - 1, true);
  }
}
export async function releaseInvoiceNumberIfLast(numeroFactura) {
  await releaseNumberIfLast(INVOICE_COUNTER_KEY, numeroFactura);
}
export async function releaseNominaNumberIfLast(numeroRecibo) {
  await releaseNumberIfLast(NOMINA_COUNTER_KEY, numeroRecibo);
}
