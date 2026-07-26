import { useState } from "react";
import {
  AlertTriangle,
} from "lucide-react";
import { UserAvatar } from "./Sidebar";

export function LoginScreen({ users, onLogin }) {
  const [selectedId, setSelectedId] = useState(users[0]?.id || "");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const user = users.find((u) => u.id === selectedId);
    if (!user) { setError("Elige tu nombre."); return; }
    if (clave !== user.clave) { setError("Clave incorrecta."); return; }
    onLogin(user.id);
  }

  const selectedUser = users.find((u) => u.id === selectedId);

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div>
            <div className="brand-title login-brand-title">publi<span className="brand-b">B</span>e</div>
            <div className="brand-sub login-brand-sub">agencia gráfica</div>
          </div>
        </div>
        <h2>¿Quién eres?</h2>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}
        <div className="login-user-select-wrapper">
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setError(""); }}
            className="login-user-select"
          >
            <option value="">Selecciona usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          {selectedUser && (
            <div className="login-selected-user">
              <UserAvatar user={selectedUser} />
              <span style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontWeight: 500 }}>
                {selectedUser.nombre}
              </span>
            </div>
          )}
        </div>
        <label className="field">
          <span>Clave</span>
          <input
            type="password" value={clave} autoFocus
            onChange={(e) => setClave(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
        </label>
        <button className="btn-primary full" type="button" onClick={submit}>Entrar</button>
      </div>
      <div className="login-footer">Copyright © 2026 PubliBe Agencia Gráfica. All Rights Reserved.</div>
    </div>
  );
}

export function LoginExitOverlay({ userId, users, exiting }) {
  const user = (users || []).find((u) => u.id === userId);
  return (
    <div className={"login-screen login-transition-overlay" + (exiting ? " login-exit" : "")}>
      <div className="login-card">
        <div className="login-brand">
          <div>
            <div className="brand-title login-brand-title">publi<span className="brand-b">B</span>e</div>
            <div className="brand-sub login-brand-sub">agencia gráfica</div>
          </div>
        </div>
        <h2>¿Quién eres?</h2>
        <div className="login-user-list">
          {user && (
            <div className="login-user-btn login-user-btn-active">
              <UserAvatar user={user} />
              <span style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontWeight: 500 }}>
                {user.nombre}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="login-footer">Copyright © 2026 PubliBe Agencia Gráfica. All Rights Reserved.</div>
    </div>
  );
}
