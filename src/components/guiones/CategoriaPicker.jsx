import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { GUION_CATEGORIAS } from "../../utils/constants";

export function CategoriaPicker({ value, customCategorias, canAddCategoria, onChange, onAddCategoria }) {
  const [adding, setAdding] = useState(false);
  const [nuevaNombre, setNuevaNombre] = useState("");
  const todas = [...GUION_CATEGORIAS, ...(customCategorias || [])];

  function confirmAdd() {
    const clean = nuevaNombre.trim();
    if (!clean) { setAdding(false); return; }
    onAddCategoria(clean);
    onChange(clean);
    setNuevaNombre("");
    setAdding(false);
  }

  return (
    <div className="guion-categoria-row">
      {todas.map((c) => (
        <button
          key={c.value} type="button"
          className={"guion-categoria-chip" + (value === c.value ? " guion-categoria-chip-active" : "")}
          style={{ background: c.color }}
          onClick={() => onChange(c.value)}
        >
          {c.value}
        </button>
      ))}
      {canAddCategoria && !adding && (
        <button type="button" className="guion-categoria-chip guion-categoria-chip-add" onClick={() => setAdding(true)}>
          <Plus size={12} /> Nueva categoría
        </button>
      )}
      {adding && (
        <div className="guion-categoria-add-inline">
          <input
            type="text" autoFocus value={nuevaNombre} placeholder="Nombre de la categoría"
            onChange={(e) => setNuevaNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") confirmAdd(); if (e.key === "Escape") setAdding(false); }}
          />
          <button type="button" className="icon-btn subtle" onClick={confirmAdd}><Check size={13} /></button>
          <button type="button" className="icon-btn subtle" onClick={() => { setAdding(false); setNuevaNombre(""); }}><X size={13} /></button>
        </div>
      )}
    </div>
  );
}
