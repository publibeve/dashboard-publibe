import { useState, useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  AlertTriangle,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export function ImagePreviewModal({ file, onClose }) {
  const [errored, setErrored] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panState = useRef(null);

  function zoomIn() { setZoom((z) => Math.min(4, Math.round((z + 0.25) * 100) / 100)); }
  function zoomOut() {
    setZoom((z) => {
      const next = Math.max(0.5, Math.round((z - 0.25) * 100) / 100);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }
  function onWheel(e) {
    if (errored) return;
    e.preventDefault();
    setZoom((z) => {
      const next = Math.max(0.5, Math.min(4, Math.round((z - e.deltaY * 0.0015) * 100) / 100));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  function startPan(e) {
    if (zoom <= 1) return;
    e.preventDefault();
    panState.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
    setPanning(true);
  }
  useEffect(() => {
    function onMove(e) {
      if (!panState.current) return;
      setPan({
        x: panState.current.startPanX + (e.clientX - panState.current.startX),
        y: panState.current.startPanY + (e.clientY - panState.current.startY),
      });
    }
    function onUp() { panState.current = null; setPanning(false); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  return (
    <div className="overlay img-preview-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="img-preview-box">
        <div className="img-preview-head">
          <span className="img-preview-name"><ImageIcon size={14} /> {file.nombre}</span>
          <div className="img-preview-actions">
            {!errored && (
              <>
                <button className="icon-btn" onClick={zoomOut} title="Alejar" disabled={zoom <= 0.5}><ZoomOut size={15} /></button>
                <span className="img-preview-zoom-level">{Math.round(zoom * 100)}%</span>
                <button className="icon-btn" onClick={zoomIn} title="Acercar" disabled={zoom >= 4}><ZoomIn size={15} /></button>
              </>
            )}
            <a className="icon-btn" href={file.url} target="_blank" rel="noreferrer" title="Abrir en otra pestaña"><ExternalLink size={15} /></a>
            <button className="icon-btn" onClick={onClose} title="Cerrar"><X size={16} /></button>
          </div>
        </div>
        <div className={"img-preview-body" + (zoom > 1 ? " img-preview-pannable" : "") + (panning ? " img-preview-panning" : "")} onWheel={onWheel}>
          {!errored ? (
            <img
              src={file.url} alt={file.nombre} onError={() => setErrored(true)}
              draggable={false}
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: panning ? "none" : "transform .12s ease-out" }}
              onMouseDown={startPan}
              onDoubleClick={() => { setZoom((z) => (z === 1 ? 2 : 1)); setPan({ x: 0, y: 0 }); }}
            />
          ) : (
            <div className="img-preview-error">
              <AlertTriangle size={20} />
              <p>No se pudo cargar la vista previa de esta imagen.</p>
              <a className="btn-secondary" href={file.url} target="_blank" rel="noreferrer">
                <ExternalLink size={13} /> Abrir el enlace directamente
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
