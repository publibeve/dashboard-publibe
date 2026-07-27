import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export function LoginScreen({ onLogin, authError }) {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email.trim()) { setLocalError("Ingresa tu correo."); return; }
    if (!clave) { setLocalError("Ingresa tu clave."); return; }
    setLocalError("");
    setSubmitting(true);
    // La promesa de onLogin no se resuelve hasta que el proceso está
    // COMPLETO de verdad (contraseña verificada + sesión + perfil cargado)
    // — por eso el botón se mantiene en este estado el tiempo real que haga
    // falta, sin un timeout inventado.
    const ok = await onLogin(email.trim(), clave);
    if (!ok) { setSubmitting(false); setClave(""); }
    // Si ok=true, no volvemos a habilitar el botón: la pantalla está a punto
    // de desvanecerse hacia el dashboard.
  }

  const error = localError || authError;

  return (
    <div className="login-screen login-screen-split">
      <div className="login-panel-color">
        <div className="login-panel-color-logo">
          publi<span className="login-b-static">B</span>e
          <span className="login-panel-color-logo-sub">agencia gráfica</span>
        </div>
        <div className="login-panel-color-copyright">Copyright © 2026 publiBe Agencia Gráfica. All Rights Reserved.</div>
      </div>

      <div className="login-panel-form">
        <div className="login-form-wrap">
          <div className="login-tagline">
            Organiza el trabajo siendo tú. <span className="login-beyou">Be you.</span>
          </div>

          {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

          <label className="field">
            <span>Correo</span>
            <input
              type="email" value={email} autoFocus
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="tucorreo@dominio.com"
              disabled={submitting}
            />
          </label>
          <label className="field">
            <span>Clave</span>
            <input
              type="password" value={clave}
              onChange={(e) => setClave(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="••••••••"
              disabled={submitting}
            />
          </label>

          <button className="btn-primary full login-submit-btn" type="button" onClick={submit} disabled={submitting}>
            {submitting && <span className="login-spinner" />}
            <span>{submitting ? "Cargando tu espacio…" : "Entrar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Se muestra superpuesta (fixed, encima de todo) durante el fundido hacia el
 * dashboard, mientras este último ya se está montando debajo. Es una réplica
 * ESTÁTICA del último cuadro visible del login (incluido el botón en estado
 * "Cargando tu espacio…"): si el overlay mostrara otra cosa (por ejemplo, el
 * panel sin formulario), el cambio de contenido se percibía como que "el
 * login reaparecía" un instante antes del fundido. Con la réplica idéntica,
 * el ojo ve UNA sola imagen continua que se desenfoca hacia el dashboard.
 */
export function LoginExitOverlay({ email, exiting }) {
  return (
    <div className={"login-screen login-screen-split login-transition-overlay" + (exiting ? " login-exit" : "")}>
      <div className="login-panel-color">
        <div className="login-panel-color-logo">
          publi<span className="login-b-static">B</span>e
          <span className="login-panel-color-logo-sub">agencia gráfica</span>
        </div>
        <div className="login-panel-color-copyright">Copyright © 2026 publiBe Agencia Gráfica. All Rights Reserved.</div>
      </div>
      <div className="login-panel-form">
        <div className="login-form-wrap">
          <div className="login-tagline">
            Organiza el trabajo siendo tú. <span className="login-beyou">Be you.</span>
          </div>
          <label className="field">
            <span>Correo</span>
            <input type="email" disabled readOnly value={email || ""} placeholder="tucorreo@dominio.com" />
          </label>
          <label className="field">
            <span>Clave</span>
            <input type="password" disabled readOnly value="········" />
          </label>
          <button className="btn-primary full login-submit-btn" type="button" disabled>
            <span className="login-spinner" />
            <span>Cargando tu espacio…</span>
          </button>
        </div>
      </div>
    </div>
  );
}
