import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { AttachmentsBlock } from "../common/AttachmentsBlock";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { LockGate } from "../common/LockGate";
import { Overlay } from "../common/Overlay";
import { EXPENSE_CATEGORIAS, EXPENSE_FRECUENCIAS } from "../../utils/constants";
import { todayISO, uid } from "../../utils/helpers";
import { nextNominaNumber, peekNominaNumber } from "../../services/billing.service";
import { InvoiceItemsEditor } from "./InvoicesTab";

/**
 * Campos de nómina — solo aparecen cuando la categoría es "Nómina", a
 * propósito: el resto de Gastos (herramientas, servicios) sigue tan
 * simple como siempre, sin campos que no le sirven.
 */
function NominaFields({ draft, setDraft, numeroCargando, onNumeroEdit }) {
  return (
    <>
      <div className="field-row">
        <label className="field">
          <span>Nombre completo (para el recibo)</span>
          <input value={draft.nombreCompleto || ""} onChange={(e) => setDraft({ ...draft, nombreCompleto: e.target.value })} placeholder="Ej: Ariana Martínez" />
        </label>
        <label className="field">
          <span>Rol / cargo</span>
          <input value={draft.rol || ""} onChange={(e) => setDraft({ ...draft, rol: e.target.value })} placeholder="Ej: Diseñadora gráfica" />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span>N° de recibo</span>
          <input value={draft.numeroRecibo || ""} onChange={(e) => { setDraft({ ...draft, numeroRecibo: e.target.value }); if (onNumeroEdit) onNumeroEdit(); }} placeholder={numeroCargando ? "Calculando…" : "Ej: 00005"} />
        </label>
        <label className="field">
          <span>Fecha del pago</span>
          <CustomDatePicker value={draft.fechaPago || todayISO()} onChange={(v) => setDraft({ ...draft, fechaPago: v })} />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span>Período — desde</span>
          <CustomDatePicker value={draft.periodoDesde || ""} onChange={(v) => setDraft({ ...draft, periodoDesde: v })} />
        </label>
        <label className="field">
          <span>Período — hasta</span>
          <CustomDatePicker value={draft.periodoHasta || ""} onChange={(v) => setDraft({ ...draft, periodoHasta: v })} />
        </label>
      </div>

      <InvoiceItemsEditor
        items={draft.items || []}
        onChange={(items) => setDraft({ ...draft, items, monto: items.reduce((s, it) => s + Number(it.monto || 0), 0) })}
      />

      <div className="field-row">
        <label className="field">
          <span>Extra / abono (opcional)</span>
          <input type="number" step="0.01" min="0" value={draft.extraMonto || ""} onChange={(e) => setDraft({ ...draft, extraMonto: e.target.value })} placeholder="0.00" />
        </label>
        <label className="field">
          <span>Concepto del extra</span>
          <input value={draft.extraLabel || ""} onChange={(e) => setDraft({ ...draft, extraLabel: e.target.value })} placeholder='Ej: "Abono de 10$ por Wally Tech"' />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span>Referencia del pago (opcional)</span>
          <input value={draft.referencia || ""} onChange={(e) => setDraft({ ...draft, referencia: e.target.value })} placeholder="Ej: 8294" />
        </label>
        <label className="field">
          <span>Tasa BCV — si se pagó en Bs (opcional)</span>
          <input type="number" step="0.01" min="0" value={draft.tasaBcv || ""} onChange={(e) => setDraft({ ...draft, tasaBcv: e.target.value })} placeholder="Ej: 473.92" />
        </label>
      </div>
    </>
  );
}

export function NewExpenseModal({ onClose, onCreate, defaultCategoria }) {
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState(defaultCategoria || EXPENSE_CATEGORIAS[0]);
  const [monto, setMonto] = useState("");
  const [frecuencia, setFrecuencia] = useState(EXPENSE_FRECUENCIAS[0]);
  const [proximoPago, setProximoPago] = useState(todayISO());
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [nomina, setNomina] = useState({});
  const [numeroCargando, setNumeroCargando] = useState(true);
  const [numeroEditadoAMano, setNumeroEditadoAMano] = useState(false);

  useEffect(() => {
    if (categoria !== "Nómina" || nomina.numeroRecibo) return;
    let cancelled = false;
    peekNominaNumber().then((n) => { if (!cancelled) { setNomina((d) => ({ ...d, numeroRecibo: n })); setNumeroCargando(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  async function submit() {
    const esNomina = categoria === "Nómina";
    const montoFinal = esNomina && nomina.items?.length ? nomina.monto : Number(monto);
    if (!concepto.trim()) { setError("Falta el concepto (a quién se le paga o qué servicio es)."); return; }
    if (!montoFinal || isNaN(montoFinal) || montoFinal <= 0) { setError("El monto debe ser mayor a 0."); return; }
    // Mismo criterio que Facturas — el número real recién se pide (y se
    // consume) acá, justo antes de crear, y solo si Diego no lo cambió a mano.
    const numeroFinal = esNomina ? (numeroEditadoAMano ? (nomina.numeroRecibo || "").trim() : await nextNominaNumber()) : "";
    onCreate({
      id: uid(), concepto: concepto.trim(), categoria, monto: montoFinal, frecuencia, proximoPago, notas: notas.trim(),
      ...(esNomina ? {
        nombreCompleto: (nomina.nombreCompleto || concepto).trim(), rol: nomina.rol || "",
        numeroRecibo: numeroFinal, fechaPago: nomina.fechaPago || todayISO(),
        periodoDesde: nomina.periodoDesde || "", periodoHasta: nomina.periodoHasta || "",
        items: nomina.items || [], extraMonto: Number(nomina.extraMonto || 0), extraLabel: nomina.extraLabel || "",
        referencia: nomina.referencia || "", tasaBcv: Number(nomina.tasaBcv || 0),
      } : {}),
    });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Nuevo gasto</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
        <label className="field">
          <span>Concepto (a quién se le paga / qué servicio)</span>
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej: Ariana Martínez — nómina, o Canva Pro" />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Categoría</span>
            <CustomSelect value={categoria} onChange={setCategoria} options={EXPENSE_CATEGORIAS} />
          </label>
          <label className="field">
            <span>Frecuencia</span>
            <CustomSelect value={frecuencia} onChange={setFrecuencia} options={EXPENSE_FRECUENCIAS} />
          </label>
        </div>

        {categoria === "Nómina" ? (
          <NominaFields draft={nomina} setDraft={setNomina} numeroCargando={numeroCargando} onNumeroEdit={() => setNumeroEditadoAMano(true)} />
        ) : (
          <div className="field-row">
            <label className="field">
              <span>Monto (USD)</span>
              <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
            </label>
            <label className="field">
              <span>Próximo pago</span>
              <CustomDatePicker value={proximoPago} onChange={setProximoPago} />
            </label>
          </div>
        )}

        <label className="field">
          <span>Notas (opcional)</span>
          <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>
        <button className="btn-primary full" type="button" onClick={submit}>Registrar gasto</button>
      </div>
    </Overlay>
  );
}

export function ExpenseModal({ expense, onClose, onPatch, onDelete, unlocked, onRequestUnlock, driveConnected, onPrintNomina }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({
    concepto: expense.concepto, categoria: expense.categoria, frecuencia: expense.frecuencia,
    monto: expense.monto, proximoPago: expense.proximoPago, notas: expense.notas,
    nombreCompleto: expense.nombreCompleto || "", rol: expense.rol || "",
    numeroRecibo: expense.numeroRecibo || "", fechaPago: expense.fechaPago || "",
    periodoDesde: expense.periodoDesde || "", periodoHasta: expense.periodoHasta || "",
    items: expense.items || [], extraMonto: expense.extraMonto || 0, extraLabel: expense.extraLabel || "",
    referencia: expense.referencia || "", tasaBcv: expense.tasaBcv || 0,
  });
  const dirty = Object.keys(draft).some((k) => JSON.stringify(draft[k]) !== JSON.stringify(expense[k]));
  function saveDraft() { onPatch(draft); onClose(); }
  const esNomina = draft.categoria === "Nómina";

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Editar gasto</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <LockGate unlocked={unlocked} onRequestUnlock={onRequestUnlock}>
          <label className="field">
            <span>Concepto</span>
            <input value={draft.concepto} onChange={(e) => setDraft({ ...draft, concepto: e.target.value })} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Categoría</span>
              <CustomSelect value={draft.categoria} onChange={(v) => setDraft({ ...draft, categoria: v })} options={EXPENSE_CATEGORIAS} />
            </label>
            <label className="field">
              <span>Frecuencia</span>
              <CustomSelect value={draft.frecuencia} onChange={(v) => setDraft({ ...draft, frecuencia: v })} options={EXPENSE_FRECUENCIAS} />
            </label>
          </div>

          {esNomina ? (
            <NominaFields draft={draft} setDraft={setDraft} numeroCargando={false} />
          ) : (
            <div className="field-row">
              <label className="field">
                <span>Monto (USD)</span>
                <input type="number" step="0.01" min="0" value={draft.monto} onChange={(e) => setDraft({ ...draft, monto: Number(e.target.value) })} />
              </label>
              <label className="field">
                <span>Próximo pago</span>
                <CustomDatePicker value={draft.proximoPago || ""} onChange={(v) => setDraft({ ...draft, proximoPago: v })} clearable />
              </label>
            </div>
          )}

          <label className="field">
            <span>Notas (opcional)</span>
            <textarea rows={2} value={draft.notas || ""} onChange={(e) => setDraft({ ...draft, notas: e.target.value })} />
          </label>

          <AttachmentsBlock
            title={draft.categoria === "Nómina" ? "Comprobante de pago" : "Recibo / factura"}
            files={expense.archivos || []}
            onAdd={(f) => onPatch({ archivos: [...(expense.archivos || []), f] })}
            onRemove={(id) => onPatch({ archivos: (expense.archivos || []).filter((f) => f.id !== id) })}
            driveConnected={driveConnected}
            driveFolderPath={`Administrativo / ${draft.categoria === "Nómina" ? "Nómina" : "Gastos operativos"}`}
            driveOnly
          />
        </LockGate>

        {unlocked && (
          <div className="modal-footer modal-footer-row">
            {!confirmDelete ? (
              <>
                <button className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Eliminar gasto</button>
                {esNomina && <button className="btn-secondary" type="button" onClick={() => onPrintNomina(expense)}><Printer size={13} /> Ver / imprimir recibo</button>}
                <button className="btn-primary save-draft-btn" type="button" onClick={saveDraft} disabled={!dirty}>
                  <CheckCircle2 size={14} /> Guardar cambios
                </button>
              </>
            ) : (
              <div className="confirm-row">
                <span><AlertTriangle size={13} /> ¿Eliminar definitivamente?</span>
                <button className="btn-danger" onClick={onDelete}>Sí, eliminar</button>
                <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              </div>
            )}
          </div>
        )}
      </div>
    </Overlay>
  );
}
