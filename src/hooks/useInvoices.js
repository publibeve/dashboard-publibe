import { useState, useEffect } from "react";
import { loadInvoices, persistInvoices } from "../services/data.service";
import { fmtMonto } from "../utils/helpers";
import { subscribeTable } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function useInvoices(logActivity, setAppError) {
  const [invoices, setInvoices] = useState(null);
  const [openInvoiceId, setOpenInvoiceId] = useState(null);

  useEffect(() => {
    loadInvoices().then((i) => setInvoices(i));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeTable("invoices", onChange),
    () => loadInvoices().then((i) => setInvoices(i))
  );

  function updateInvoices(next) { setInvoices(next); persistInvoices(next); }
  function addInvoice(inv) {
    try { updateInvoices([...(invoices || []), inv]); logActivity(`Se registró una factura a ${inv.empresa} (${fmtMonto(inv.monto)})`); }
    catch (e) { setAppError("No se pudo crear la factura: " + (e && e.message ? e.message : e)); }
  }
  function patchInvoice(id, patch) {
    try { updateInvoices((invoices || []).map((i) => (i.id === id ? { ...i, ...patch } : i))); logActivity("Se actualizó una factura"); }
    catch (e) { setAppError("No se pudo actualizar la factura: " + (e && e.message ? e.message : e)); }
  }
  function deleteInvoice(id) {
    try {
      const inv = (invoices || []).find((x) => x.id === id);
      updateInvoices((invoices || []).filter((x) => x.id !== id)); setOpenInvoiceId(null);
      if (inv) logActivity(`Se eliminó la factura a ${inv.empresa}`);
    } catch (e) { setAppError("No se pudo eliminar la factura: " + (e && e.message ? e.message : e)); }
  }

  return {
    invoices, setInvoices, updateInvoices, addInvoice, patchInvoice, deleteInvoice,
    openInvoiceId, setOpenInvoiceId,
  };
}
