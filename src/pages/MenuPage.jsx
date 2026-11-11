import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { modulosDeRol, tituloModulo } from '../config/modulos';
import { ROLES } from '../services/catalogos';

// Pantalla de inicio: accesos a los módulos del rol.
export default function MenuPage() {
  const { usuario } = useAuth();
  const modulos = modulosDeRol(usuario.rol);

  return (
    <>
      <header className="pagina-encabezado">
        <div>
          <h1>Bienvenido, {usuario.nombre}</h1>
          <p>
            Rol: <span className="badge-rol">{ROLES[usuario.rol] ?? usuario.rol}</span> · Elige un módulo para empezar.
          </p>
        </div>
      </header>

      <div className="menu-grid">
        {modulos.map((m) => (
          <Link key={m.ruta} to={m.ruta} className="menu-opcion">
            <span className="menu-icono" aria-hidden="true">{m.icono}</span>
            <h3>{tituloModulo(m, usuario.rol)}</h3>
            <p>{m.descripcion}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
