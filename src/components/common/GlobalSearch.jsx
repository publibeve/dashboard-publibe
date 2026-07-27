import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  X,
  Search,
  Tag,
} from "lucide-react";
import { Overlay } from "./Overlay";
import { SEARCH_TYPE_META } from "../../utils/constants";
import { computeGlobalSearchResults, groupSearchResults } from "../../utils/helpers";

export function SidebarSearchBox({ tasks, notes, payments, invoices, posts, tareasGenerales, accesos, canSeeMontos, onSelect, variant }) {
  const [query, setQuery] = useState("");
  const [panelPos, setPanelPos] = useState(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const isHeader = variant === "header";

  const results = useMemo(
    () => computeGlobalSearchResults(query, { tasks, notes, payments, invoices, posts, tareasGenerales, accesos, canSeeMontos }),
    [query, tasks, notes, payments, invoices, posts, tareasGenerales, accesos, canSeeMontos]
  );
  const grouped = useMemo(() => groupSearchResults(results), [results]);

  useLayoutEffect(() => {
    if (!query.trim() || !wrapRef.current) { setPanelPos(null); return; }
    const rect = wrapRef.current.getBoundingClientRect();
    setPanelPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(320, rect.width) });
  }, [query]);

  function pick(r) {
    onSelect(r);
    setQuery("");
    inputRef.current?.blur();
  }

  return (
    <div className={isHeader ? "header-search-wrap" : "sidebar-search-wrap"} ref={wrapRef}>
      <div className={isHeader ? "search header-search-input-row" : "sidebar-quick-btn sidebar-search-input-row"}>
        <Search size={isHeader ? 15 : 14} />
        <input
          ref={inputRef}
          placeholder="Buscar en todo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && <button type="button" className="icon-btn subtle" onClick={() => setQuery("")}><X size={12} /></button>}
        {isHeader && !query && <kbd className="header-search-kbd">Ctrl K</kbd>}
      </div>

      {panelPos && (
        <div className="sidebar-search-dropdown" style={{ position: "fixed", top: panelPos.top, left: panelPos.left, width: panelPos.width }}>
          {results.length === 0 && <div className="hint search-modal-hint">Sin resultados para "{query}".</div>}
          {grouped.map(([type, items]) => {
            const meta = SEARCH_TYPE_META[type] || { label: type, icon: Tag };
            const TypeIcon = meta.icon;
            return (
              <div className="search-group" key={type}>
                <div className="search-group-label"><TypeIcon size={12} /> {meta.label}</div>
                {items.map((r) => (
                  <button type="button" className="search-result-row" key={r.type + r.id} onClick={() => pick(r)}>
                    <span className="search-result-label">{r.label || "(sin título)"}</span>
                    {r.sub && <span className="search-result-sub">{r.sub}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function GlobalSearchModal({ tasks, notes, payments, invoices, posts, tareasGenerales, accesos, canSeeMontos, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(
    () => computeGlobalSearchResults(query, { tasks, notes, payments, invoices, posts, tareasGenerales, accesos, canSeeMontos }),
    [query, tasks, notes, payments, invoices, posts, tareasGenerales, accesos, canSeeMontos]
  );

  const grouped = useMemo(() => groupSearchResults(results), [results]);

  return (
    <Overlay onClose={onClose}>
      <div className="modal small search-modal">
        <div className="search-modal-input-row">
          <Search size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tareas, notas, pagos, facturas, publicaciones…"
          />
          <button type="button" className="icon-btn subtle" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="search-modal-results">
          {!query.trim() && <div className="hint search-modal-hint">Escribe para buscar en todo el estudio — o cierra con Esc.</div>}
          {query.trim() && results.length === 0 && <div className="hint search-modal-hint">Sin resultados para "{query}".</div>}
          {grouped.map(([type, items]) => {
            const meta = SEARCH_TYPE_META[type] || { label: type, icon: Tag };
            const TypeIcon = meta.icon;
            return (
              <div className="search-group" key={type}>
                <div className="search-group-label"><TypeIcon size={12} /> {meta.label}</div>
                {items.map((r) => (
                  <button type="button" className="search-result-row" key={r.type + r.id} onClick={() => onSelect(r)}>
                    <span className="search-result-label">{r.label || "(sin título)"}</span>
                    {r.sub && <span className="search-result-sub">{r.sub}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </Overlay>
  );
}
