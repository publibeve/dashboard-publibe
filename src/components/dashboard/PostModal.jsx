import { useState } from "react";
import {
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { AttachmentsBlock } from "../common/AttachmentsBlock";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { CustomSelect } from "../common/CustomSelect";
import { LockGate } from "../common/LockGate";
import { Overlay } from "../common/Overlay";
import { CLIENTES, FORMATOS, REDES } from "../../utils/constants";
import { clientMeta } from "../../utils/helpers";

export function PostModal({ post, onClose, onPatch, onDelete, unlocked, onRequestUnlock, driveConnected }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({
    empresa: post.empresa, fecha: post.fecha, hora: post.hora, redSocial: post.redSocial,
    formato: post.formato, titulo: post.titulo, copy: post.copy,
  });
  const accent = clientMeta(draft.empresa).color;
  const dirty = Object.keys(draft).some((k) => draft[k] !== post[k]);
  function saveDraft() { onPatch(draft); onClose(); }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small" style={{ "--primary": accent }}>
        <div className="modal-head">
          <h3>Editar publicación</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <LockGate unlocked={unlocked} onRequestUnlock={onRequestUnlock} blur={false}>
        <label className="field">
          <span>Empresa</span>
          <CustomSelect
            value={draft.empresa}
            onChange={(v) => setDraft({ ...draft, empresa: v })}
            disabled={!unlocked}
            options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Fecha</span>
            <CustomDatePicker value={draft.fecha} onChange={(v) => setDraft({ ...draft, fecha: v })} disabled={!unlocked} />
          </label>
          <label className="field">
            <span>Hora</span>
            <input type="time" value={draft.hora} onChange={(e) => setDraft({ ...draft, hora: e.target.value })} disabled={!unlocked} />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Red social</span>
            <CustomSelect
              value={draft.redSocial}
              onChange={(v) => setDraft({ ...draft, redSocial: v })}
              disabled={!unlocked}
              options={REDES.map((r) => ({ value: r.name, label: r.name, icon: r.icon, color: r.color }))}
            />
          </label>
          <label className="field">
            <span>Formato</span>
            <CustomSelect value={draft.formato} onChange={(v) => setDraft({ ...draft, formato: v })} disabled={!unlocked} options={FORMATOS} />
          </label>
        </div>

        <label className="field">
          <span>Título indicativo</span>
          <input value={draft.titulo || ""} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} disabled={!unlocked} />
        </label>

        <label className="field">
          <span>Copy (descripción)</span>
          <textarea rows={3} value={draft.copy} onChange={(e) => setDraft({ ...draft, copy: e.target.value })} disabled={!unlocked} />
        </label>

        <AttachmentsBlock
          title="Archivo de diseño"
          files={post.archivos || []}
          onAdd={(f) => onPatch({ archivos: [...(post.archivos || []), f] })}
          onRemove={(id) => onPatch({ archivos: (post.archivos || []).filter((f) => f.id !== id) })}
          driveConnected={driveConnected}
          driveFolderPath={`${draft.empresa} / Planificación`}
          driveOnly
        />
        </LockGate>

        {unlocked && (
        <div className="modal-footer modal-footer-row">
          {!confirmDelete ? (
            <>
              <button className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Eliminar publicación</button>
              <button className="btn-primary save-draft-btn" type="button" onClick={saveDraft} disabled={!dirty}>
                <CheckCircle2 size={14} /> Guardar cambios
              </button>
            </>
          ) : (
            <div className="confirm-row">
              <span><AlertTriangle size={13} /> ¿Enviar a la papelera?</span>
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
