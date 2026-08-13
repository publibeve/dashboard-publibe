import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { DesgloseEditor } from "./PagosView";
import { weekLabel } from "../../utils/helpers";

/**
 * Tarjeta de revisión para UNA inversión semanal detectada — la usan tanto
 * "Importar desde Meta" como "Importar desde texto" (IA), porque las dos
 * terminan produciendo la misma forma de datos ({semana, fecha, monto,
 * desglose, nota}) antes de guardar nada. `origenLabel` es opcional — el
 * texto chico de contexto ("De la campaña...", "Del mensaje pegado", etc.).
 */
export function InversionPreviewCard({ inv, onChange, onRemove, origenLabel }) {
  const [expanded, setExpanded] = useState(false);
  function patch(p) { onChange({ ...inv, ...p }); }
  const tieneDesglose = (inv.desglose || []).length > 0;

  return (
    <div className={"import-guion-card" + (!inv._incluido ? " import-guion-card-excluded" : "")}>
      <div className="import-guion-card-head">
        <label className="import-incluir-check">
          <input type="checkbox" checked={inv._incluido} onChange={(e) => patch({ _incluido: e.target.checked })} />
        </label>
        <input type="text" className="import-titulo-input" value={inv.semana} placeholder="Semana" onChange={(e) => patch({ semana: e.target.value })} />
        <button type="button" className="icon-btn subtle" onClick={() => setExpanded((x) => !x)}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <button type="button" className="icon-btn subtle" onClick={onRemove} title="Quitar de la lista"><X size={13} /></button>
      </div>

      <div className="import-guion-card-summary">
        {origenLabel && <span className="import-tema-summary">{origenLabel}</span>}
        {tieneDesglose ? (
          <span className="import-tema-summary">{inv.desglose.length} elemento{inv.desglose.length !== 1 ? "s" : ""} con monto</span>
        ) : inv.nota ? (
          <span className="import-tema-summary">Sin desglose por monto — queda como nota</span>
        ) : null}
        <span className="import-tema-summary"><b>${Number(inv.monto || 0).toFixed(2)}</b></span>
      </div>

      {expanded && (
        <div className="import-guion-card-body">
          <div className="field-row">
            <label className="field">
              <span>Fecha de esa semana</span>
              <CustomDatePicker value={inv.fecha} onChange={(v) => patch({ fecha: v, semana: v ? weekLabel(v) : inv.semana })} />
            </label>
            <label className="field">
              <span>Monto total</span>
              <input type="number" step="0.01" min="0" value={inv.monto} onChange={(e) => patch({ monto: Number(e.target.value) })} />
            </label>
          </div>
          <label className="field">
            <span>Nota (opcional)</span>
            <textarea rows={2} value={inv.nota || ""} onChange={(e) => patch({ nota: e.target.value })} placeholder="Ej: 5 elementos sin monto individual, etiqueta de producto/campaña…" />
          </label>
          <DesgloseEditor desglose={inv.desglose} onChange={(d) => patch({ desglose: d })} montoTotal={inv.monto} canSeeMontos />
        </div>
      )}
    </div>
  );
}
