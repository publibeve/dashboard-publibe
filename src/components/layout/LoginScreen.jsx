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
        {/* Logo: solo en móvil (arriba, panel de color). En desktop este
            panel muestra la frase en su lugar — ver login-desktop-only. */}
        <div className="login-panel-color-logo login-mobile-only">
          publi<span className="login-b-static">B</span>e
          <span className="login-panel-color-logo-sub">agencia gráfica</span>
        </div>
        {/* Frase: solo en desktop, acá. En móvil vive en el panel del
            formulario (ver login-mobile-only más abajo). */}
        <div className="login-panel-color-tagline login-desktop-only">
          Organiza el trabajo siendo tú, <span className="login-color-beyou">Be you.</span>
        </div>
        <div className="login-panel-color-copyright">Copyright © 2026 publiBe Agencia Gráfica. All Rights Reserved.</div>
      </div>

      <div className="login-panel-form">
        <div className="login-form-wrap">
          {/* Logo: solo en desktop, acá arriba del formulario. */}
          <div className="login-form-logo login-desktop-only">
            publi<span className="login-b-gradient">B</span>e
            <span className="login-form-logo-sub">agencia gráfica</span>
          </div>
          {/* Frase: solo en móvil, en dos líneas y más grande. */}
          <div className="login-tagline login-tagline-mobile login-mobile-only">
            Organiza el trabajo siendo tú,<br />
            <span className="login-beyou">Be you.</span>
          </div>

          {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

          <label className="field">
            <span>Correo</span>
            <input
              type="email" value={email} autoFocus
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="tucorreo@publibe.net"
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
 * Réplica CONGELADA del login, superpuesta (fixed) durante el fundido hacia
 * el dashboard. Reproduce el mismo layout condicional (logo/frase según
 * desktop o móvil) para que el traspaso sea invisible al ojo.
 */
export function LoginExitOverlay({ email, exiting }) {
  return (
    <div className={"login-screen login-screen-split login-transition-overlay" + (exiting ? " login-exit" : "")}>
      <div className="login-panel-color">
        <div className="login-panel-color-logo login-mobile-only">
          publi<span className="login-b-static">B</span>e
          <span className="login-panel-color-logo-sub">agencia gráfica</span>
        </div>
        <div className="login-panel-color-tagline login-desktop-only">
          Organiza el trabajo siendo tú, <span className="login-color-beyou">Be you.</span>
        </div>
        <div className="login-panel-color-copyright">Copyright © 2026 publiBe Agencia Gráfica. All Rights Reserved.</div>
      </div>
      <div className="login-panel-form">
        <div className="login-form-wrap">
          <div className="login-form-logo login-desktop-only">
            publi<span className="login-b-gradient">B</span>e
            <span className="login-form-logo-sub">agencia gráfica</span>
          </div>
          <div className="login-tagline login-tagline-mobile login-mobile-only">
            Organiza el trabajo siendo tú,<br />
            <span className="login-beyou">Be you.</span>
          </div>
          <label className="field">
            <span>Correo</span>
            <input type="email" disabled readOnly value={email || ""} placeholder="tucorreo@publibe.net" />
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
