import { useState, useEffect } from "react";
import { loadExpenses, persistExpenses, EXPENSES_KEY } from "../services/data.service";
import { subscribeKvKey } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";
import { fmtMonto } from "../utils/helpers";
import { EXPENSE_CATEGORIAS } from "../utils/constants";

export function useExpenses(logActivity, setAppError) {
  const [expenses, setExpenses] = useState(null);
  const [openExpenseId, setOpenExpenseId] = useState(null);
  const [newExpenseCategoria, setNewExpenseCategoria] = useState(EXPENSE_CATEGORIAS[0]);

  useEffect(() => {
    loadExpenses().then((e) => setExpenses(e));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeKvKey(EXPENSES_KEY, onChange),
    () => loadExpenses().then((e) => setExpenses(e))
  );

  function updateExpenses(next) { setExpenses(next); persistExpenses(next); }
  function addExpense(ex) {
    try { updateExpenses([...(expenses || []), ex]); logActivity(`Se registró un gasto: ${ex.concepto} (${fmtMonto(ex.monto)})`); }
    catch (e) { setAppError("No se pudo crear el gasto: " + (e && e.message ? e.message : e)); }
  }
  function patchExpense(id, patch) {
    try { updateExpenses((expenses || []).map((x) => (x.id === id ? { ...x, ...patch } : x))); logActivity("Se actualizó un gasto"); }
    catch (e) { setAppError("No se pudo actualizar el gasto: " + (e && e.message ? e.message : e)); }
  }
  function deleteExpense(id) {
    try {
      const ex = (expenses || []).find((x) => x.id === id);
      updateExpenses((expenses || []).filter((x) => x.id !== id)); setOpenExpenseId(null);
      if (ex) logActivity(`Se eliminó el gasto: ${ex.concepto}`);
    } catch (e) { setAppError("No se pudo eliminar el gasto: " + (e && e.message ? e.message : e)); }
  }

  return {
    expenses, setExpenses, updateExpenses, addExpense, patchExpense, deleteExpense,
    openExpenseId, setOpenExpenseId, newExpenseCategoria, setNewExpenseCategoria,
  };
}
