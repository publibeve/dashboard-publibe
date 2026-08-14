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
