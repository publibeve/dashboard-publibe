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
        <div className="login-user-list">
          {users.map((u) => (
            <button
              type="button" key={u.id}
              className={"login-user-btn" + (selectedId === u.id ? " login-user-btn-active" : "")}
              onClick={() => { setSelectedId(u.id); setError(""); }}
            >
              <UserAvatar user={u} />
              {u.nombre}
            </button>
          ))}
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
              {user.nombre}
            </div>
          )}
        </div>
      </div>
      <div className="login-footer">Copyright © 2026 PubliBe Agencia Gráfica. All Rights Reserved.</div>
    </div>
  );
}
