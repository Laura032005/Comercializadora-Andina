import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RUTAS } from '../utils/constantes';

export default function ProtectedRoute({ children }) {
  const { autenticado } = useAuth();
  const location = useLocation();
  if (!autenticado) {
    return <Navigate to={RUTAS.LOGIN} replace state={{ from: location }} />;
  }
  return children;
}
