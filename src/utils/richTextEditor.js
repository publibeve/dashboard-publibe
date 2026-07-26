
export function handleNoteImagePaste(e, bodyRef, markDirty) {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type && item.type.indexOf("image/") === 0) {
      e.preventDefault();
      const blob = item.getAsFile();
      if (!blob) continue;
      const reader = new FileReader();
      reader.onload = () => {
        if (bodyRef.current) bodyRef.current.focus();
        document.execCommand("insertHTML", false, `<img src="${reader.result}" class="note-img" alt="Imagen pegada" />`);
        markDirty();
      };
      reader.readAsDataURL(blob);
      return;
    }
  }
}

export function handleNoteImageClick(e, onImageMenu) {
  if (e.target && e.target.tagName === "IMG") {
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    onImageMenu({ src: e.target.src, el: e.target, x: rect.left + rect.width / 2, y: rect.bottom + 6 });
    return true;
  }
  return false;
}

export function checklistLineHTML(text) {
  const safe = (text || "").replace(/</g, "&lt;");
  return `<div class="note-check-line" data-checked="false"><span class="note-check-box" contenteditable="false" data-checked="false"></span><span class="note-check-text-run">${safe || "\u200b"}</span></div>`;
}

export function itemsToChecklistHTML(items) {
  return (items || [])
    .map((it) => `<div class="note-check-line" data-checked="${it.marcado ? "true" : "false"}"><span class="note-check-box" contenteditable="false" data-checked="${it.marcado ? "true" : "false"}"></span><span class="note-check-text-run">${(it.texto || "").replace(/</g, "&lt;") || "\u200b"}</span></div>`)
    .join("");
}

export function insertChecklistLine(bodyRef, markDirty) {
  if (!bodyRef.current) return;
  bodyRef.current.focus();
  document.execCommand("insertHTML", false, checklistLineHTML(""));
  markDirty();
}

export function handleCheckLineClick(e, markDirty) {
  if (e.target && e.target.classList && e.target.classList.contains("note-check-box")) {
    const line = e.target.closest(".note-check-line");
    if (line) {
      const next = e.target.getAttribute("data-checked") !== "true";
      e.target.setAttribute("data-checked", next ? "true" : "false");
      line.setAttribute("data-checked", next ? "true" : "false");
      markDirty();
    }
    return true;
  }
  return false;
}

export function handleRichLinkClick(e) {
  const a = e.target && e.target.closest && e.target.closest("a[href]");
  if (!a) return false;
  e.preventDefault();
  window.open(a.href, "_blank", "noopener,noreferrer");
  return true;
}

export function markLinksOpenInNewTab(root) {
  if (!root) return;
  root.querySelectorAll("a[href]").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
    a.title = "Se abrirá en una pestaña nueva";
  });
}

export function wrapPendingLinkHighlight(range) {
  if (!range || range.collapsed) return null;
  const span = document.createElement("span");
  span.className = "rt-pending-link";
  try {
    range.surroundContents(span);
  } catch (e) {
    // La selección cruza el límite de una etiqueta (p.ej. abarca la mitad de un <b>) — se
    // extrae el contenido y se reinserta ya envuelto, en vez de fallar.
    const content = range.extractContents();
    span.appendChild(content);
    range.insertNode(span);
  }
  return span;
}

export function unwrapPendingLinkHighlight(span) {
  if (!span || !span.parentNode) return;
  const parent = span.parentNode;
  while (span.firstChild) parent.insertBefore(span.firstChild, span);
  parent.removeChild(span);
  parent.normalize();
}

export function cleanChecklistHtml(html) {
  if (!html || html.indexOf("note-check-line") === -1) return html;
  try {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    temp.querySelectorAll(".note-check-line").forEach((line) => {
      let run = line.querySelector(".note-check-text-run");
      if (!run) {
        run = document.createElement("span");
        run.className = "note-check-text-run";
        line.appendChild(run);
      }
      // Cualquier contenido que haya quedado suelto en la línea (fuera del texto de la casilla) se reintegra al run.
      Array.from(line.childNodes).forEach((node) => {
        if (node === run) return;
        if (node.nodeType === 1 && node.classList && node.classList.contains("note-check-box")) return;
        run.appendChild(node);
      });
      if (!run.textContent.trim()) run.innerHTML = "\u200b";
      // Sincroniza el estado marcado/desmarcado entre la casilla y la línea, por si quedaron desalineados.
      const box = line.querySelector(".note-check-box");
      const checked = box && box.getAttribute("data-checked") === "true";
      line.setAttribute("data-checked", checked ? "true" : "false");
      if (box) box.setAttribute("data-checked", checked ? "true" : "false");
    });
    return temp.innerHTML;
  } catch (e) {
    return html;
  }
}

export function handleChecklistEnterKey(e, markDirty) {
  if (e.key !== "Enter" || e.shiftKey) return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const anchor = sel.anchorNode;
  const line = anchor && (anchor.nodeType === 1 ? anchor.closest(".note-check-line") : anchor.parentElement && anchor.parentElement.closest(".note-check-line"));
  if (!line) return false;
  e.preventDefault();
  const textRun = line.querySelector(".note-check-text-run");
  const isEmpty = !textRun || textRun.textContent.replace(/\u200b/g, "").trim() === "";
  if (isEmpty) {
    // Línea vacía: salir de la lista y continuar como texto normal.
    const p = document.createElement("div");
    p.innerHTML = "<br>";
    line.replaceWith(p);
    const range = document.createRange();
    range.setStart(p, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    // Sigue la lista: inserta otra casilla justo después, lista para escribir.
    const newLine = document.createElement("div");
    newLine.className = "note-check-line";
    newLine.setAttribute("data-checked", "false");
    newLine.innerHTML = `<span class="note-check-box" contenteditable="false" data-checked="false"></span><span class="note-check-text-run">\u200b</span>`;
    line.after(newLine);
    const run = newLine.querySelector(".note-check-text-run");
    const range = document.createRange();
    range.setStart(run.firstChild, 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  markDirty();
  return true;
}

export function plainLinesFromHtml(html) {
  const withBreaks = (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|li)>/gi, "\n");
  const div = document.createElement("div");
  div.innerHTML = withBreaks;
  const text = div.textContent || "";
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

export const EDITOR_HISTORY = new WeakMap();

export const EDITOR_HISTORY_TIMERS = new WeakMap();

export const EDITOR_HISTORY_LIMIT = 100;

export function getEditorHistory(el) {
  if (!el) return null;
  let h = EDITOR_HISTORY.get(el);
  if (!h) {
    h = { stack: [el.innerHTML], index: 0 };
    EDITOR_HISTORY.set(el, h);
  }
  return h;
}

export function resetEditorHistory(el) {
  if (!el) return;
  EDITOR_HISTORY.set(el, { stack: [el.innerHTML], index: 0 });
}

export function snapshotEditorHistory(el) {
  if (!el) return;
  const h = getEditorHistory(el);
  const html = el.innerHTML;
  if (h.stack[h.index] === html) return; // sin cambios reales, no duplicar
  h.stack = h.stack.slice(0, h.index + 1); // si hubo un "deshacer" previo, se descarta esa rama
  h.stack.push(html);
  if (h.stack.length > EDITOR_HISTORY_LIMIT) h.stack.shift();
  h.index = h.stack.length - 1;
}

export function snapshotEditorHistoryDebounced(el, delay = 400) {
  if (!el) return;
  clearTimeout(EDITOR_HISTORY_TIMERS.get(el));
  EDITOR_HISTORY_TIMERS.set(el, setTimeout(() => snapshotEditorHistory(el), delay));
}

export function restoreEditorCursorToEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

export function undoEditorHistory(el) {
  if (!el) return;
  clearTimeout(EDITOR_HISTORY_TIMERS.get(el)); // descarta cualquier snapshot pendiente por escritura
  const h = getEditorHistory(el);
  if (h.index <= 0) return;
  h.index -= 1;
  el.innerHTML = h.stack[h.index];
  el.focus();
  restoreEditorCursorToEnd(el);
}

export function redoEditorHistory(el) {
  if (!el) return;
  clearTimeout(EDITOR_HISTORY_TIMERS.get(el));
  const h = getEditorHistory(el);
  if (h.index >= h.stack.length - 1) return;
  h.index += 1;
  el.innerHTML = h.stack[h.index];
  el.focus();
  restoreEditorCursorToEnd(el);
}

export function handleEditorHistoryKeydown(e, el) {
  const mod = e.metaKey || e.ctrlKey;
  if (!mod) return false;
  const k = e.key.toLowerCase();
  if (k === "z" && !e.shiftKey) { e.preventDefault(); undoEditorHistory(el); return true; }
  if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); redoEditorHistory(el); return true; }
  return false;
}

export function handleEditorHistoryBeforeInput(e, el) {
  if (e.inputType === "historyUndo") { e.preventDefault(); undoEditorHistory(el); return true; }
  if (e.inputType === "historyRedo") { e.preventDefault(); redoEditorHistory(el); return true; }
  return false;
}
