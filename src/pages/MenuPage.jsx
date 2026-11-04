import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ESTADOS, ROLES, RUTAS } from '../utils/constantes';

// Opciones por rol (pantalla temporal hasta tener los módulos reales).
const OPCIONES_POR_ROL = {
  [ROLES.CUSTOMER]: [
    { titulo: 'Catálogo', descripcion: 'Explora los productos disponibles.' },
    { titulo: 'Mis pedidos', descripcion: 'Consulta tus compras.' },
    { titulo: 'Mi perfil', descripcion: 'Tus datos personales.' },
  ],
  [ROLES.WORKER]: [
    { titulo: 'Ventas', descripcion: 'Registro y consulta de ventas.' },
    { titulo: 'Inventario', descripcion: 'Existencias y movimientos.' },
    { titulo: 'Despachos', descripcion: 'Preparar pedidos vendidos.' },
  ],
};

export default function MenuPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const opciones = OPCIONES_POR_ROL[usuario?.rol] ?? [];

  async function cerrarSesion() {
    await logout();
    navigate(RUTAS.LOGIN, { replace: true });
  }

  return (
    <div className="menu-page">
      <header className="menu-header">
        <div>
          <h1>Bienvenido, {usuario.nombreCompleto}</h1>
          <p>
            {usuario.correo} · <span className="badge-rol">{usuario.rol}</span>
          </p>
        </div>
        <button type="button" className="btn btn-secundario" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      {usuario.estado === ESTADOS.PERFIL_INCOMPLETO && (
        <div className="alerta-aviso" role="status">
          Tu perfil está incompleto (falta dirección y fecha de nacimiento). Podrás completarlo
          próximamente.
        </div>
      )}

      <div className="menu-grid">
        {opciones.map((op) => (
          <article key={op.titulo} className="menu-opcion">
            <h3>{op.titulo}</h3>
            <p>{op.descripcion}</p>
          </article>
        ))}
      </div>

      <p className="menu-expira">Tu sesión se renueva automáticamente mientras uses la aplicación.</p>
    </div>
  );
}
