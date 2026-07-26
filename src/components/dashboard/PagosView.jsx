import { useState, useMemo } from "react";
import {
  Plus,
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Wallet,
  Megaphone,
  CreditCard,
  TrendingUp,
  Banknote,
  History,
  Tag,
  Printer,
} from "lucide-react";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { EmpresaField } from "../common/EmpresaField";
import { Overlay } from "../common/Overlay";
import { ReportModal } from "../common/ReportModal";
import { clientMeta, dateSearchBlob, fmtBs, fmtDate, fmtMonto, monthLabelEs, todayISO, uid, weekLabel, weekStart } from "../../utils/helpers";

export function PagosView({ payments, trashedPayments, debts, saldosFavor, inversiones, showClient, defaultClient, onOpen, onAddDebt, onResolveDebt, onAddSaldoFavor, onRemoveSaldoFavor, onNewInversion, onOpenInversion, onRestorePayment, onPurgePayment, showTrash, mesFiltro, search, showReportPicker, onCloseReportPicker }) {
  const [subTab, setSubTab] = useState("pagos");
  const [bsOpen, setBsOpen] = useState(false);
  const [usdOpen, setUsdOpen] = useState(false);
  const [bsExpanded, setBsExpanded] = useState(false);
  const [usdExpanded, setUsdExpanded] = useState(false);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [showReport, setShowReport] = useState(false);
  const q = search.trim().toLowerCase();

  const mesesDisponibles = useMemo(() => {
    const set = new Set([
      ...payments.map((p) => p.fecha.slice(0, 7)),
      ...(inversiones || []).map((i) => i.fecha.slice(0, 7)),
    ]);
    return [...set].sort().reverse();
  }, [payments, inversiones]);

  const visiblePayments = mesFiltro === "todos" ? payments : payments.filter((p) => p.fecha.startsWith(mesFiltro));
  const visibleInversiones = mesFiltro === "todos" ? (inversiones || []) : (inversiones || []).filter((i) => i.fecha.startsWith(mesFiltro));

  // "Invertido" ahora viene 100% del módulo independiente de Inversión por semana — no depende de los pagos.
  const totalInvertido = visibleInversiones.reduce((s, i) => s + Number(i.monto || 0), 0);
  // "Pagado" es la suma de los pagos realmente realizados (independiente de la inversión).
  const totalPagado = visiblePayments.reduce((s, p) => s + Number(p.monto || 0), 0);
  const saldoPendiente = (debts || []).reduce((s, d) => s + Number(d.monto || 0), 0);

  // Saldo a favor: ahora es una lista propia e independiente (nota + monto), sin ninguna relación
  // con pagos ni cobertura por semana — vos la manejás manualmente y la elimina cuando ya se usó.
  const saldoFavor = (saldosFavor || []).reduce((s, c) => s + Number(c.monto || 0), 0);

  function inversionBlob(i) {
    return [i.semana, i.monto, i.empresa, dateSearchBlob(i.fecha), ...(i.desglose || []).map((d) => `${d.concepto} ${d.monto}`)].filter(Boolean).join(" ").toLowerCase();
  }
  function paymentBlob(p) {
    return [
      dateSearchBlob(p.fecha), p.metodoPago, p.monto, p.montoBs, p.refBancaria, p.empresa, p.nota,
    ].filter(Boolean).join(" ").toLowerCase();
  }

  const searchedInversiones = q ? visibleInversiones.filter((i) => inversionBlob(i).includes(q)) : visibleInversiones;
  const searchedPayments = q ? visiblePayments.filter((p) => paymentBlob(p).includes(q)) : visiblePayments;

  const investMonths = useMemo(() => {
    const map = new Map();
    // Ordenadas por fecha (más reciente primero) dentro de cada mes, ya que cada una trae su propio texto de semana.
    const sorted = [...searchedInversiones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    sorted.forEach((i) => {
      const mk = i.fecha.slice(0, 7);
      if (!map.has(mk)) map.set(mk, []);
      map.get(mk).push(i);
    });
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [searchedInversiones]);

  function groupByWeek(list) {
    const map = new Map();
    list.forEach((p) => {
      const ws = weekStart(p.fecha);
      if (!map.has(ws)) map.set(ws, []);
      map.get(ws).push(p);
    });
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }
  function limitWeeksByCount(weeks, limit) {
    let count = 0;
    const result = [];
    for (const [ws, items] of weeks) {
      if (count >= limit) break;
      const slice = items.slice(0, limit - count);
      result.push([ws, slice]);
      count += slice.length;
    }
    return result;
  }
  const paymentWeeksUsd = useMemo(() => groupByWeek(searchedPayments.filter((p) => p.moneda !== "Bs")), [searchedPayments]);

  const reportInversiones = useMemo(() => {
    if (!reportFrom || !reportTo) return [];
    return (inversiones || [])
      .filter((i) => i.fecha >= reportFrom && i.fecha <= reportTo)
      .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  }, [inversiones, reportFrom, reportTo]);
  const reportTotalInvertido = reportInversiones.reduce((s, i) => s + Number(i.monto || 0), 0);
  const paymentWeeksBs = useMemo(() => groupByWeek(searchedPayments.filter((p) => p.moneda === "Bs")), [searchedPayments]);

  const pagosBs = useMemo(
    () => searchedPayments.filter((p) => p.moneda === "Bs").sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [searchedPayments]
  );
  const totalBsVES = pagosBs.reduce((s, p) => s + Number(p.montoBs || 0), 0);
  const totalBsUSD = pagosBs.reduce((s, p) => s + Number(p.monto || 0), 0);
  const totalUsdOnly = searchedPayments.filter((p) => p.moneda !== "Bs").reduce((s, p) => s + Number(p.monto || 0), 0);

  function renderPaymentWeeks(weeks) {
    return weeks.map(([ws, items]) => {
      const subtotal = items.reduce((s, p) => s + Number(p.monto || 0), 0);
      return (
        <div className="week-block" key={ws}>
          <div className="week-head">
            <span>{weekLabel(ws)}</span>
            <span className="week-total">{fmtMonto(subtotal)}</span>
          </div>
          <div className="pay-table">
            {items.map((p) => {
              const cm = clientMeta(p.empresa);
              const CmIcon = cm.icon;
              return (
                <button className="pay-row" key={p.id} onClick={() => onOpen(p.id)}>
                  <div className="pay-row-top">
                    <span className="pay-primary">
                      <span className="pay-fecha-label">Pago del</span>
                      <span className="pay-fecha">{fmtDate(p.fecha)}</span>
                      <span className="pay-metodo"><CreditCard size={12} />{p.metodoPago}</span>
                      <span className="pay-monto">{fmtMonto(p.monto)}</span>
                      {p.moneda === "Bs" && <span className="pay-bs-tag"><Banknote size={11} />Bs</span>}
                    </span>
                    <span className="pay-secondary">
                      {showClient && (
                        <span className="pay-empresa" style={{ color: cm.color }}><CmIcon size={12} />{p.empresa}</span>
                      )}
                    </span>
                  </div>
                  {p.moneda === "Bs" && (
                    <div className="pay-bs-detail">
                      <span><b>{fmtBs(p.montoBs)}</b></span>
                      <span>Tasa {p.tasaCambio}</span>
                      {p.refBancaria && <span>Ref. {p.refBancaria}</span>}
                    </div>
                  )}
                  <div className="pay-cobertura">
                    {(p.cobertura || []).length === 0 && <span className="cov-chip cov-empty"><Megaphone size={11} />Sin semana asignada</span>}
                    {(p.cobertura || []).map((c) => (
                      <span className={"cov-chip" + (c.tipo === "abono" ? " cov-chip-abono" : "")} key={c.id}>
                        {c.tipo === "abono" && <Wallet size={10} />} {c.semana} <b>{fmtMonto(c.monto)}</b>
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    });
  }

  return (
    <>
    <main className="pane">
      {mesFiltro !== "todos" && <div className="hint" style={{ marginBottom: 12 }}>Mostrando {monthLabelEs(mesFiltro)}</div>}

      {showTrash ? (
        <section className="overview-section">
          {(trashedPayments || []).length === 0 ? (
            <div className="empty-pane">La papelera de pagos está vacía.</div>
          ) : (
            <>
              <div className="hint trash-hint">Los pagos se eliminan definitivamente 30 días después de enviarlos a la papelera.</div>
              <div className="pay-table">
                {trashedPayments.map((p) => {
                  const cm = clientMeta(p.empresa);
                  const CmIcon = cm.icon;
                  const elapsed = Date.now() - new Date(p.deletedAt).getTime();
                  const daysLeft = Math.max(0, 30 - Math.floor(elapsed / (24 * 60 * 60 * 1000)));
                  return (
                    <div className="pay-row pay-row-trashed" key={p.id}>
                      <div className="pay-row-top">
                        <span className="pay-primary">
                          <span className="pay-fecha">{fmtDate(p.fecha)}</span>
                          <span className="pay-metodo"><CreditCard size={12} />{p.metodoPago}</span>
                          <span className="pay-monto">{fmtMonto(p.monto)}</span>
                        </span>
                        {showClient && <span className="pay-empresa" style={{ color: cm.color }}><CmIcon size={12} />{p.empresa}</span>}
                      </div>
                      <div className="trash-actions">
                        <span className="trash-days-left">Se elimina en {daysLeft} día(s)</span>
                        <button className="btn-secondary" onClick={() => onRestorePayment(p.id)}><History size={12} /> Restaurar</button>
                        <button className="btn-danger-ghost" onClick={() => onPurgePayment(p.id)}><Trash2 size={12} /> Eliminar ya</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      ) : (
        <>
      <div className="summary-row-v2">
        <div className="summary-card-v2 tone-navy">
          <span className="summary-v2-icon"><TrendingUp size={17} /></span>
          <div className="summary-v2-body">
            <span className="summary-v2-label">{mesFiltro === "todos" ? "Total invertido" : `Invertido en ${monthLabelEs(mesFiltro)}`}</span>
            <span className="summary-v2-value">{fmtMonto(totalInvertido)}</span>
          </div>
        </div>
        <div className="summary-card-v2 tone-green">
          <span className="summary-v2-icon"><Wallet size={17} /></span>
          <div className="summary-v2-body">
            <span className="summary-v2-label">{mesFiltro === "todos" ? "Total pagado" : `Pagado en ${monthLabelEs(mesFiltro)}`}</span>
            <span className="summary-v2-value">{fmtMonto(totalPagado)}</span>
          </div>
        </div>
        <div className={"summary-card-v2" + (saldoPendiente > 0 ? " tone-red" : " tone-teal")}>
          <span className="summary-v2-icon">{saldoPendiente > 0 ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}</span>
          <div className="summary-v2-body">
            <span className="summary-v2-label">Saldo pendiente</span>
            <span className="summary-v2-value">{fmtMonto(saldoPendiente)}</span>
          </div>
        </div>
        <div className="summary-card-v2 tone-gold">
          <span className="summary-v2-icon"><Banknote size={17} /></span>
          <div className="summary-v2-body">
            <span className="summary-v2-label">Saldo a favor</span>
            <span className="summary-v2-value">{fmtMonto(Math.max(0, saldoFavor))}</span>
          </div>
        </div>
      </div>

      <div className="debt-section">
        <div className="debt-head">
          <span className="debt-title"><AlertTriangle size={14} /> Por pagar / pendiente</span>
          <button className="btn-secondary" onClick={onAddDebt}><Plus size={13} /> Agregar pendiente</button>
        </div>
        {(debts || []).length === 0 && <div className="hint">No hay saldo pendiente registrado. Todo al día 🎉</div>}
        <div className="debt-list">
          {(debts || []).map((d) => {
            const cm = clientMeta(d.empresa);
            const CmIcon = cm.icon;
            return (
              <div className="debt-row" key={d.id}>
                <span className="debt-concepto">{d.concepto}</span>
                {showClient && <span className="debt-empresa" style={{ color: cm.color }}><CmIcon size={11} />{d.empresa}</span>}
                <span className="debt-monto">{fmtMonto(d.monto)}</span>
                <button className="btn-secondary debt-resolve" onClick={() => onResolveDebt(d.id)}><CheckCircle2 size={12} /> Marcar pagado</button>
              </div>
            );
          })}
        </div>
      </div>

      <SaldoFavorSection
        saldosFavor={saldosFavor}
        showClient={showClient}
        onAdd={onAddSaldoFavor}
        onRemove={onRemoveSaldoFavor}
      />

      <div className="tabbar pagos-subtabbar">
        <button className={"tab" + (subTab === "pagos" ? " tab-active" : "")} onClick={() => setSubTab("pagos")}>
          <Wallet size={14} /> Pagos
        </button>
        <button className={"tab" + (subTab === "inversion" ? " tab-active" : "")} onClick={() => setSubTab("inversion")}>
          <TrendingUp size={14} /> Inversión por semana
        </button>
      </div>

      {subTab === "inversion" && (
        <section className="overview-section">
          <div className="overview-section-head admin-section-head">
            <span className="overview-section-title"><TrendingUp size={15} /> Inversión por semana</span>
            <button className="btn-primary" onClick={onNewInversion}><Plus size={14} /> Nueva inversión</button>
          </div>
          {investMonths.length === 0 && (
            <div className="empty-pane">
              {q ? "Ningún resultado coincide con tu búsqueda." : mesFiltro === "todos" ? "Aún no hay inversión registrada por semana." : `No hay inversión registrada en ${monthLabelEs(mesFiltro)}.`}
            </div>
          )}
          {investMonths.map(([mk, items]) => {
            const subtotal = items.reduce((s, i) => s + Number(i.monto || 0), 0);
            return (
              <div className="week-block" key={mk}>
                <div className="week-head">
                  <span style={{ textTransform: "capitalize" }}>{monthLabelEs(mk)}</span>
                  <span className="week-total">{fmtMonto(subtotal)}</span>
                </div>
                <div className="invest-rows">
                  {items.map((i) => {
                    const cm = clientMeta(i.empresa);
                    const CmIcon = cm.icon;
                    return (
                      <button className="invest-row" key={i.id} onClick={() => onOpenInversion(i.id)}>
                        <div className="invest-row-top">
                          {showClient && <span className="pay-empresa" style={{ color: cm.color }}><CmIcon size={12} />{i.empresa}</span>}
                          <span className="invest-row-semana">{i.semana}</span>
                          <span className="pay-monto">{fmtMonto(i.monto)}</span>
                        </div>
                        {(i.desglose || []).length > 0 && (
                          <div className="pay-cobertura">
                            {i.desglose.map((d) => (
                              <span className="cov-chip" key={d.id}>{d.concepto} <b>{fmtMonto(d.monto)}</b></span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {subTab === "pagos" && (
        <>
          {searchedPayments.length === 0 ? (
            <section className="overview-section">
              <div className="empty-pane">
                {q ? "Ningún resultado coincide con tu búsqueda." : mesFiltro === "todos" ? 'Aún no hay pagos registrados. Usa "Nuevo pago" para empezar.' : `No hay pagos registrados en ${monthLabelEs(mesFiltro)}.`}
              </div>
            </section>
          ) : (
            <>
              <section className="overview-section pagos-currency-card">
                <button type="button" className={"pagos-currency-head pagos-currency-toggle" + ((usdOpen || q) ? " pagos-currency-head-open" : "")} onClick={() => setUsdOpen((s) => !s)}>
                  <span className="pagos-currency-title"><Wallet size={14} /> Pagos en Dólares {paymentWeeksUsd.length > 0 && <span className="pagos-currency-count">({searchedPayments.filter((p) => p.moneda !== "Bs").length})</span>}</span>
                  <span className="pagos-currency-right">
                    {paymentWeeksUsd.length > 0 && <span className="bs-totals">{fmtMonto(totalUsdOnly)}</span>}
                    <ChevronDown size={15} className={"pagos-currency-chev" + ((usdOpen || q) ? " pagos-currency-chev-open" : "")} />
                  </span>
                </button>
                {(usdOpen || q) && (
                  paymentWeeksUsd.length === 0 ? (
                    <div className="hint">No hay pagos en dólares{q ? " que coincidan con tu búsqueda" : ""}.</div>
                  ) : (
                    <>
                      {renderPaymentWeeks((usdExpanded || q) ? paymentWeeksUsd : limitWeeksByCount(paymentWeeksUsd, 3))}
                      {(() => {
                        const usdCount = searchedPayments.filter((p) => p.moneda !== "Bs").length;
                        return !q && usdCount > 3 && (
                          <button type="button" className="pagos-ver-mas" onClick={() => setUsdExpanded((s) => !s)}>
                            {usdExpanded ? <>Mostrar menos <ChevronDown size={13} style={{ transform: "rotate(180deg)" }} /></> : <>Ver los {usdCount - 3} restantes <ChevronDown size={13} /></>}
                          </button>
                        );
                      })()}
                    </>
                  )
                )}
              </section>

              <section className="overview-section pagos-currency-card">
                <button type="button" className={"pagos-currency-head pagos-currency-toggle" + ((bsOpen || q) ? " pagos-currency-head-open" : "")} onClick={() => setBsOpen((s) => !s)}>
                  <span className="pagos-currency-title"><Banknote size={14} /> Pagos en Bolívares {pagosBs.length > 0 && <span className="pagos-currency-count">({pagosBs.length})</span>}</span>
                  <span className="pagos-currency-right">
                    {pagosBs.length > 0 && (
                      <span className="bs-totals">{fmtBs(totalBsVES)} <span className="bs-totals-usd">· equivalente {fmtMonto(totalBsUSD)}</span></span>
                    )}
                    <ChevronDown size={15} className={"pagos-currency-chev" + ((bsOpen || q) ? " pagos-currency-chev-open" : "")} />
                  </span>
                </button>
                {(bsOpen || q) && (
                  paymentWeeksBs.length === 0 ? (
                    <div className="hint">No hay pagos en bolívares{q ? " que coincidan con tu búsqueda" : ""}.</div>
                  ) : (
                    <>
                      {renderPaymentWeeks((bsExpanded || q) ? paymentWeeksBs : limitWeeksByCount(paymentWeeksBs, 3))}
                      {!q && pagosBs.length > 3 && (
                        <button type="button" className="pagos-ver-mas" onClick={() => setBsExpanded((s) => !s)}>
                          {bsExpanded ? <>Mostrar menos <ChevronDown size={13} style={{ transform: "rotate(180deg)" }} /></> : <>Ver los {pagosBs.length - 3} restantes <ChevronDown size={13} /></>}
                        </button>
                      )}
                    </>
                  )
                )}
              </section>
            </>
          )}
        </>
      )}

        </>
      )}
    </main>

      {showReportPicker && (
        <Overlay onClose={onCloseReportPicker}>
          <div className="modal small report-picker-modal" style={{ maxWidth: 340 }}>
            <div className="modal-head">
              <h3><Printer size={15} /> Compartir info</h3>
              <button type="button" className="icon-btn" onClick={onCloseReportPicker}><X size={16} /></button>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Desde</span>
                <CustomDatePicker value={reportFrom} onChange={setReportFrom} />
              </label>
              <label className="field">
                <span>Hasta</span>
                <CustomDatePicker value={reportTo} onChange={setReportTo} />
              </label>
            </div>
            <button
              className="btn-primary full" type="button" disabled={!reportFrom || !reportTo}
              onClick={() => { onCloseReportPicker(); setShowReport(true); }}
            >
              Generar resumen
            </button>
          </div>
        </Overlay>
      )}

      {showReport && (
        <ReportModal
          title="Inversión publicitaria"
          empresaLabel={showClient ? "Dashboard general" : defaultClient}
          dateRangeLabel={reportFrom && reportTo ? `Del ${fmtDate(reportFrom)} al ${fmtDate(reportTo)}` : ""}
          emptyText="No hay inversión registrada en ese rango de fechas."
          groups={reportInversiones.map((i) => ({
            label: i.semana,
            value: fmtMonto(i.monto),
            items: (i.desglose || []).map((d) => ({ label: d.concepto, value: fmtMonto(d.monto) })),
          }))}
          totalLabel="Total invertido en el rango"
          total={fmtMonto(reportTotalInvertido)}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}

export function DesgloseEditor({ desglose, onChange, montoTotal }) {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const list = desglose || [];
  const sum = list.reduce((s, d) => s + Number(d.monto || 0), 0);
  const restante = Number(montoTotal || 0) - sum;

  function add() {
    const n = Number(monto);
    if (!concepto.trim() || !monto || isNaN(n) || n <= 0) return;
    onChange([...list, { id: uid(), concepto: concepto.trim(), monto: n }]);
    setConcepto(""); setMonto("");
  }
  function remove(id) {
    onChange(list.filter((d) => d.id !== id));
  }

  return (
    <div className="field">
      <span><Tag size={12} /> ¿En qué se fue ese monto? (opcional)</span>
      <div className="cov-list">
        {list.length === 0 && <div className="hint">Sin desglose todavía — puedes dejarlo así o detallarlo.</div>}
        {list.map((d) => (
          <div className="cov-row" key={d.id}>
            <span className="cov-row-semana">{d.concepto}</span>
            <span className="cov-row-monto">{fmtMonto(d.monto)}</span>
            <button type="button" className="icon-btn subtle" onClick={() => remove(d.id)}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      <div className="add-cov">
        <input placeholder="Ej: publicidad de traslados" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
        <input type="number" step="0.01" min="0" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} />
        <button type="button" className="btn-secondary" onClick={add}><Plus size={13} /> Agregar</button>
      </div>
      {list.length > 0 && (
        <div className="cov-sum">
          Desglosado: <b>{fmtMonto(sum)}</b>
          {Math.abs(restante) > 0.01 && <> · {restante > 0 ? "Falta por desglosar" : "Excede el total en"} <b>{fmtMonto(Math.abs(restante))}</b></>}
        </div>
      )}
    </div>
  );
}

export function SaldoFavorSection({ saldosFavor, showClient, onAdd, onRemove }) {
  return (
    <div className="debt-section saldo-favor-section">
      <div className="debt-head">
        <span className="debt-title"><Wallet size={14} /> Saldo a favor</span>
        <button className="btn-secondary" onClick={onAdd}><Plus size={13} /> Agregar saldo a favor</button>
      </div>
      <div className="hint" style={{ marginBottom: 10 }}>
        Libre, sin relación con ningún pago — anota lo que te quedó a favor y en qué (método,
        moneda, lo que te sirva recordar). Cuando ya lo uses o lo registres en otro lado, quítalo.
      </div>
      {(saldosFavor || []).length === 0 && <div className="hint">No hay saldo a favor registrado.</div>}
      <div className="debt-list">
        {(saldosFavor || []).map((s) => {
          const cm = clientMeta(s.empresa);
          const CmIcon = cm.icon;
          return (
            <div className="debt-row" key={s.id}>
              <span className="debt-concepto">{s.nota || "Saldo a favor"}</span>
              {showClient && <span className="debt-empresa" style={{ color: cm.color }}><CmIcon size={11} />{s.empresa}</span>}
              <span className="debt-monto">{fmtMonto(s.monto)}</span>
              <button className="btn-secondary debt-resolve" onClick={() => onRemove(s.id)}><Trash2 size={12} /> Ya lo usé / quitar</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NewSaldoFavorModal({ onClose, onCreate, defaultClient, lockedClient }) {
  const [empresa, setEmpresa] = useState(lockedClient || defaultClient);
  const [nota, setNota] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const n = Number(monto);
    if (!empresa) { setError("Falta elegir la empresa."); return; }
    if (!monto || isNaN(n) || n <= 0) { setError("El monto debe ser un número mayor a 0."); return; }
    try {
      onCreate({ id: uid(), empresa, nota: nota.trim(), monto: n, fecha: todayISO() });
    } catch (err) {
      setError("No se pudo registrar: " + (err && err.message ? err.message : String(err)));
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small" style={{ "--primary": clientMeta(empresa).color }}>
        <div className="modal-head">
          <h3>Nuevo saldo a favor</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <EmpresaField locked={!!lockedClient} value={empresa} onChange={setEmpresa} />

        <label className="field">
          <span>Nota (opcional)</span>
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: quedan $100 en tarjeta" />
        </label>

        <label className="field">
          <span>Monto (USD)</span>
          <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
        </label>

        <button className="btn-primary full" type="button" onClick={submit}>Registrar saldo a favor</button>
      </div>
    </Overlay>
  );
}
