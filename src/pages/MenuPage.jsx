import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { modulosDeRol, tituloModulo } from '../config/modulos';
import { ROLES } from '../services/catalogos';
import { ESTADOS } from '../utils/constantes';

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
            {usuario.correo} · <span className="badge-rol">{ROLES[usuario.rol] ?? usuario.rol}</span>
          </p>
        </div>
      </header>

      {usuario.estado === ESTADOS.PERFIL_INCOMPLETO && (
        <div className="alerta-aviso" role="status">
          Tu perfil está incompleto (falta dirección y fecha de nacimiento). Podrás completarlo próximamente.
        </div>
      )}

      {modulos.length === 0 ? (
        <div className="panel">
          <p>
            Tu rol (<strong>{usuario.rol}</strong>) todavía no tiene módulos asignados. Los módulos del sistema
            son para Administrador, Vendedor, Bodega, Gerente y Contabilidad.
          </p>
        </div>
      ) : (
        <div className="menu-grid">
          {modulos.map((m) => (
            <Link key={m.ruta} to={m.ruta} className="menu-opcion">
              <span className="menu-icono" aria-hidden="true">{m.icono}</span>
              <h3>{tituloModulo(m, usuario.rol)}</h3>
              <p>{m.descripcion}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
