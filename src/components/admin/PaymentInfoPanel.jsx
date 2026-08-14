import { useState, useEffect } from "react";
import {
  Plus, Trash2, PenTool, Check, X, Landmark, Save, Loader2,
  Smartphone, Wallet, CreditCard, Banknote,
} from "lucide-react";
import { uid } from "../../utils/helpers";
import { loadPaymentInfo, persistPaymentInfo } from "../../services/billing.service";

/**
 * Ícono según palabras clave en la etiqueta — no hace falta que Diego
 * elija uno a mano cada vez, se acomoda solo según lo que escriba
 * ("Pago Móvil", "Banco/Cuenta", "Zelle/Zinli/Wally", "PayPal/Payoneer").
 */
function iconoPara(label) {
  const l = (label || "").toLowerCase();
  if (l.includes("móvil") || l.includes("movil")) return Smartphone;
  if (l.includes("banco") || l.includes("cuenta")) return Landmark;
  if (l.includes("paypal") || l.includes("payoneer")) return CreditCard;
  if (l.includes("zelle") || l.includes("zinli") || l.includes("wally")) return Wallet;
  return Banknote;
}

export function PaymentInfoPanel({ setAppError }) {
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [valor, setValor] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editValor, setEditValor] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPaymentInfo().then((list) => setItems(list || []));
  }, []);

  function add() {
    if (!label.trim() || !valor.trim()) return;
    setItems((list) => [...(list || []), { id: uid(), label: label.trim(), valor: valor.trim() }]);
    setLabel(""); setValor(""); setAdding(false);
  }
  function remove(id) {
    setItems((list) => (list || []).filter((x) => x.id !== id));
    if (editingId === id) setEditingId(null);
  }
  function startEdit(it) {
    setEditingId(it.id); setEditLabel(it.label); setEditValor(it.valor);
  }
  function saveEdit() {
    if (!editLabel.trim() || !editValor.trim()) return;
    setItems((list) => list.map((x) => (x.id === editingId ? { ...x, label: editLabel.trim(), valor: editValor.trim() } : x)));
    setEditingId(null);
  }

  async function guardarTodo() {
    setSaving(true);
    try {
      await persistPaymentInfo(items || []);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      setAppError("No se pudo guardar la información de pago: " + (e && e.message ? e.message : e));
    } finally {
      setSaving(false);
    }
  }

  if (items === null) return null;

  return (
    <section className="overview-section payment-info-panel">
      <div className="overview-section-head admin-section-head">
        <span className="overview-section-title"><Landmark size={15} /> Información de pago (facturas y nómina)</span>
        <div className="admin-section-actions">
          <button type="button" className="btn-secondary" onClick={() => { setAdding(true); setLabel(""); setValor(""); }}>
            <Plus size={14} /> Agregar método
          </button>
        </div>
      </div>
      <div className="hint hint-tip" style={{ marginBottom: 14 }}>
        Fija — se carga una sola vez acá y se repite igual en todas las facturas y recibos de nómina que generes,
        no hace falta volver a escribirla cada mes.
      </div>

      {items.length === 0 && !adding && (
        <div className="payment-info-empty">
          <Landmark size={22} />
          <span>Todavía no cargaste ningún método de pago.</span>
        </div>
      )}

      {(items.length > 0 || adding) && (
        <div className="payment-info-grid">
          {adding && (
            <div className="payment-info-card payment-info-card-editing">
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder='Ej: "Pago Móvil Bs."' autoFocus onKeyDown={(e) => { if (e.key === "Escape") setAdding(false); }} />
              <textarea rows={3} value={valor} onChange={(e) => setValor(e.target.value)} placeholder='Ej: "CI 28.163.915 — 0424-7160147 — Mercantil"' />
              <div className="payment-info-card-actions">
                <button type="button" className="btn-secondary" onClick={add}><Check size={12} /> Agregar</button>
                <button type="button" className="btn-secondary" onClick={() => setAdding(false)}><X size={12} /> Cancelar</button>
              </div>
            </div>
          )}
          {items.map((it) => {
            const Icon = iconoPara(it.label);
            return editingId === it.id ? (
              <div className="payment-info-card payment-info-card-editing" key={it.id}>
                <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder='Ej: "Pago Móvil Bs."' autoFocus onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }} />
                <textarea rows={3} value={editValor} onChange={(e) => setEditValor(e.target.value)} placeholder='Ej: "CI 28.163.915 — 0424-7160147 — Mercantil"' />
                <div className="payment-info-card-actions">
                  <button type="button" className="btn-secondary" onClick={saveEdit}><Check size={12} /> Guardar</button>
                  <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}><X size={12} /> Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="payment-info-card" key={it.id}>
                <span className="payment-info-card-icon"><Icon size={17} /></span>
                <div className="payment-info-card-body">
                  <span className="payment-info-card-label">{it.label}</span>
                  <span className="payment-info-card-valor">{it.valor}</span>
                </div>
                <div className="payment-info-card-hover-actions">
                  <button type="button" className="icon-btn subtle" onClick={() => startEdit(it)} title="Editar"><PenTool size={12} /></button>
                  <button type="button" className="icon-btn subtle" onClick={() => remove(it.id)} title="Eliminar"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button type="button" className="btn-primary payment-info-save-btn" onClick={guardarTodo} disabled={saving}>
        {saving ? <><Loader2 size={14} className="spin" /> Guardando…</> : saved ? <><Check size={14} /> Guardado</> : <><Save size={14} /> Guardar información de pago</>}
      </button>
    </section>
  );
}
