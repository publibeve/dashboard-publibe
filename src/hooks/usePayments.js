import { useState, useEffect } from "react";
import { loadPayments, persistPayments } from "../services/data.service";
import { fmtMonto } from "../utils/helpers";
import { subscribeTable } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function usePayments(logActivity, setAppError) {
  const [payments, setPayments] = useState(null);
  const [openPaymentId, setOpenPaymentId] = useState(null);

  useEffect(() => {
    loadPayments().then((p) => setPayments(p));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeTable("payments", onChange),
    () => loadPayments().then((p) => setPayments(p))
  );

  function updatePayments(next) { setPayments(next); persistPayments(next); }
  function addPayment(p) {
    try { updatePayments([...(payments || []), p]); logActivity(`Se registró un pago de ${fmtMonto(p.monto)} (${p.empresa})`); }
    catch (e) { setAppError("No se pudo crear el pago: " + (e && e.message ? e.message : e)); }
  }
  function patchPayment(id, patch) {
    try {
      updatePayments((payments || []).map((p) => (p.id === id ? { ...p, ...patch } : p)));
      logActivity(`Se editó un pago (${(payments || []).find((p) => p.id === id)?.empresa || ""})`);
    } catch (e) { setAppError("No se pudo actualizar el pago: " + (e && e.message ? e.message : e)); }
  }
  function deletePayment(id) {
    try {
      const p = (payments || []).find((x) => x.id === id);
      updatePayments((payments || []).map((x) => (x.id === id ? { ...x, deletedAt: new Date().toISOString() } : x)));
      setOpenPaymentId(null);
      if (p) logActivity(`Se envió a la papelera un pago de ${fmtMonto(p.monto)} (${p.empresa})`);
    } catch (e) { setAppError("No se pudo eliminar el pago: " + (e && e.message ? e.message : e)); }
  }
  function restorePayment(id) {
    try {
      updatePayments((payments || []).map((x) => (x.id === id ? { ...x, deletedAt: null } : x)));
      logActivity("Se restauró un pago desde la papelera");
    } catch (e) { setAppError("No se pudo restaurar el pago: " + (e && e.message ? e.message : e)); }
  }
  function purgePayment(id) {
    try { updatePayments((payments || []).filter((x) => x.id !== id)); }
    catch (e) { setAppError("No se pudo eliminar el pago: " + (e && e.message ? e.message : e)); }
  }

  return {
    payments, setPayments, updatePayments, addPayment, patchPayment, deletePayment, restorePayment, purgePayment,
    openPaymentId, setOpenPaymentId,
  };
}
