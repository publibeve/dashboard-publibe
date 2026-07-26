/**
 * El archivo original no tenía funciones de validación separadas: cada modal
 * (NewTaskModal, NewPaymentModal, etc.) valida sus propios campos inline, en el
 * mismo componente. Se dejaron así para no alterar su comportamiento.
 *
 * Este archivo queda como el lugar natural para centralizar esa validación a
 * futuro. Dos validadores genéricos, sí usados en varios modales del original,
 * se centralizan acá:
 */

export function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}
