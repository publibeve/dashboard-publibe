import { useState } from "react";
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

export function AttachmentsBlock({ files, onAdd, onRemove, onPreviewImage, driveConnected, driveFolderPath, title, driveOnly }) {
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [showDriveUpload, setShowDriveUpload] = useState(false);
  const [driveFileName, setDriveFileName] = useState("");

  function addLink() {
    if (!fileName.trim() || !fileUrl.trim()) return;
    onAdd({ id: uid(), nombre: fileName.trim(), url: fileUrl.trim(), origen: "link" });
    setFileName(""); setFileUrl("");
  }
  function addDriveMock() {
    if (!driveFileName.trim()) return;
    onAdd({ id: uid(), nombre: driveFileName.trim(), url: "", origen: "drive" });
    setDriveFileName("");
    setShowDriveUpload(false);
  }

  return (
    <div className="detail-block">
      <h4><Paperclip size={13} /> {title || "Adjuntos"}</h4>
      <div className="file-list">
        {(files || []).length === 0 && <div className="hint">Aún no hay archivos vinculados.</div>}
        {(files || []).map((f) => {
          const k = fileKind(f.nombre);
          const KIcon = k.icon;
          const isImage = k.icon === ImageIcon && f.url;
          return (
            <div className="file-row" key={f.id}>
              {isImage && onPreviewImage ? (
                <button type="button" className="file-kind file-kind-btn" style={{ color: k.color }} onClick={() => onPreviewImage(f)} title="Ver imagen"><KIcon size={14} /></button>
              ) : (
                <span className="file-kind" style={{ color: k.color }}><KIcon size={14} /></span>
              )}
              {isImage && onPreviewImage ? (
                <button type="button" className="file-name file-name-btn" onClick={() => onPreviewImage(f)}>{f.nombre}</button>
              ) : (
                <span className="file-name">{f.nombre}</span>
              )}
              {f.origen === "drive" && <span className="file-drive-tag" title="Vista previa: se guardaría en Google Drive"><FolderKanban size={11} /> Drive</span>}
              {f.url && <a className="file-open" href={f.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a>}
              <button className="icon-btn subtle" onClick={() => onRemove(f.id)}><Trash2 size={13} /></button>
            </div>
          );
        })}
      </div>

      {driveConnected ? (
        showDriveUpload ? (
          <div className="add-file add-file-drive">
            <span className="hint drive-target-hint"><FolderKanban size={12} /> Se guardará en: <b>{driveFolderPath}</b></span>
            <input placeholder="Nombre del archivo…" value={driveFileName} onChange={(e) => setDriveFileName(e.target.value)} autoFocus />
            <button className="btn-primary" onClick={addDriveMock} disabled={!driveFileName.trim()}><Plus size={13} /> Subir</button>
            <button type="button" className="btn-secondary" onClick={() => setShowDriveUpload(false)}>Cancelar</button>
          </div>
        ) : (
          <button type="button" className="btn-secondary" onClick={() => setShowDriveUpload(true)}>
            <FolderKanban size={13} /> Subir a Drive
          </button>
        )
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
    </div>
  );
}
