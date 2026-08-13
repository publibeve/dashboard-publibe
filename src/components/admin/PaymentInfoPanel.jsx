import { useState, useEffect } from "react";
import { Plus, Trash2, PenTool, Check, X, Landmark, Save, Loader2 } from "lucide-react";
import { uid } from "../../utils/helpers";
import { loadPaymentInfo, persistPaymentInfo } from "../../services/billing.service";

export function PaymentInfoPanel({ setAppError }) {
  const [items, setItems] = useState(null);
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
    setLabel(""); setValor("");
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
    <section className="overview-section">
      <div className="overview-section-head admin-section-head">
        <span className="overview-section-title"><Landmark size={15} /> Información de pago (facturas y nómina)</span>
      </div>
      <div className="hint hint-tip" style={{ marginBottom: 10 }}>
        Fija — se carga una sola vez acá y se repite igual en todas las facturas y recibos de nómina que generes,
        no hace falta volver a escribirla cada mes.
      </div>
      <div className="cov-list">
        {items.length === 0 && <div className="hint">Todavía no cargaste ningún método de pago.</div>}
        {items.map((it) => (
          editingId === it.id ? (
            <div className="cov-row cov-row-editing" key={it.id}>
              <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder='Ej: "Pago Móvil Bs."' autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }} />
              <textarea rows={2} value={editValor} onChange={(e) => setEditValor(e.target.value)} placeholder='Ej: "CI 28.163.915 — 0424-7160147 — Mercantil"' />
              <div className="cov-edit-actions">
                <button type="button" className="btn-secondary cov-edit-save" onClick={saveEdit}><Check size={12} /> Guardar</button>
                <button type="button" className="btn-secondary cov-edit-cancel" onClick={() => setEditingId(null)}><X size={12} /></button>
              </div>
            </div>
          ) : (
            <div className="cov-row" key={it.id}>
              <span className="cov-row-semana"><b>{it.label}</b> — {it.valor}</span>
              <button type="button" className="icon-btn subtle" onClick={() => startEdit(it)} title="Editar"><PenTool size={12} /></button>
              <button type="button" className="icon-btn subtle" onClick={() => remove(it.id)} title="Eliminar"><Trash2 size={13} /></button>
            </div>
          )
        ))}
      </div>
      <div className="add-cov">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder='Etiqueta — ej: "Pago Móvil Bs."' />
        <textarea rows={2} value={valor} onChange={(e) => setValor(e.target.value)} placeholder='Detalle — ej: "CI 28.163.915 — 0424-7160147 — Banco Mercantil"' />
        <button type="button" className="btn-secondary" onClick={add}><Plus size={13} /> Agregar</button>
      </div>
      <button type="button" className="btn-primary" style={{ marginTop: 12 }} onClick={guardarTodo} disabled={saving}>
        {saving ? <><Loader2 size={14} className="spin" /> Guardando…</> : saved ? <><Check size={14} /> Guardado</> : <><Save size={14} /> Guardar información de pago</>}
      </button>
    </section>
  );
}
