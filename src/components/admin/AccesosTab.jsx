import { useState } from "react";
import {
  X,
  Eye,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Check,
  EyeOff,
  Copy,
} from "lucide-react";
import { CustomSelect } from "../common/CustomSelect";
import { LockGate } from "../common/LockGate";
import { Overlay } from "../common/Overlay";
import { CLIENTES, PLATAFORMAS } from "../../utils/constants";
import { clientMeta, uid } from "../../utils/helpers";

export function AccesoRow({ acceso, onOpen, canReveal }) {
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);
  const cm = clientMeta(acceso.empresa);
  const CmIcon = cm.icon;
  const plataformaLabel = acceso.plataforma === "Otro" ? (acceso.plataformaOtro || "Otro") : acceso.plataforma;
  const revealed = canReveal && showPass;

  function copyClave() {
    if (!canReveal || !acceso.clave) return;
    const text = acceso.clave;
    const showCopied = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
    function fallbackCopy() {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) showCopied();
      } catch (e) { /* no se pudo copiar por ningún método */ }
    }
    // navigator.clipboard suele fallar en silencio dentro de vistas previas
    // en iframe (sin permiso de "clipboard-write"), así que si falla o no
    // existe, se recurre al método clásico con un textarea temporal.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  return (
    <div className="accesos-row">
      <button className="accesos-row-main" onClick={onOpen}>
        <span className="pay-empresa" style={{ color: cm.color }}><CmIcon size={12} />{acceso.empresa}</span>
        <span className="acceso-plataforma">{plataformaLabel}</span>
        <span className="acceso-usuario">{acceso.usuario}</span>
        <span className="acceso-clave">{revealed ? (acceso.clave || "—") : "••••••••"}</span>
      </button>
      <button
        type="button" className="icon-btn subtle"
        onClick={() => canReveal && setShowPass((s) => !s)}
        disabled={!canReveal}
        title={!canReveal ? "Desbloquea primero para revelar claves" : (revealed ? "Ocultar clave" : "Mostrar clave")}
      >
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <div className="acceso-copy-wrap">
        <button
          type="button" className={"icon-btn subtle" + (copied ? " acceso-copied" : "")}
          onClick={copyClave}
          disabled={!canReveal}
          title={!canReveal ? "Desbloquea primero para copiar la clave" : (copied ? "¡Copiada!" : "Copiar clave")}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        {copied && <span className="acceso-copied-badge">Copiado</span>}
      </div>
    </div>
  );
}

export function PlataformaField({ plataforma, plataformaOtro, onChangePlataforma, onChangeOtro, disabled }) {
  return (
    <>
      <label className="field">
        <span>Plataforma</span>
        <CustomSelect value={plataforma} onChange={onChangePlataforma} options={PLATAFORMAS} disabled={disabled} />
      </label>
      {plataforma === "Otro" && (
        <label className="field">
          <span>¿Cuál plataforma?</span>
          <input value={plataformaOtro || ""} onChange={(e) => onChangeOtro(e.target.value)} placeholder="Ej: TikTok, Mailchimp…" disabled={disabled} />
        </label>
      )}
    </>
  );
}

export function NewAccesoModal({ onClose, onCreate }) {
  const [empresa, setEmpresa] = useState("");
  const [plataforma, setPlataforma] = useState(PLATAFORMAS[0]);
  const [plataformaOtro, setPlataformaOtro] = useState("");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  function submit() {
    if (!empresa) { setError("Falta elegir el cliente."); return; }
    if (!usuario.trim()) { setError("Falta el usuario."); return; }
    if (!clave.trim()) { setError("Falta la clave."); return; }
    if (plataforma === "Otro" && !plataformaOtro.trim()) { setError("Especifica cuál es la plataforma."); return; }
    onCreate({ id: uid(), empresa, plataforma, plataformaOtro: plataformaOtro.trim(), usuario: usuario.trim(), clave: clave.trim() });
  }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Nuevo acceso</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

        <label className="field">
          <span>Cliente</span>
          <CustomSelect
            value={empresa} onChange={setEmpresa}
            placeholder="Selecciona un cliente…"
            options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
          />
        </label>

        <PlataformaField plataforma={plataforma} plataformaOtro={plataformaOtro} onChangePlataforma={setPlataforma} onChangeOtro={setPlataformaOtro} />

        <label className="field">
          <span>Usuario</span>
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Ej: transfersmerida.oficial" />
        </label>

        <label className="field">
          <span>Clave</span>
          <div className="pass-field-row">
            <input type={showPass ? "text" : "password"} value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Contraseña" />
            <button type="button" className="icon-btn subtle" onClick={() => setShowPass((s) => !s)}>{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
        </label>

        <button className="btn-primary full" type="button" onClick={submit}>Guardar acceso</button>
      </div>
    </Overlay>
  );
}

export function AccesoModal({ acceso, onClose, onPatch, onDelete, unlocked, onRequestUnlock }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [draft, setDraft] = useState({
    empresa: acceso.empresa, plataforma: acceso.plataforma, plataformaOtro: acceso.plataformaOtro,
    usuario: acceso.usuario, clave: acceso.clave,
  });
  const dirty = Object.keys(draft).some((k) => draft[k] !== acceso[k]);
  function saveDraft() { onPatch(draft); onClose(); }

  return (
    <Overlay onClose={onClose}>
      <div className="modal small">
        <div className="modal-head">
          <h3>Editar acceso</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <LockGate unlocked={unlocked} onRequestUnlock={onRequestUnlock}>
          <label className="field">
            <span>Cliente</span>
            <CustomSelect
              value={draft.empresa} onChange={(v) => setDraft({ ...draft, empresa: v })} disabled={!unlocked}
              options={CLIENTES.map((c) => ({ value: c.name, label: c.name, icon: c.icon, color: c.color }))}
            />
          </label>

          <PlataformaField
            plataforma={draft.plataforma} plataformaOtro={draft.plataformaOtro} disabled={!unlocked}
            onChangePlataforma={(v) => setDraft({ ...draft, plataforma: v })}
            onChangeOtro={(v) => setDraft({ ...draft, plataformaOtro: v })}
          />

          <label className="field">
            <span>Usuario</span>
            <input value={draft.usuario} onChange={(e) => setDraft({ ...draft, usuario: e.target.value })} disabled={!unlocked} />
          </label>

          <label className="field">
            <span>Clave</span>
            <div className="pass-field-row">
              <input type={showPass ? "text" : "password"} value={draft.clave} onChange={(e) => setDraft({ ...draft, clave: e.target.value })} disabled={!unlocked} />
              <button type="button" className="icon-btn subtle" onClick={() => setShowPass((s) => !s)}>{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </label>
        </LockGate>

        {unlocked && (
          <div className="modal-footer modal-footer-row">
            {!confirmDelete ? (
              <>
                <button className="btn-danger-ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Eliminar acceso</button>
                <button className="btn-primary save-draft-btn" type="button" onClick={saveDraft} disabled={!dirty}>
                  <CheckCircle2 size={14} /> Guardar cambios
                </button>
              </>
            ) : (
              <div className="confirm-row">
                <span><AlertTriangle size={13} /> ¿Eliminar definitivamente?</span>
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
