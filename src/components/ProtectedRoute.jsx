import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccesoDenegadoPage from '../pages/AccesoDenegadoPage';

// Exige sesión activa y, si se indica, uno de los roles permitidos (HU18).
export default function ProtectedRoute({ roles, children }) {
  const { autenticado, tieneRol } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!tieneRol(roles)) {
    return <AccesoDenegadoPage />;
  }
  return children;
}
