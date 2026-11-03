import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { autenticado } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={autenticado ? <Navigate to="/menu" replace /> : <LoginPage />} />
      <Route
        path="/menu"
        element={
          <ProtectedRoute>
            <MenuPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={autenticado ? '/menu' : '/login'} replace />} />
    </Routes>
  );
}
