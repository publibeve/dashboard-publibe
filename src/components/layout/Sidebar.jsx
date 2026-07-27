import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  History,
  Briefcase,
  LogOut,
} from "lucide-react";
import { SidebarSearchBox } from "../common/GlobalSearch";
import { CLIENTES, PRIMARY_DEFAULT } from "../../utils/constants";
import { initial } from "../../utils/helpers";

export function HeaderUserButton({ currentUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  if (!currentUser) return null;
  const roleLabel = (currentUser?.rolLabel && currentUser.rolLabel.trim())
    || (currentUser?.permisos?.administrativo ? "Administrador" : "Miembro del equipo");
  return (
    <div className="header-user-btn-wrap" ref={ref}>
      <button type="button" className="header-user-btn" onClick={() => setOpen((s) => !s)} title={currentUser.nombre}>
        <UserAvatar user={currentUser} />
      </button>
      {open && (
        <div className="header-user-popover">
          <div className="header-user-popover-info">
            <UserAvatar user={currentUser} />
            <div>
              <span className="header-user-popover-name">{currentUser.nombre}</span>
              <span className="header-user-popover-role">{roleLabel}</span>
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={() => { setOpen(false); onLogout(); }}>
            <LogOut size={13} /> Cambiar de usuario
          </button>
        </div>
      )}
    </div>
  );
}

export function UserAvatar({ user, className, style }) {
  // Si la imagen falla al cargar (URL rota, CORS, lo que sea) — cae sola al
  // círculo con la inicial en vez de quedar vacía. Se resetea el intento de
  // nuevo si cambia la URL (por ejemplo, alguien actualiza su foto), para no
  // quedar pegado en el fallback después de un error viejo.
  const [imgFailed, setImgFailed] = useState(false);
  const avatarUrl = user?.avatarUrl;
  useEffect(() => { setImgFailed(false); }, [avatarUrl]);

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl} alt={user.nombre} className={"avatar-img " + (className || "")} style={style}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <span className={"avatar " + (className || "")} style={{ background: PRIMARY_DEFAULT, ...style }}>
      {initial(user?.nombre)}
    </span>
  );
}

export function Sidebar({ selected, onSelect, counts, collapsed, onToggle, onOpenHistory, onOpenAdmin, adminActive, currentUser, onLogout, onSelectSearchResult, searchData, mobileOpen, onMobileClose }) {
  const roleLabel = (currentUser?.rolLabel && currentUser.rolLabel.trim())
    || (currentUser?.permisos?.administrativo ? "Administrador" : "Miembro del equipo");
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 900 : false));

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth <= 900); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
    {mobileOpen && <div className="sidebar-backdrop" onClick={onMobileClose} />}
    <aside className={"sidebar" + (collapsed ? " collapsed" : "") + (mobileOpen ? " mobile-open" : "")}>
      <div className="sidebar-brand">
        {!collapsed && (
          <div>
            <div className="brand-title brand-title-lg">publi<span className="brand-b">B</span>e</div>
            <div className="brand-sub brand-sub-lg">agencia gráfica</div>
          </div>
        )}
        {/* En desktop colapsado, esto sigue mostrando la "B" (sin tocar, tal
            como pediste). En móvil colapsado, se quita: ahí ya queda la
            flecha de arriba sola, centrada. */}
        {collapsed && !isMobile && <div className="brand-title-collapsed">B</div>}
        {isMobile && (
          <button
            type="button" className="sidebar-subtle-close"
            onClick={() => (collapsed ? onToggle() : onMobileClose())}
            title={collapsed ? "Expandir" : "Cerrar menú"}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <button
        className={"nav-item" + (selected === "__ALL__" ? " nav-active" : "")}
        style={selected === "__ALL__" ? { background: PRIMARY_DEFAULT } : {}}
        onClick={() => onSelect("__ALL__")}
        title="Dashboard general"
      >
        <LayoutGrid size={16} />
        {!collapsed && <span>Dashboard general</span>}
      </button>

      {!collapsed && (
        <div className="sidebar-quick-access">
          <SidebarSearchBox {...searchData} onSelect={onSelectSearchResult} />
        </div>
      )}

      {!collapsed && <div className="nav-label">Clientes</div>}
      <div className="nav-list">
        {CLIENTES.map((c) => {
          const Icon = c.icon;
          const active = selected === c.name;
          return (
            <button
              key={c.name}
              className={"nav-item" + (active ? " nav-active" : "")}
              style={active ? { background: c.color } : {}}
              onClick={() => onSelect(c.name)}
              title={c.name}
            >
              <span className="nav-icon" style={!active ? { color: c.color } : {}}>
                <Icon size={16} />
              </span>
              {!collapsed && <span>{c.name}</span>}
              {!collapsed && counts[c.name] > 0 && <span className="nav-count">{counts[c.name]}</span>}
            </button>
          );
        })}
      </div>

      <div className="sidebar-spacer" />

      {/* En móvil colapsado, este botón se quita: la flecha de arriba (que ya
          pasó a expandir el menú en ese estado) queda como único control.
          En desktop y en el mobile expandido, sigue exactamente igual. */}
      {!(isMobile && collapsed) && (
        <button
          className="collapse-btn"
          onClick={isMobile ? onMobileClose : onToggle}
          title={isMobile ? "Cerrar menú" : (collapsed ? "Expandir" : "Contraer")}
        >
          {isMobile ? <><X size={14} /> Cerrar menú</> : (collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /> Contraer</>)}
        </button>
      )}

      {currentUser && (
        <div className={"sidebar-user-card" + (collapsed ? " sidebar-user-card-collapsed" : "")} title={currentUser.nombre}>
          <UserAvatar user={currentUser} className="sidebar-user-avatar" />
          {!collapsed && (
            <>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{currentUser.nombre}</span>
                <span className="sidebar-user-role">{roleLabel}</span>
              </div>
              <button type="button" className="icon-btn subtle sidebar-logout" onClick={onLogout} title="Cambiar de usuario">
                <LogOut size={13} />
              </button>
            </>
          )}
        </div>
      )}

      <button className="nav-item nav-history" onClick={onOpenHistory} title="Historial">
        <History size={16} />
        {!collapsed && <span>Historial</span>}
      </button>

      <button className={"nav-item nav-admin" + (adminActive ? " nav-active" : "")} onClick={onOpenAdmin} title="Administrativo">
        <Briefcase size={16} />
        {!collapsed && <span>Administrativo</span>}
      </button>
    </aside>
    </>
  );
}
