import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import MenuPage from './pages/MenuPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { RUTAS } from './utils/constantes';

export default function App() {
  const { autenticado } = useAuth();
  const publica = (pagina) => (autenticado ? <Navigate to={RUTAS.MENU} replace /> : pagina);
  return (
    <Routes>
      <Route path={RUTAS.LOGIN} element={publica(<LoginPage />)} />
      <Route path={RUTAS.REGISTRO} element={publica(<RegistroPage />)} />
      <Route path={RUTAS.OAUTH_CALLBACK} element={<OAuthCallbackPage />} />
      <Route
        path={RUTAS.MENU}
        element={
          <ProtectedRoute>
            <MenuPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={autenticado ? RUTAS.MENU : RUTAS.LOGIN} replace />} />
    </Routes>
  );
}
