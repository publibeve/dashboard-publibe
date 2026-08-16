import { useState, useEffect } from "react";
import {
  Plus, Trash2, PenTool, Check, X, LayoutTemplate, Save, Loader2, Globe2,
} from "lucide-react";
import { uid } from "../../utils/helpers";
import { CLIENTES } from "../../utils/constants";
import { CustomSelect } from "../common/CustomSelect";
import { loadItemTemplates, persistItemTemplates } from "../../services/itemTemplates.service";

const OPCIONES_ALCANCE = [
  { value: "", label: "General — cualquier cliente" },
  ...CLIENTES.map((c) => ({ value: c.name, label: "Solo para " + c.name, icon: c.icon, color: c.color })),
];

function plantillaVacia() {
  return { id: uid(), nombre: "", empresa: "", descripcion: "", subitems: [] };
}

export function ItemTemplatesPanel({ setAppError }) {
  const [templates, setTemplates] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(plantillaVacia());
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadItemTemplates().then((list) => setTemplates(list || []));
  }, []);

  function startAdd() {
    setDraft(plantillaVacia());
    setAdding(true);
  }
  function addSubitemDraft(setFn) {
    setFn((d) => ({ ...d, subitems: [...d.subitems, { id: uid(), descripcion: "" }] }));
  }
  function patchSubitemDraft(setFn, subId, texto) {
    setFn((d) => ({ ...d, subitems: d.subitems.map((s) => (s.id === subId ? { ...s, descripcion: texto } : s)) }));
  }
  function removeSubitemDraft(setFn, subId) {
    setFn((d) => ({ ...d, subitems: d.subitems.filter((s) => s.id !== subId) }));
  }

  function confirmAdd() {
    if (!draft.nombre.trim() || !draft.descripcion.trim()) return;
    const limpia = { ...draft, nombre: draft.nombre.trim(), descripcion: draft.descripcion.trim(), subitems: draft.subitems.filter((s) => s.descripcion.trim()) };
    setTemplates((list) => [...(list || []), limpia]);
    setAdding(false);
  }
  function startEdit(t) {
    setEditingId(t.id);
    setEditDraft({ ...t, subitems: t.subitems.map((s) => ({ ...s })) });
  }
  function confirmEdit() {
    if (!editDraft.nombre.trim() || !editDraft.descripcion.trim()) return;
    const limpia = { ...editDraft, nombre: editDraft.nombre.trim(), descripcion: editDraft.descripcion.trim(), subitems: editDraft.subitems.filter((s) => s.descripcion.trim()) };
    setTemplates((list) => list.map((t) => (t.id === editingId ? limpia : t)));
    setEditingId(null);
  }
  function remove(id) {
    setTemplates((list) => list.filter((t) => t.id !== id));
  }

  async function guardarTodo() {
    setSaving(true);
    try {
      await persistItemTemplates(templates || []);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      setAppError("No se pudieron guardar las plantillas: " + (e && e.message ? e.message : e));
    } finally {
      setSaving(false);
    }
  }

  if (templates === null) return null;

  function FormularioPlantilla({ valor, setValor, onConfirm, onCancel, textoConfirmar }) {
    return (
      <div className="item-template-card item-template-card-editing">
        <input value={valor.nombre} onChange={(e) => setValor((d) => ({ ...d, nombre: e.target.value }))} placeholder='Nombre — ej: "Gestión Social Media"' autoFocus />
        <CustomSelect value={valor.empresa} onChange={(v) => setValor((d) => ({ ...d, empresa: v }))} options={OPCIONES_ALCANCE} />
        <textarea rows={2} value={valor.descripcion} onChange={(e) => setValor((d) => ({ ...d, descripcion: e.target.value }))} placeholder='Descripción del ítem — ej: "Gestión Social Media: flyers, videos, reels, programación, edición, trabajo presencial"' />
        <div className="item-template-subitems">
          {valor.subitems.map((s) => (
            <div className="item-template-subitem-row" key={s.id}>
              <input value={s.descripcion} onChange={(e) => patchSubitemDraft(setValor, s.id, e.target.value)} placeholder="Sub-línea — ej: 5 imágenes" />
              <button type="button" className="icon-btn subtle" onClick={() => removeSubitemDraft(setValor, s.id)}><X size={12} /></button>
            </div>
          ))}
          <button type="button" className="btn-secondary item-template-add-sub-btn" onClick={() => addSubitemDraft(setValor)}>
            <Plus size={11} /> Sub-línea
          </button>
        </div>
        <div className="payment-info-card-actions">
          <button type="button" className="btn-secondary" onClick={onConfirm}><Check size={12} /> {textoConfirmar}</button>
          <button type="button" className="btn-secondary" onClick={onCancel}><X size={12} /> Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <section className="overview-section item-templates-panel">
      <div className="overview-section-head admin-section-head">
        <span className="overview-section-title"><LayoutTemplate size={15} /> Plantillas de ítems para facturas</span>
        <div className="admin-section-actions">
          <button type="button" className="btn-secondary" onClick={startAdd}><Plus size={14} /> Nueva plantilla</button>
        </div>
      </div>
      <div className="hint hint-tip" style={{ marginBottom: 14 }}>
        Descripciones fijas que se insertan de un clic al armar una factura — el precio queda en blanco para completar
        cada vez. Las generales sirven para cualquier cliente; también podés dejar una fija solo para uno.
      </div>

      {templates.length === 0 && !adding && (
        <div className="payment-info-empty">
          <LayoutTemplate size={22} />
          <span>Todavía no cargaste ninguna plantilla.</span>
        </div>
      )}

      <div className="item-templates-grid">
        {adding && (
          <FormularioPlantilla valor={draft} setValor={setDraft} onConfirm={confirmAdd} onCancel={() => setAdding(false)} textoConfirmar="Agregar" />
        )}
        {templates.map((t) => (
          editingId === t.id ? (
            <FormularioPlantilla key={t.id} valor={editDraft} setValor={setEditDraft} onConfirm={confirmEdit} onCancel={() => setEditingId(null)} textoConfirmar="Guardar" />
          ) : (
            <div className="item-template-card" key={t.id}>
              <div className="item-template-card-top">
                <span className="item-template-card-icon">{t.empresa ? <PenTool size={14} /> : <Globe2 size={14} />}</span>
                <div className="item-template-card-body">
                  <span className="item-template-card-nombre">{t.nombre}</span>
                  <span className="item-template-card-alcance">{t.empresa ? "Solo " + t.empresa : "General"}</span>
                </div>
                <div className="payment-info-card-hover-actions" style={{ position: "static", opacity: 1 }}>
                  <button type="button" className="icon-btn subtle" onClick={() => startEdit(t)} title="Editar"><PenTool size={12} /></button>
                  <button type="button" className="icon-btn subtle" onClick={() => remove(t.id)} title="Eliminar"><Trash2 size={13} /></button>
                </div>
              </div>
              <p className="item-template-card-desc">{t.descripcion}</p>
              {t.subitems.length > 0 && (
                <ul className="item-template-card-subs">
                  {t.subitems.map((s) => <li key={s.id}>{s.descripcion}</li>)}
                </ul>
              )}
            </div>
          )
        ))}
      </div>

      <button type="button" className="btn-primary payment-info-save-btn" onClick={guardarTodo} disabled={saving}>
        {saving ? <><Loader2 size={14} className="spin" /> Guardando…</> : saved ? <><Check size={14} /> Guardado</> : <><Save size={14} /> Guardar plantillas</>}
      </button>
    </section>
  );
}
