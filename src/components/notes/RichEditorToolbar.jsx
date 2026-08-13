import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Link as LinkIcon,
  Trash2,
  Check,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  ListChecks,
  Maximize2,
  Pilcrow,
  Highlighter,
  Baseline,
  AlignVerticalSpaceAround,
  MoveHorizontal,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { insertChecklistLine, redoEditorHistory, snapshotEditorHistory, undoEditorHistory, unwrapPendingLinkHighlight, wrapPendingLinkHighlight } from "../../utils/richTextEditor";

export function ImageActionMenu({ menu, onClose, onExpand, onDelete }) {
  const ref = useRef(null);
  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);
  if (!menu) return null;
  return createPortal(
    <div className="note-img-menu" ref={ref} style={{ left: menu.x, top: menu.y }}>
      <button type="button" onClick={onExpand}><Maximize2 size={13} /> Ampliar</button>
      <button type="button" className="note-img-menu-del" onClick={onDelete}><Trash2 size={13} /> Eliminar</button>
    </div>,
    document.body
  );
}

export function MiniRichToolbar({ targetRef, onAfterCommand, forceUp }) {
  const [openPicker, setOpenPicker] = useState(null);
  const [popUp, setPopUp] = useState(false);
  const [popRect, setPopRect] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedRangeRef = useRef(null);
  const pendingSpanRef = useRef(null);
  const prevPickerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (prevPickerRef.current === "link" && openPicker !== "link" && pendingSpanRef.current) {
      unwrapPendingLinkHighlight(pendingSpanRef.current);
      pendingSpanRef.current = null;
    }
    prevPickerRef.current = openPicker;
  }, [openPicker]);

  useEffect(() => {
    if (!openPicker) return;
    function onDocClick(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenPicker(null); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openPicker]);

  // Se ancla desde toda la barra (no solo el ícono del link), tanto para centrar horizontalmente
  // en todo el ancho del chat como para decidir, según el espacio real disponible en pantalla, si
  // el popup abre hacia arriba o hacia abajo — funciona igual de bien pegado abajo del todo (donde
  // escribes) como en medio de la lista (cuando editas un comentario ya enviado).
  useLayoutEffect(() => {
    if (openPicker !== "link" || !wrapRef.current) { setPopUp(false); setPopRect(null); return; }
    const pop = wrapRef.current.querySelector(".rt-link-pop");
    const anchor = wrapRef.current;
    if (pop && anchor) {
      const aRect = anchor.getBoundingClientRect();
      const popWidth = Math.min(pop.offsetWidth || 260, window.innerWidth - 16);
      const popHeight = pop.offsetHeight || 90;
      // La barra de escribir (abajo del todo) siempre abre hacia arriba, tal como ya estaba bien.
      // La de editar un comentario (puede estar en cualquier parte de la lista) decide sola según
      // el espacio real disponible.
      const openUp = forceUp || (aRect.bottom + 6 + popHeight > window.innerHeight - 8 && !(aRect.top - 6 - popHeight < 8));
      setPopUp(openUp);
      const top = openUp ? aRect.top - popHeight - 6 : aRect.bottom + 6;
      const idealLeft = aRect.left + aRect.width / 2 - popWidth / 2;
      const left = Math.min(Math.max(8, idealLeft), window.innerWidth - popWidth - 8);
      setPopRect({ top, left });
    }
  }, [openPicker, forceUp]);

  function run(cmd, value) {
    if (targetRef.current) targetRef.current.focus();
    document.execCommand(cmd, false, value);
    if (onAfterCommand) onAfterCommand();
  }
  function openLinkPicker() {
    if (openPicker === "link") { setOpenPicker(null); return; }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const span = wrapPendingLinkHighlight(sel.getRangeAt(0).cloneRange());
      if (span) {
        pendingSpanRef.current = span;
        const r = document.createRange();
        r.selectNodeContents(span);
        savedRangeRef.current = r;
        setLinkText(span.textContent);
      } else {
        pendingSpanRef.current = null;
        savedRangeRef.current = null;
        setLinkText("");
      }
    } else {
      pendingSpanRef.current = null;
      savedRangeRef.current = null;
      setLinkText("");
    }
    setLinkUrl("");
    setOpenPicker("link");
  }
  function insertLink() {
    const url = linkUrl.trim();
    if (!url || !targetRef.current) return;
    const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const label = linkText.trim();
    const a = document.createElement("a");
    a.href = finalUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = "Se abrirá en una pestaña nueva";
    if (pendingSpanRef.current && pendingSpanRef.current.parentNode) {
      const span = pendingSpanRef.current;
      a.textContent = label || span.textContent || url;
      span.parentNode.replaceChild(a, span);
    } else {
      targetRef.current.focus();
      a.textContent = label || url;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && targetRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(a);
        range.setStartAfter(a);
        range.setEndAfter(a);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        targetRef.current.appendChild(a);
      }
    }
    pendingSpanRef.current = null;
    savedRangeRef.current = null;
    if (onAfterCommand) onAfterCommand();
    setOpenPicker(null);
    setLinkUrl("");
    setLinkText("");
  }

  return (
    <div className="mini-rt-toolbar" ref={wrapRef}>
      <button type="button" title="Negrita" onMouseDown={(e) => { e.preventDefault(); run("bold"); }}><Bold size={13} /></button>
      <button type="button" title="Cursiva" onMouseDown={(e) => { e.preventDefault(); run("italic"); }}><Italic size={13} /></button>
      <button type="button" title="Subrayado" onMouseDown={(e) => { e.preventDefault(); run("underline"); }}><Underline size={13} /></button>
      <div className="mini-rt-picker-wrap">
        <button type="button" title="Insertar hipervínculo" onMouseDown={(e) => { e.preventDefault(); openLinkPicker(); }}>
          <LinkIcon size={13} />
        </button>
        {openPicker === "link" && (
          <div className={"rt-link-pop" + (popUp ? " rt-pop-up" : "")} style={popRect ? { position: "fixed", top: popRect.top, left: popRect.left, transform: "none" } : {}}>
            <input
              type="text" autoFocus placeholder="Texto a mostrar (opcional)" value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } }}
            />
            <div className="rt-link-pop-row">
              <input
                type="text" placeholder="Pega o escribe el link…" value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } }}
              />
              <button type="button" title="Insertar" onMouseDown={(e) => { e.preventDefault(); insertLink(); }} disabled={!linkUrl.trim()}><Check size={14} strokeWidth={3} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function RichToolbar({ targetRef, onAfterCommand, extraButton, onPickerOpenChange }) {
  const [openPicker, setOpenPicker] = useState(null);
  const [popUp, setPopUp] = useState(false);
  const [popRect, setPopRect] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedRangeRef = useRef(null);
  const pendingSpanRef = useRef(null);
  const prevPickerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (onPickerOpenChange) onPickerOpenChange(!!openPicker);
  }, [openPicker, onPickerOpenChange]);

  useEffect(() => {
    // Si el picker del link se cierra sin haber insertado nada (clic afuera, Escape, etc.),
    // se desenvuelve el resaltado temporal para dejar el texto tal como estaba.
    if (prevPickerRef.current === "link" && openPicker !== "link" && pendingSpanRef.current) {
      unwrapPendingLinkHighlight(pendingSpanRef.current);
      pendingSpanRef.current = null;
    }
    prevPickerRef.current = openPicker;
  }, [openPicker]);

  useLayoutEffect(() => {
    if (!openPicker || !wrapRef.current) { setPopUp(false); setPopRect(null); return; }
    const pop = wrapRef.current.querySelector(".rt-color-pop, .rt-option-pop, .rt-link-pop");
    // Se ancla desde el ícono (.rt-color-wrap), que ya está montado y con layout estable,
    // en vez de fiarse de la posición que reporta el propio popup (esa medición podía llegar
    // mal en el primer render y dejaba el botón "Insertar" recortado por el borde de pantalla).
    const anchor = pop && pop.parentElement;
    if (pop && anchor) {
      const aRect = anchor.getBoundingClientRect();
      const popWidth = Math.min(pop.offsetWidth || 260, window.innerWidth - 16);
      const popHeight = pop.offsetHeight || 44;
      const overflowsBottom = aRect.bottom + 6 + popHeight > window.innerHeight - 8;
      setPopUp(overflowsBottom);
      const top = overflowsBottom ? aRect.top - popHeight - 6 : aRect.bottom + 6;
      const idealLeft = aRect.left + aRect.width / 2 - popWidth / 2;
      const left = Math.min(Math.max(8, idealLeft), window.innerWidth - popWidth - 8);
      setPopRect({ top, left });
    }
  }, [openPicker]);

  function openLinkPicker() {
    if (openPicker === "link") { setOpenPicker(null); return; }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      // El texto seleccionado se envuelve en un resaltado temporal (en vez de depender de la
      // selección nativa, que se pierde apenas el foco pasa al campo del link) para que se vea
      // claramente qué texto va a llevar el hipervínculo mientras se completa el cuadro.
      const span = wrapPendingLinkHighlight(sel.getRangeAt(0).cloneRange());
      if (span) {
        pendingSpanRef.current = span;
        const r = document.createRange();
        r.selectNodeContents(span);
        savedRangeRef.current = r;
        setLinkText(span.textContent);
      } else {
        pendingSpanRef.current = null;
        savedRangeRef.current = null;
        setLinkText("");
      }
    } else {
      pendingSpanRef.current = null;
      savedRangeRef.current = null;
      setLinkText("");
    }
    setLinkUrl("");
    setOpenPicker("link");
  }
  function insertLink() {
    const url = linkUrl.trim();
    if (!url || !targetRef.current) return;
    const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const label = linkText.trim();
    const a = document.createElement("a");
    a.href = finalUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = "Se abrirá en una pestaña nueva";
    if (pendingSpanRef.current && pendingSpanRef.current.parentNode) {
      // Había texto seleccionado: se reemplaza el resaltado temporal por el link final,
      // usando el texto a mostrar si lo editaron, o el texto seleccionado original si no.
      const span = pendingSpanRef.current;
      a.textContent = label || span.textContent || url;
      span.parentNode.replaceChild(a, span);
    } else {
      // No había nada seleccionado: se inserta el link en la posición del cursor, con el
      // texto a mostrar que haya escrito (o la URL, si no escribió ninguno) — igual que en
      // el cuadro de "Insertar hipervínculo" de Word.
      targetRef.current.focus();
      a.textContent = label || url;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && targetRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(a);
        range.setStartAfter(a);
        range.setEndAfter(a);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        targetRef.current.appendChild(a);
      }
    }
    pendingSpanRef.current = null;
    savedRangeRef.current = null;
    snapshotEditorHistory(targetRef.current);
    if (onAfterCommand) onAfterCommand();
    setOpenPicker(null);
    setLinkUrl("");
    setLinkText("");
  }

  function run(cmd, value) {
    if (targetRef.current) targetRef.current.focus();
    document.execCommand(cmd, false, value);
    snapshotEditorHistory(targetRef.current);
    if (onAfterCommand) onAfterCommand();
  }
  function applyColor(cmd, color) {
    run(cmd, color);
    setOpenPicker(null);
  }

  function blockElementsInSelection() {
    const root = targetRef.current;
    if (!root) return [];
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return [];
    const range = sel.getRangeAt(0);
    const blocks = Array.from(root.children).filter((child) => range.intersectsNode(child));
    if (blocks.length > 0) return blocks;
    let node = range.commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentElement;
    while (node && node !== root && node.parentElement !== root) node = node.parentElement;
    return node && node !== root ? [node] : [];
  }
  function applyLineHeight(value) {
    if (targetRef.current) targetRef.current.focus();
    const blocks = blockElementsInSelection();
    blocks.forEach((b) => { b.style.lineHeight = value; });
    snapshotEditorHistory(targetRef.current);
    if (onAfterCommand) onAfterCommand();
    setOpenPicker(null);
  }
  function applyLetterSpacing(value) {
    if (targetRef.current) targetRef.current.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.letterSpacing = value;
      try {
        range.surroundContents(span);
      } catch (e) {
        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);
      }
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    } else {
      // Sin selección: aplica al bloque completo donde está el cursor.
      blockElementsInSelection().forEach((b) => { b.style.letterSpacing = value; });
    }
    snapshotEditorHistory(targetRef.current);
    if (onAfterCommand) onAfterCommand();
    setOpenPicker(null);
  }

  useEffect(() => {
    if (!openPicker) return;
    function onDocClick(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenPicker(null); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openPicker]);

  const HIGHLIGHT_COLORS = ["#FEF08A", "#BBF7D0", "#BFDBFE", "#FBCFE8", "#FED7AA"];
  const TEXT_COLORS = ["#1C1C1E", "#C1443C", "#0B84FF", "#2E7D46", "#6B3FA0"];
  const LINE_HEIGHTS = [["1", "Sencillo"], ["1.15", "1.15"], ["1.5", "1.5"], ["2", "Doble"], ["2.5", "2.5"]];
  const LETTER_SPACINGS = [["normal", "Normal"], ["-0.5px", "Estrecho"], ["1px", "Amplio"], ["2px", "Muy amplio"], ["4px", "Extra amplio"]];

  return (
    <div className="rt-toolbar" ref={wrapRef}>
      <button type="button" title="Deshacer" onMouseDown={(e) => { e.preventDefault(); undoEditorHistory(targetRef.current); if (onAfterCommand) onAfterCommand(); }}><Undo2 size={14} /></button>
      <button type="button" title="Rehacer" onMouseDown={(e) => { e.preventDefault(); redoEditorHistory(targetRef.current); if (onAfterCommand) onAfterCommand(); }}><Redo2 size={14} /></button>
      <span className="rt-sep" />
      <button type="button" title="Título (H1)" onMouseDown={(e) => { e.preventDefault(); run("formatBlock", "H1"); }}><Heading1 size={14} /></button>
      <button type="button" title="Subtítulo (H2)" onMouseDown={(e) => { e.preventDefault(); run("formatBlock", "H2"); }}><Heading2 size={14} /></button>
      <button type="button" title="Texto normal" onMouseDown={(e) => { e.preventDefault(); run("formatBlock", "P"); }}><Pilcrow size={14} /></button>
      <span className="rt-sep" />
      <button type="button" title="Negrita" onMouseDown={(e) => { e.preventDefault(); run("bold"); }}><Bold size={14} /></button>
      <button type="button" title="Cursiva" onMouseDown={(e) => { e.preventDefault(); run("italic"); }}><Italic size={14} /></button>
      <button type="button" title="Subrayado" onMouseDown={(e) => { e.preventDefault(); run("underline"); }}><Underline size={14} /></button>
      <span className="rt-sep" />
      <button type="button" title="Alinear a la izquierda" onMouseDown={(e) => { e.preventDefault(); run("justifyLeft"); }}><AlignLeft size={14} /></button>
      <button type="button" title="Centrar" onMouseDown={(e) => { e.preventDefault(); run("justifyCenter"); }}><AlignCenter size={14} /></button>
      <button type="button" title="Alinear a la derecha" onMouseDown={(e) => { e.preventDefault(); run("justifyRight"); }}><AlignRight size={14} /></button>
      <span className="rt-sep" />
      <div className="rt-color-wrap">
        <button type="button" title="Insertar hipervínculo" onMouseDown={(e) => { e.preventDefault(); openLinkPicker(); }}><LinkIcon size={14} /></button>
        {openPicker === "link" && (
          <div className={"rt-link-pop" + (popUp ? " rt-pop-up" : "")} style={popRect ? { position: "fixed", top: popRect.top, left: popRect.left, transform: "none" } : {}}>
            <input
              type="text" autoFocus placeholder="Texto a mostrar (opcional)" value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } }}
            />
            <div className="rt-link-pop-row">
              <input
                type="text" placeholder="Pega o escribe el link…" value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } }}
              />
              <button type="button" title="Insertar" onMouseDown={(e) => { e.preventDefault(); insertLink(); }} disabled={!linkUrl.trim()}><Check size={14} strokeWidth={3} /></button>
            </div>
          </div>
        )}
      </div>
      <div className="rt-color-wrap">
        <button type="button" title="Resaltar" onMouseDown={(e) => { e.preventDefault(); setOpenPicker(openPicker === "highlight" ? null : "highlight"); }}><Highlighter size={14} /></button>
        {openPicker === "highlight" && (
          <div className={"rt-color-pop" + (popUp ? " rt-pop-up" : "")} style={popRect ? { position: "fixed", top: popRect.top, left: popRect.left, transform: "none" } : {}}>
            {HIGHLIGHT_COLORS.map((c) => (
              <button key={c} type="button" className="rt-swatch" style={{ background: c }} onMouseDown={(e) => { e.preventDefault(); applyColor("hiliteColor", c); }} />
            ))}
          </div>
        )}
      </div>
      <div className="rt-color-wrap">
        <button type="button" title="Color de texto" onMouseDown={(e) => { e.preventDefault(); setOpenPicker(openPicker === "color" ? null : "color"); }}><Baseline size={14} /></button>
        {openPicker === "color" && (
          <div className={"rt-color-pop" + (popUp ? " rt-pop-up" : "")} style={popRect ? { position: "fixed", top: popRect.top, left: popRect.left, transform: "none" } : {}}>
            {TEXT_COLORS.map((c) => (
              <button key={c} type="button" className="rt-swatch" style={{ background: c }} onMouseDown={(e) => { e.preventDefault(); applyColor("foreColor", c); }} />
            ))}
          </div>
        )}
      </div>
      <span className="rt-sep" />
      <div className="rt-color-wrap">
        <button type="button" title="Interlineado" onMouseDown={(e) => { e.preventDefault(); setOpenPicker(openPicker === "lineheight" ? null : "lineheight"); }}><AlignVerticalSpaceAround size={14} /></button>
        {openPicker === "lineheight" && (
          <div className={"rt-option-pop" + (popUp ? " rt-pop-up" : "")} style={popRect ? { position: "fixed", top: popRect.top, left: popRect.left, transform: "none" } : {}}>
            {LINE_HEIGHTS.map(([v, label]) => (
              <button key={v} type="button" className="rt-option-item" onMouseDown={(e) => { e.preventDefault(); applyLineHeight(v); }}>{label}</button>
            ))}
          </div>
        )}
      </div>
      <div className="rt-color-wrap">
        <button type="button" title="Interletrado" onMouseDown={(e) => { e.preventDefault(); setOpenPicker(openPicker === "letterspacing" ? null : "letterspacing"); }}><MoveHorizontal size={14} /></button>
        {openPicker === "letterspacing" && (
          <div className={"rt-option-pop" + (popUp ? " rt-pop-up" : "")} style={popRect ? { position: "fixed", top: popRect.top, left: popRect.left, transform: "none" } : {}}>
            {LETTER_SPACINGS.map(([v, label]) => (
              <button key={v} type="button" className="rt-option-item" onMouseDown={(e) => { e.preventDefault(); applyLetterSpacing(v); }}>{label}</button>
            ))}
          </div>
        )}
      </div>
      {extraButton && <span className="rt-sep" />}
      {extraButton}
    </div>
  );
}

export function FloatingSelectionToolbar({ targetRef, onAfterCommand }) {
  const [rect, setRect] = useState(null);
  // Estimación inicial; el panel puede ocupar 1 o 2 filas según cuántos botones entren, así que
  // se corrige apenas se puede medir el tamaño real (ver useLayoutEffect más abajo).
  const [size, setSize] = useState({ width: 268, height: 46 });
  const boxRef = useRef(null);
  const timerRef = useRef(null);

  const pickerOpenRef = useRef(false);

  useEffect(() => {
    function focusIsInsidePanel() {
      return !!(boxRef.current && document.activeElement && boxRef.current.contains(document.activeElement));
    }
    function shouldStayOpen() {
      return pickerOpenRef.current || focusIsInsidePanel();
    }
    function readSelectionRect() {
      // Mientras se interactúa con el propio panel (p.ej. un picker de color/link abierto, o el
      // foco puesto en su campo de texto), no lo recalcules ni lo ocultes — si no, se cierra
      // apenas el foco sale del texto seleccionado.
      if (shouldStayOpen()) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setRect(null); return; }
      const range = sel.getRangeAt(0);
      const anchor = range.commonAncestorContainer;
      const el = targetRef.current;
      if (!el || !el.contains(anchor)) { setRect(null); return; }
      if (boxRef.current && boxRef.current.contains(anchor)) return;
      const r = range.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) { setRect(null); return; }
      setRect(r);
    }
    // El panel solo debe evaluarse una vez la selección quedó definitiva, no mientras cambia.
    // Esto cubre tanto el arrastre con mouse como el arrastre de los "handles" táctiles en
    // móvil/tablet (que no siempre disparan eventos touch sobre el propio texto): mientras la
    // selección se sigue moviendo, "selectionchange" se dispara en cadena y el temporizador se
    // reinicia; solo cuando se queda quieta un instante se calcula la posición y aparece.
    function onSelChange() {
      if (shouldStayOpen()) return;
      setRect(null);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(readSelectionRect, 260);
    }
    document.addEventListener("selectionchange", onSelChange);
    return () => {
      document.removeEventListener("selectionchange", onSelChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [targetRef]);

  // Mide el tamaño real ya renderizado del panel y corrige la estimación antes de pintar
  // (evita que quede mal ubicado o tapando el texto recién seleccionado).
  useLayoutEffect(() => {
    if (rect && boxRef.current) {
      const r = boxRef.current.getBoundingClientRect();
      if (r.width && r.height) {
        setSize((prev) => (prev.width === r.width && prev.height === r.height ? prev : { width: r.width, height: r.height }));
      }
    }
  }, [rect]);

  if (!rect) return null;

  // Prefiere ubicarse arriba de la selección, con un pequeño espacio de separación; si no hay
  // sitio arriba, se coloca debajo — nunca encima del texto seleccionado.
  const GAP = 8;
  const top = rect.top > size.height + GAP + 8
    ? rect.top - size.height - GAP
    : Math.min(rect.bottom + GAP, window.innerHeight - size.height - GAP);
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - size.width - 8);

  // Mismo motivo que ColorPickerPopover/TaskChatPanel: dentro de un modal
  // (que tiene backdrop-filter permanente + transform durante su entrada),
  // este position:fixed quedaba contenido y mal ubicado en vez de flotar
  // sobre toda la pantalla. Portal a document.body lo saca de esa
  // jerarquía — y de paso resuelve lo mismo para cualquier popover anidado
  // que abra RichToolbar (link, color de resaltado, etc.), ya que ahora
  // cuelgan de acá, no del modal.
  return createPortal(
    <div className="rt-floating-toolbar" ref={boxRef} style={{ top, left }}>
      <RichToolbar
        targetRef={targetRef}
        onAfterCommand={onAfterCommand}
        onPickerOpenChange={(open) => { pickerOpenRef.current = open; }}
        extraButton={
          <button type="button" title="Insertar casilla de tarea" onMouseDown={(e) => { e.preventDefault(); insertChecklistLine(targetRef, onAfterCommand); }}>
            <ListChecks size={14} />
          </button>
        }
      />
    </div>,
    document.body
  );
}
