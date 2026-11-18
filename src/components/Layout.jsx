import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { modulosDeRol, tituloModulo } from '../config/modulos';
import { ROLES } from '../services/catalogos';
import { USE_MOCK as usandoMock } from '../services/config';

// Estructura común de las pantallas internas: menú lateral + contenido.
export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const modulos = modulosDeRol(usuario.rol);

  async function cerrarSesion() {
    await logout();
    navigate('/login', { replace: true });
  }

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="app">
      <aside className={`lateral${menuAbierto ? ' lateral-abierto' : ''}`}>
        <div className="lateral-marca">
          <div className="lateral-logo" aria-hidden="true">CA</div>
          <div>
            <strong>Comercial Andina</strong>
            <span>Sistema de Ventas</span>
          </div>
          <button
            type="button"
            className="lateral-toggle"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-controls="menu-principal"
          >
            Menú
          </button>
        </div>

        <nav id="menu-principal" className="lateral-nav" aria-label="Módulos">
          <NavLink to="/menu" end onClick={cerrarMenu}>
            <span aria-hidden="true">🏠</span> Inicio
          </NavLink>
          {modulos.map((m) => (
            <NavLink key={m.ruta} to={m.ruta} end onClick={cerrarMenu}>
              <span aria-hidden="true">{m.icono}</span> {tituloModulo(m, usuario.rol)}
            </NavLink>
          ))}
        </nav>

        <div className="lateral-usuario">
          <p className="lateral-nombre">{usuario.nombre}</p>
          <p className="lateral-detalle">{usuario.correo} · {ROLES[usuario.rol] ?? usuario.rol}</p>
          {usandoMock && <p className="lateral-detalle">Modo de prueba (datos simulados)</p>}
          <button type="button" className="btn btn-secundario btn-bloque" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
