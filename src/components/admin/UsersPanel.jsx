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
  KeyRound,
} from "lucide-react";
import { Overlay } from "../common/Overlay";
import { UserAvatar } from "../layout/Sidebar";
import { PERMISOS_LIST, PERMISOS_NINGUNO, MODULOS_LIST } from "../../utils/constants";
import { uid } from "../../utils/helpers";
import { sendPasswordReset } from "../../services/auth.service";

export function UsersPanel({ users = [], currentUser, can, onAddUser, onPatchUser, onDeleteUser, requirePerm }) {
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
  const [rolDraft, setRolDraft] = useState(u.rolLabel || "");
  const [resetSending, setResetSending] = useState(false);
  const [resetMsg, setResetMsg] = useState(null); // { ok, text }
  const defaultRol = u.permisos?.administrativo ? "Administrador" : "Miembro del equipo";

  function saveAvatar() {
    onPatchUser(u.id, { avatarUrl: avatarDraft.trim() });
    setEditingAvatar(false);
  }
  function saveInfo() {
    const patch = {};
    if (nombreDraft.trim()) patch.nombre = nombreDraft.trim();
    patch.rolLabel = rolDraft.trim(); // vacío = usar el default (Administrador / Miembro del equipo)
    onPatchUser(u.id, patch);
    setEditingInfo(false);
  }
  async function sendReset() {
    setResetSending(true);
    setResetMsg(null);
    const result = await sendPasswordReset(u.email);
    setResetMsg(result.ok ? { ok: true, text: `Correo enviado a ${u.email}` } : { ok: false, text: result.message });
    setResetSending(false);
    setTimeout(() => setResetMsg(null), 5000);
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
          <button type="button" className="icon-btn subtle" onClick={() => setEditingInfo((e) => !e)} title="Editar nombre">
            <PenTool size={13} />
          </button>
        )}
        {canManage && (
          <button type="button" className="icon-btn subtle" onClick={() => setEditingAvatar((e) => !e)} title="Cambiar foto de perfil">
            <ImageIcon size={13} />
          </button>
        )}
        {canManage && (
          <button type="button" className="icon-btn subtle" onClick={sendReset} disabled={resetSending} title="Enviar correo para resetear la clave">
            <KeyRound size={13} />
          </button>
        )}
        {canManage && (
          <button type="button" className="icon-btn subtle" onClick={onDelete} title="Eliminar usuario">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {resetMsg && (
        <div className={"hint"} style={{ color: resetMsg.ok ? "var(--ok)" : "var(--accent)", marginBottom: 8 }}>
          {resetMsg.ok ? <Check size={12} /> : <AlertTriangle size={12} />} {resetMsg.text}
        </div>
      )}
      {editingInfo && (
        <div className="users-edit-info-box">
          <label className="field">
            <span>Nombre</span>
            <input
              type="text" value={nombreDraft} autoFocus
              onChange={(e) => setNombreDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveInfo(); }}
            />
          </label>
          <label className="field">
            <span>Rol / descripción (debajo del nombre, en la barra lateral)</span>
            <input
              type="text" value={rolDraft} placeholder={defaultRol}
              onChange={(e) => setRolDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveInfo(); }}
            />
          </label>
          <div className="hint">
            La contraseña de inicio de sesión ya no se cambia acá — se gestiona en
            Supabase Authentication (o cada quien la cambia desde su propia sesión).
          </div>
          <div className="users-edit-info-actions">
            <button type="button" className="btn-primary" onClick={saveInfo}>Guardar</button>
            <button type="button" className="btn-secondary" onClick={() => { setEditingInfo(false); setNombreDraft(u.nombre || ""); setRolDraft(u.rolLabel || ""); }}>Cancelar</button>
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

      {/* Acceso a módulos (pestañas) — separado de los permisos de arriba a
          propósito: acá el default es "visible", los permisos de arriba
          son "denegado salvo que se otorgue". Sirve para, por ejemplo,
          restringir Guiones a un usuario que no debería verlo. */}
      <div className="users-modulos-label">Acceso a módulos</div>
      <div className="users-perms-grid">
        {MODULOS_LIST.map((m) => {
          const active = u.modulos ? u.modulos[m.key] !== false : true;
          return (
            <button
              type="button" key={m.key}
              className={"perm-chip" + (active ? " perm-chip-active" : "")}
              disabled={!canManage}
              title={active ? `${u.nombre} puede ver esta pestaña` : `${u.nombre} NO ve esta pestaña`}
              onClick={() => onPatchUser(u.id, { modulos: { ...(u.modulos || {}), [m.key]: !active } })}
            >
              {active ? <Check size={11} /> : <X size={11} />} {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NewUserModal({ onClose, onCreate }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [permisos, setPermisos] = useState({ ...PERMISOS_NINGUNO });
  const [error, setError] = useState("");

  function slugify(nombreCompleto) {
    return nombreCompleto
      .trim().split(/\s+/)[0] // solo el primer nombre, como ceo@publibe.net / designer@publibe.net
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // sin tildes
  }
  function handleNombreChange(v) {
    setNombre(v);
    if (!emailTouched) setEmail(v.trim() ? `${slugify(v)}@publibe.net` : "");
  }

  function submit() {
    if (!nombre.trim()) { setError("Falta el nombre."); return; }
    if (!email.trim()) { setError("Falta el correo."); return; }
    onCreate({ id: uid(), nombre: nombre.trim(), email: email.trim(), avatarUrl: avatarUrl.trim(), permisos });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Nuevo usuario</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
        <div className="hint hint-tip">
          Esto crea el perfil dentro de la app (nombre, permisos, foto). Para que esta
          persona pueda iniciar sesión, además hay que crearla en Supabase Authentication
          con este MISMO correo y una contraseña — es un paso aparte, de 2 minutos, en el
          panel de Supabase (ver DEPLOY.md).
        </div>
        <label className="field">
          <span>Nombre</span>
          <input value={nombre} onChange={(e) => handleNombreChange(e.target.value)} placeholder="Ej: Reinaldo Pérez" autoFocus />
        </label>
        <label className="field">
          <span>Correo</span>
          <input
            type="email" value={email}
            onChange={(e) => { setEmailTouched(true); setEmail(e.target.value); }}
            placeholder="nombre@publibe.net"
          />
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
