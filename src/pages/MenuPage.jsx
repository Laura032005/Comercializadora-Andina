import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Opciones por rol (pantalla temporal hasta tener los módulos reales).
const OPCIONES_POR_ROL = {
  ADMIN: [
    { titulo: 'Usuarios', descripcion: 'Crear, editar y desactivar usuarios.' },
    { titulo: 'Productos', descripcion: 'Catálogo y precios.' },
    { titulo: 'Ventas', descripcion: 'Registro y consulta de ventas.' },
    { titulo: 'Inventario', descripcion: 'Existencias y movimientos.' },
    { titulo: 'Reportes', descripcion: 'Indicadores y reportes generales.' },
  ],
  VENDEDOR: [
    { titulo: 'Nueva venta', descripcion: 'Registrar una venta.' },
    { titulo: 'Mis ventas', descripcion: 'Consultar ventas realizadas.' },
    { titulo: 'Clientes', descripcion: 'Consultar y registrar clientes.' },
  ],
  BODEGA: [
    { titulo: 'Inventario', descripcion: 'Existencias por producto.' },
    { titulo: 'Entradas', descripcion: 'Registrar ingreso de mercancía.' },
    { titulo: 'Despachos', descripcion: 'Preparar pedidos vendidos.' },
  ],
  GERENTE: [
    { titulo: 'Reportes de ventas', descripcion: 'Ventas por periodo y vendedor.' },
    { titulo: 'Inventario', descripcion: 'Resumen de existencias.' },
    { titulo: 'Indicadores', descripcion: 'Metas y desempeño.' },
  ],
};

export default function MenuPage() {
  const { usuario, sesion, logout } = useAuth();
  const navigate = useNavigate();
  const opciones = OPCIONES_POR_ROL[usuario?.rol] ?? [];

  function cerrarSesion() {
    logout();
    navigate('/login', { replace: true });
  }

  const horaExpira = new Date(sesion.expiraEn).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="menu-page">
      <header className="menu-header">
        <div>
          <h1>Bienvenido, {usuario.nombre}</h1>
          <p>
            @{usuario.username} · <span className="badge-rol">{usuario.rol}</span>
          </p>
        </div>
        <button type="button" className="btn btn-secundario" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      <div className="menu-grid">
        {opciones.map((op) => (
          <article key={op.titulo} className="menu-opcion">
            <h3>{op.titulo}</h3>
            <p>{op.descripcion}</p>
          </article>
        ))}
      </div>

      <p className="menu-expira">Tu sesión vence a las {horaExpira}.</p>
    </div>
  );
}
