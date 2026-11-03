import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MENU, NOMBRE_ROL } from '../config/roles';
import './Layout.css';

export default function Layout() {
  const { usuario, tieneRol, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => setMenuAbierto(false), [location.pathname]);

  const opciones = MENU.filter((op) => tieneRol(op.roles));

  function cerrarSesion() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`app ${menuAbierto ? 'menu-abierto' : ''}`}>
      <aside className="sidebar" aria-label="Menú principal">
        <div className="sidebar-marca">
          <div className="sidebar-logo" aria-hidden="true">CA</div>
          <div>
            <strong>Comercial Andina</strong>
            <span>Sistema de Ventas</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {opciones.map((op) => (
            <NavLink key={op.ruta} to={op.ruta} className="sidebar-link">
              <span className="sidebar-icono" aria-hidden="true">{op.icono}</span>
              {op.texto}
            </NavLink>
          ))}
        </nav>
      </aside>

      {menuAbierto && <div className="sidebar-fondo" onClick={() => setMenuAbierto(false)} />}

      <div className="contenido">
        <header className="topbar">
          <button
            type="button"
            className="btn-menu"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
          >
            ☰
          </button>
          <div className="topbar-usuario">
            <div className="topbar-datos">
              <strong>{usuario?.nombre || usuario?.username}</strong>
              <span>{NOMBRE_ROL[usuario?.rol] || usuario?.rol}</span>
            </div>
            <button type="button" className="btn btn-secundario btn-sm" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="pagina">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
