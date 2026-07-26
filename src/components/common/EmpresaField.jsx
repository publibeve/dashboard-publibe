import { CustomSelect } from "./CustomSelect";
import { CLIENTES } from "../../utils/constants";
import { clientMeta } from "../../utils/helpers";

export function EmpresaField({ locked, value, onChange }) {
  if (locked) {
    const cm = clientMeta(value);
    const CmIcon = cm.icon;
    return (
      <label className="field">
        <span>Empresa</span>
        <div className="empresa-chip" style={{ color: cm.color, borderColor: cm.color + "55", background: cm.color + "12" }}>
          <CmIcon size={14} />{value}
        </div>
      </label>
    );
  }
  return (
    <label className="field">
      <span>Empresa</span>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
      />
    </label>
  );
}
