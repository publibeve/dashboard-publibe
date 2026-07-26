import {
  X,
  LockKeyhole,
} from "lucide-react";
import { Overlay } from "./Overlay";

export function PermissionDeniedModal({ label, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <div className="modal small confirm-warning-modal" style={{ maxWidth: 340 }}>
        <div className="modal-head">
          <h3><LockKeyhole size={16} color="#B4432F" /> Sin permiso</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <p className="delete-client-warning">
          Tu usuario no tiene el permiso de <b>"{label}"</b>. Pídele a alguien con acceso de administrador
          que te lo habilite en Administrativo, pestaña "Usuarios y permisos".
        </p>
        <button className="btn-primary full" type="button" onClick={onClose}>Entendido</button>
      </div>
    </Overlay>
  );
}
