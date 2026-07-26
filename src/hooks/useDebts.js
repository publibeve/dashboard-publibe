import { useState, useEffect } from "react";
import { loadDebts, persistDebts, loadSaldosFavor, persistSaldosFavor, DEBTS_KEY, SALDOS_FAVOR_KEY } from "../services/data.service";
import { fmtMonto } from "../utils/helpers";
import { subscribeKvKey } from "../services/supabaseClient";
import { useRealtimeReload } from "./useRealtimeSync";

export function useDebts(logActivity, setAppError) {
  const [debts, setDebts] = useState(null);
  const [saldosFavor, setSaldosFavor] = useState(null);

  useEffect(() => {
    loadDebts().then((d) => setDebts(d));
    loadSaldosFavor().then((s) => setSaldosFavor(s));
  }, []);

  useRealtimeReload(
    (onChange) => subscribeKvKey(DEBTS_KEY, onChange),
    () => loadDebts().then((d) => setDebts(d))
  );
  useRealtimeReload(
    (onChange) => subscribeKvKey(SALDOS_FAVOR_KEY, onChange),
    () => loadSaldosFavor().then((s) => setSaldosFavor(s))
  );

  function updateDebts(next) { setDebts(next); persistDebts(next); }
  function addDebt(d) {
    try { updateDebts([...(debts || []), d]); logActivity(`Se registró pendiente: ${d.concepto} (${fmtMonto(d.monto)})`); }
    catch (e) { setAppError("No se pudo registrar el pendiente: " + (e && e.message ? e.message : e)); }
  }
  function resolveDebt(id) {
    try {
      const d = (debts || []).find((x) => x.id === id);
      updateDebts((debts || []).filter((x) => x.id !== id));
      if (d) logActivity(`Se marcó como pagado: ${d.concepto} (${fmtMonto(d.monto)})`);
    } catch (e) { setAppError("No se pudo actualizar el pendiente: " + (e && e.message ? e.message : e)); }
  }
  function updateSaldosFavor(next) { setSaldosFavor(next); persistSaldosFavor(next); }
  function addSaldoFavor(s) {
    try { updateSaldosFavor([...(saldosFavor || []), s]); logActivity(`Se registró saldo a favor: ${fmtMonto(s.monto)} (${s.empresa})`); }
    catch (e) { setAppError("No se pudo registrar el saldo a favor: " + (e && e.message ? e.message : e)); }
  }
  function removeSaldoFavor(id) {
    try {
      const s = (saldosFavor || []).find((x) => x.id === id);
      updateSaldosFavor((saldosFavor || []).filter((x) => x.id !== id));
      if (s) logActivity(`Se usó/quitó saldo a favor: ${fmtMonto(s.monto)} (${s.empresa})`);
    } catch (e) { setAppError("No se pudo actualizar el saldo a favor: " + (e && e.message ? e.message : e)); }
  }

  return {
    debts, setDebts, updateDebts, addDebt, resolveDebt,
    saldosFavor, setSaldosFavor, updateSaldosFavor, addSaldoFavor, removeSaldoFavor,
  };
}
