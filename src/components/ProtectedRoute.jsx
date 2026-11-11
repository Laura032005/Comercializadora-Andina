import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Sin sesión → login. Con sesión pero sin el rol requerido → aviso de acceso denegado.
export default function ProtectedRoute({ children, roles }) {
  const { autenticado, usuario } = useAuth();
  const location = useLocation();
  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="estado-datos estado-error">
        <h1>Acceso denegado</h1>
        <p>Tu rol ({usuario.rol}) no tiene permiso para entrar a esta sección.</p>
        <Link className="btn" to="/menu">Volver al inicio</Link>
      </div>
    );
  }
  return children;
}
