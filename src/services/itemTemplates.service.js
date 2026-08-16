import { readJSON, writeJSON } from "./storage.service";

const ITEM_TEMPLATES_KEY = "publibe-item-templates-v1";

/**
 * Plantillas de ítems reutilizables para Facturas — cada una es una
 * descripción de texto fija (con sus propios sub-ítems, opcionales,
 * reusando la MISMA estructura que ya usa un ítem normal del recibo) que
 * se puede insertar de un clic al armar una factura, dejando el monto en
 * blanco para completar cada vez (los precios varían mes a mes, la
 * descripción no).
 *
 * `empresa: null` → plantilla general, disponible para cualquier cliente.
 * `empresa: "NombreCliente"` → solo aparece al facturar a ese cliente.
 */
export async function loadItemTemplates() {
  return await readJSON(ITEM_TEMPLATES_KEY, true, []);
}
export async function persistItemTemplates(list) {
  await writeJSON(ITEM_TEMPLATES_KEY, list, true);
}

/** Las que le sirven a un cliente puntual: las generales + las suyas propias. */
export function templatesForClient(templates, empresa) {
  return (templates || []).filter((t) => !t.empresa || t.empresa === empresa);
}
