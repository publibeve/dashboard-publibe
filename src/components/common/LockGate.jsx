import {
  PenTool,
  LockKeyhole,
} from "lucide-react";

export function LockGate({ unlocked, onRequestUnlock, blur = true, children }) {
  if (unlocked) return children;
  if (!blur) {
    return (
      <div className="lock-gate-plain">
        {children}
        <button type="button" className="btn-secondary edit-toggle" onClick={onRequestUnlock}>
          <PenTool size={13} /> Editar
        </button>
      </div>
    );
  }
  return (
    <div className="lock-gate">
      <div className="lock-fields">{children}</div>
      <div className="lock-overlay">
        <button type="button" className="btn-secondary" onClick={onRequestUnlock}>
          <LockKeyhole size={13} /> Desbloquear para editar
        </button>
      </div>
    </div>
  );
}
