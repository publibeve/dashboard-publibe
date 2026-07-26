import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Paperclip,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  FolderKanban,
} from "lucide-react";
import { fileKind, uid } from "../../utils/helpers";
import { ensureZohoFolderPath, uploadZohoFile, zohoConfigured, zohoConnected, fetchZohoFileBlobUrl, trashZohoFile, startZohoAuth } from "../../services/zoho.service";
import { ImagePreviewModal } from "./ImagePreviewModal";

// Caché de miniaturas por sesión (driveId -> blob URL): cada imagen de Zoho se
// descarga UNA vez por pestaña, no cada vez que se abre el modal.
const zohoThumbCache = new Map();

function ZohoThumb({ file }) {
  const [src, setSrc] = useState(zohoThumbCache.get(file.driveId) || "");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (src || failed || !file.driveId || !zohoConnected()) return;
    let alive = true;
    fetchZohoFileBlobUrl(file.driveId)
      .then((url) => { zohoThumbCache.set(file.driveId, url); if (alive) setSrc(url); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [src, failed, file.driveId]);
  if (!src) return null; // mientras carga (o si falló / no hay sesión) se muestra el ícono normal
  return <img className="file-thumb" src={src} alt={file.nombre} />;
}

export function AttachmentsBlock({ files, onAdd, onRemove, onPreviewImage, driveConnected, driveFolderPath, title, driveOnly }) {
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingName, setUploadingName] = useState("");
  const [driveError, setDriveError] = useState("");
  const [internalPreview, setInternalPreview] = useState(null);
  const fileInputRef = useRef(null);

  function addLink() {
    if (!fileName.trim() || !fileUrl.trim()) return;
    onAdd({ id: uid(), nombre: fileName.trim(), url: fileUrl.trim(), origen: "link" });
    setFileName(""); setFileUrl("");
  }
  async function handlePreview(f) {
    // Archivos de Zoho: el permalink es una página protegida, no la imagen —
    // se descarga con el token y se muestra el blob local en el modal.
    if (f.origen === "drive" && f.driveId) {
      try {
        const blobUrl = f.driveId && zohoThumbCache.has(f.driveId) ? zohoThumbCache.get(f.driveId) : await fetchZohoFileBlobUrl(f.driveId);
        if (f.driveId) zohoThumbCache.set(f.driveId, blobUrl);
        const target = { ...f, url: blobUrl };
        if (onPreviewImage) onPreviewImage(target); else setInternalPreview(target);
      } catch (e) {
        // Si la descarga falla (sesión vencida, permisos), se abre el enlace
        // de WorkDrive en otra pestaña, que tiene su propio visor.
        window.open(f.url, "_blank", "noopener");
      }
      return;
    }
    if (onPreviewImage) onPreviewImage(f); else setInternalPreview(f);
  }

  async function handleRemove(f) {
    if (f.origen === "drive" && f.driveId) {
      const ok = window.confirm(`¿Eliminar "${f.nombre}" del registro y también de Zoho WorkDrive?\n(En Zoho va a la papelera, se puede recuperar desde ahí.)`);
      if (!ok) return;
      try {
        await trashZohoFile(f.driveId);
      } catch (e) {
        setDriveError((e && e.message ? e.message : String(e)) + " — el adjunto no se quitó del registro para que no queden desincronizados.");
        return; // si Zoho falló, NO se borra localmente: mejor consistente que a medias
      }
    }
    onRemove(f.id);
  }

  async function handleFilesChosen(ev) {
    const files = Array.from(ev.target.files || []);
    ev.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!files.length) return;
    setDriveError("");
    setUploading(true);
    try {
      // La ruta viene como "Empresa / Creativos" — se normaliza a segmentos.
      const path = String(driveFolderPath || "Otros").split("/").map((s) => s.trim()).filter(Boolean).join("/");
      const folderId = await ensureZohoFolderPath(path);
      for (const file of files) {
        setUploadingName(file.name);
        setUploadProgress(0);
        const up = await uploadZohoFile(folderId, file, (p) => setUploadProgress(p));
        onAdd({ id: uid(), nombre: up.nombre, url: up.url, origen: "drive", driveId: up.driveId });
      }
    } catch (e) {
      setDriveError(e && e.message ? e.message : String(e));
    } finally {
      setUploading(false);
      setUploadingName("");
      setUploadProgress(0);
    }
  }

  return (
    <div className="detail-block">
      <h4><Paperclip size={13} /> {title || "Adjuntos"}</h4>
      <div className="file-list">
        {(files || []).length === 0 && <div className="hint">Aún no hay archivos vinculados.</div>}
        {(files || []).map((f) => {
          const k = fileKind(f.nombre);
          const KIcon = k.icon;
          const isImage = k.icon === ImageIcon && (f.url || f.driveId);
          return (
            <div className="file-row" key={f.id}>
              {isImage && f.origen === "drive" ? (
                <button type="button" className="file-kind file-kind-btn" style={{ color: k.color }} onClick={() => handlePreview(f)} title="Ver imagen"><ZohoThumb file={f} /><KIcon size={14} style={zohoThumbCache.has(f.driveId) ? { display: "none" } : undefined} /></button>
              ) : isImage ? (
                <button type="button" className="file-kind file-kind-btn" style={{ color: k.color }} onClick={() => handlePreview(f)} title="Ver imagen"><KIcon size={14} /></button>
              ) : (
                <span className="file-kind" style={{ color: k.color }}><KIcon size={14} /></span>
              )}
              {isImage ? (
                <button type="button" className="file-name file-name-btn" onClick={() => handlePreview(f)}>{f.nombre}</button>
              ) : (
                <span className="file-name">{f.nombre}</span>
              )}
              {f.origen === "drive" && <span className="file-drive-tag" title="Vista previa: se guardaría en Google Drive"><FolderKanban size={11} /> Drive</span>}
              {f.url && <a className="file-open" href={f.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a>}
              <button className="icon-btn subtle" onClick={() => handleRemove(f)}><Trash2 size={13} /></button>
            </div>
          );
        })}
      </div>

      {driveConnected ? (
        <div className="add-file add-file-drive">
          {driveFolderPath && <span className="hint drive-target-hint"><FolderKanban size={12} /> Se guardará en: <b>{driveFolderPath}</b></span>}
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFilesChosen} />
          {zohoConfigured() && !zohoConnected() ? (
            <button type="button" className="btn-secondary" onClick={() => { try { startZohoAuth(); } catch (e) { setDriveError(e.message); } }}>
              <FolderKanban size={13} /> Conectar mi cuenta de Zoho para subir
            </button>
          ) : (
            <button
              type="button" className="btn-secondary"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={uploading || !zohoConfigured()}
              title={!zohoConfigured() ? "Faltan las credenciales de Zoho (ver Administrativo)" : ""}
            >
              <FolderKanban size={13} /> {uploading ? "Subiendo…" : "Subir a Zoho Drive"}
            </button>
          )}
          {uploading && (
            <div className="hint" style={{ width: "100%" }}>
              {uploadingName} — {uploadProgress}%
              <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginTop: 4 }}>
                <div style={{ height: 4, width: `${uploadProgress}%`, background: "var(--primary)", borderRadius: 2, transition: "width .2s" }} />
              </div>
            </div>
          )}
          {driveError && <span className="hint" style={{ color: "var(--accent)" }}>{driveError}</span>}
        </div>
      ) : driveOnly ? (
        <div className="hint drive-hint drive-hint-waiting">
          <FolderKanban size={12} /> Este espacio queda listo para cuando se conecte Google Drive en Administrativo{driveFolderPath ? ` (se guardará en ${driveFolderPath})` : ""}.
        </div>
      ) : (
        <>
          <div className="add-file">
            <input placeholder="Nombre (ej: portada.psd)" value={fileName} onChange={(e) => setFileName(e.target.value)} />
            <input placeholder="Enlace del archivo" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
            <button className="btn-secondary" onClick={addLink}><LinkIcon size={13} /> Vincular</button>
          </div>
          <div className="hint drive-hint">
            <FolderKanban size={12} /> Conecta Google Drive en Administrativo para subir archivos directo a la carpeta{driveFolderPath ? ` de ${driveFolderPath}` : ""}.
          </div>
        </>
      )}
      {internalPreview && (
        <ImagePreviewModal file={internalPreview} onClose={() => setInternalPreview(null)} />
      )}
    </div>
  );
}
