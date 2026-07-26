import {
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Overlay } from "./Overlay";

export function UnsavedChangesModal({ onSave, onDiscard, onCancel }) {
  return (
    <Overlay onClose={onCancel}>
      <div className="modal small confirm-warning-modal unsaved-modal" style={{ maxWidth: 340 }}>
        <div className="modal-head">
          <h3><AlertTriangle size={16} color="#C98A2C" /> Cambios sin guardar</h3>
          <button type="button" className="icon-btn" onClick={onCancel}><X size={16} /></button>
        </div>
        <p className="delete-client-warning">Tienes cambios sin guardar en esta nota. ¿Qué quieres hacer antes de cerrar?</p>
        <div className="unsaved-modal-actions">
          <button className="btn-primary full" type="button" onClick={onSave}><CheckCircle2 size={14} /> Guardar cambios</button>
          <button className="btn-danger-ghost full" type="button" onClick={onDiscard}><Trash2 size={13} /> Descartar cambios</button>
          <button className="btn-secondary full" type="button" onClick={onCancel}>Seguir editando</button>
        </div>
      </div>
    </Overlay>
  );
}
