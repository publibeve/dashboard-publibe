import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * Se muestra en vez del login normal cuando la app arrancó desde el link de
 * "recuperar clave" que manda el correo (ver recoveryMode en useAuth). La
 * sesión que ese link estableció ya es válida — al guardar la clave nueva,
 * se sigue derecho al dashboard, sin pedir un login adicional.
 */
export function ResetPasswordScreen({ onSubmit }) {
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (clave.length < 6) { setError("La clave debe tener al menos 6 caracteres."); return; }
    if (clave !== confirmar) { setError("Las dos claves no coinciden."); return; }
    setError("");
    setSubmitting(true);
    const result = await onSubmit(clave);
    if (!result.ok) { setError(result.message); setSubmitting(false); }
    // Si ok, el componente se desmonta solo (recoveryMode pasa a false).
  }

  return (
    <div className="login-screen login-screen-split">
      <div className="login-panel-color">
        <div className="login-panel-color-logo login-mobile-only">
          publi<span className="login-b-static">B</span>e
          <span className="login-panel-color-logo-sub">agencia gráfica</span>
        </div>
        <div className="login-panel-color-tagline login-desktop-only">
          Elegí tu nueva clave para seguir. <span className="login-color-beyou">Be you.</span>
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
            Elegí tu nueva clave<br />
            <span className="login-beyou">para seguir.</span>
          </div>

          {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

          <label className="field">
            <span>Nueva clave</span>
            <input
              type="password" value={clave} autoFocus
              onChange={(e) => setClave(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Mínimo 6 caracteres"
              disabled={submitting}
            />
          </label>
          <label className="field">
            <span>Repetir clave</span>
            <input
              type="password" value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              disabled={submitting}
            />
          </label>

          <button className="btn-primary full login-submit-btn" type="button" onClick={submit} disabled={submitting}>
            {submitting && <span className="login-spinner" />}
            <span>{submitting ? "Guardando…" : "Guardar y continuar"}</span>
          </button>
          <div className="hint" style={{ marginTop: 14 }}>
            <CheckCircle2 size={12} /> Al guardar, vas a entrar directo al dashboard con tu clave nueva.
          </div>
        </div>
        <div className="login-mobile-copyright">Copyright © 2026 publiBe Agencia Gráfica.<br />All Rights Reserved.</div>
      </div>
    </div>
  );
}
