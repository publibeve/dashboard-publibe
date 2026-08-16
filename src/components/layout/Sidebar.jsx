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
import { initial, ensureSidebarContrast } from "../../utils/helpers";

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
  // Dos motivos por los que una foto de perfil puede no verse: (a) la URL
  // está rota/bloqueada — el navegador dispara onError, ya cubierto; (b) la
  // URL está lenta — el navegador puede tardar 20-30 segundos en darla por
  // vencida, y hasta entonces se ve un círculo vacío sin que onError haga
  // nada. Por eso, además del error, hay un timeout propio: si a los 4
  // segundos no cargó, se muestra el fallback igual — si la imagen termina
  // apareciendo después (login lento, no rota), no se vuelve atrás.
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const avatarUrl = user?.avatarUrl;

  useEffect(() => {
    setImgFailed(false);
    setImgLoaded(false);
    if (!avatarUrl) return;
    const timer = setTimeout(() => {
      setImgLoaded((loaded) => {
        if (!loaded) setImgFailed(true);
        return loaded;
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, [avatarUrl]);

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl} alt={user.nombre} className={"avatar-img " + (className || "")} style={style}
        onLoad={() => setImgLoaded(true)}
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
              <span className="nav-icon" style={!active ? { color: ensureSidebarContrast(c.color) } : {}}>
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
