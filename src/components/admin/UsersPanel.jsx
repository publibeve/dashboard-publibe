import { useState } from "react";
import {
  Plus,
  X,
  User,
  PenTool,
  Trash2,
  AlertTriangle,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { UserAvatar } from "../layout/Sidebar";
import { PERMISOS_LIST, PERMISOS_NINGUNO } from "../../utils/constants";
import { uid } from "../../utils/helpers";

export function UsersPanel({ users, currentUser, can, onAddUser, onPatchUser, onDeleteUser, requirePerm }) {
  const [showNewUser, setShowNewUser] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const canManage = can("gestionarUsuarios");

  return (
    <section className="overview-section">
      <div className="overview-section-head admin-section-head">
        <span className="overview-section-title"><User size={15} /> Usuarios y permisos</span>
        <button
          type="button" className="btn-primary"
          onClick={() => requirePerm("gestionarUsuarios", () => setShowNewUser(true))}
        >
          <Plus size={14} /> Agregar usuario
        </button>
      </div>
      {!canManage && (
        <div className="hint hint-tip" style={{ marginBottom: 10 }}>
          Solo puedes ver esta lista — pídele a alguien con el permiso "Gestionar usuarios" que haga cambios aquí.
        </div>
      )}
      <div className="users-list">
        {(users || []).map((u) => (
          <UserRow
            key={u.id} u={u} currentUser={currentUser} canManage={canManage}
            onPatchUser={onPatchUser} onDelete={() => setConfirmDeleteUser(u.id)}
          />
        ))}
      </div>

      {showNewUser && (
        <NewUserModal
          onClose={() => setShowNewUser(false)}
          onCreate={(u) => { onAddUser(u); setShowNewUser(false); }}
        />
      )}

      {confirmDeleteUser && (
        <Overlay onClose={() => setConfirmDeleteUser(null)}>
          <div className="modal small confirm-warning-modal" style={{ maxWidth: 340 }}>
            <div className="modal-head">
              <h3><AlertTriangle size={16} color="#B4432F" /> ¿Eliminar este usuario?</h3>
              <button type="button" className="icon-btn" onClick={() => setConfirmDeleteUser(null)}><X size={16} /></button>
            </div>
            <p className="delete-client-warning">Ya no podrá iniciar sesión. No se puede deshacer.</p>
            <button
              className="btn-danger full" type="button"
              onClick={() => { onDeleteUser(confirmDeleteUser); setConfirmDeleteUser(null); }}
            >
              Sí, eliminarlo
            </button>
          </div>
        </Overlay>
      )}
    </section>
  );
}

export function UserRow({ u, currentUser, canManage, onPatchUser, onDelete }) {
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState(u.avatarUrl || "");
  const [editingInfo, setEditingInfo] = useState(false);
  const [nombreDraft, setNombreDraft] = useState(u.nombre || "");
  const [claveDraft, setClaveDraft] = useState("");

  function saveAvatar() {
    onPatchUser(u.id, { avatarUrl: avatarDraft.trim() });
    setEditingAvatar(false);
  }
  function saveInfo() {
    const patch = {};
    if (nombreDraft.trim()) patch.nombre = nombreDraft.trim();
    if (claveDraft.trim()) patch.clave = claveDraft.trim();
    onPatchUser(u.id, patch);
    setClaveDraft("");
    setEditingInfo(false);
  }

  return (
    <div className="users-row">
      <div className="users-row-head">
        <UserAvatar user={u} className="small" />
        <span className="users-row-name">
          {u.nombre}
          {currentUser && u.id === currentUser.id && <span className="users-row-you">tú</span>}
        </span>
        {canManage && (
          <button type="button" className="icon-btn subtle" onClick={() => setEditingInfo((e) => !e)} title="Editar nombre y clave">
            <PenTool size={13} />
          </button>
        )}
        {canManage && (
          <button type="button" className="icon-btn subtle" onClick={() => setEditingAvatar((e) => !e)} title="Cambiar foto de perfil">
            <ImageIcon size={13} />
          </button>
        )}
        {canManage && (
          <button type="button" className="icon-btn subtle" onClick={onDelete} title="Eliminar usuario">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {editingInfo && (
        <div className="users-edit-info-box">
          <label className="field">
            <span>Nombre</span>
            <input type="text" value={nombreDraft} onChange={(e) => setNombreDraft(e.target.value)} />
          </label>
          <label className="field">
            <span>Nueva clave</span>
            <input
              type="password" value={claveDraft} placeholder="Dejar en blanco para no cambiarla"
              onChange={(e) => setClaveDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveInfo(); }}
            />
          </label>
          <div className="users-edit-info-actions">
            <button type="button" className="btn-primary" onClick={saveInfo}>Guardar</button>
            <button type="button" className="btn-secondary" onClick={() => { setEditingInfo(false); setNombreDraft(u.nombre || ""); setClaveDraft(""); }}>Cancelar</button>
          </div>
        </div>
      )}
      {editingAvatar && (
        <div className="pass-field-row" style={{ marginBottom: 10 }}>
          <input
            type="text" value={avatarDraft} placeholder="Link a una foto (ideal 500×500px)"
            onChange={(e) => setAvatarDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveAvatar(); }}
          />
          <button type="button" className="btn-primary" onClick={saveAvatar}>Guardar</button>
        </div>
      )}
      <div className="users-perms-grid">
        {PERMISOS_LIST.map((p) => {
          const active = !!u.permisos[p.key];
          return (
            <button
              type="button" key={p.key}
              className={"perm-chip" + (active ? " perm-chip-active" : "")}
              disabled={!canManage}
              title={p.desc}
              onClick={() => onPatchUser(u.id, { permisos: { ...u.permisos, [p.key]: !active } })}
            >
              {active ? <Check size={11} /> : <X size={11} />} {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NewUserModal({ onClose, onCreate }) {
  const [nombre, setNombre] = useState("");
  const [clave, setClave] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [permisos, setPermisos] = useState({ ...PERMISOS_NINGUNO });
  const [error, setError] = useState("");

  function submit() {
    if (!nombre.trim()) { setError("Falta el nombre."); return; }
    if (!clave.trim()) { setError("Falta la clave."); return; }
    onCreate({ id: uid(), nombre: nombre.trim(), clave: clave.trim(), avatarUrl: avatarUrl.trim(), permisos });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Nuevo usuario</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
        <label className="field">
          <span>Nombre</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Reinaldo Pérez" autoFocus />
        </label>
        <label className="field">
          <span>Clave</span>
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Clave para iniciar sesión" />
        </label>
        <label className="field">
          <span>Foto de perfil (opcional, link — ideal 500×500px)</span>
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
        </label>
        <div className="field">
          <span>Permisos (puedes cambiarlos después)</span>
          <div className="users-perms-grid">
            {PERMISOS_LIST.map((p) => {
              const active = !!permisos[p.key];
              return (
                <button
                  type="button" key={p.key}
                  className={"perm-chip" + (active ? " perm-chip-active" : "")}
                  title={p.desc}
                  onClick={() => setPermisos({ ...permisos, [p.key]: !active })}
                >
                  {active ? <Check size={11} /> : <X size={11} />} {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <button className="btn-primary full" type="button" onClick={submit}>Crear usuario</button>
      </div>
    </Overlay>
  );
}
