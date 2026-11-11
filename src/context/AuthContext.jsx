import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => authService.obtenerSesion());

  const logout = useCallback(() => {
    authService.logout();
    setSesion(null);
  }, []);

  const login = useCallback(async (usuario, password) => {
    const nueva = await authService.login(usuario, password);
    setSesion(nueva);
    return nueva;
  }, []);

  // Cierra la sesión automáticamente cuando vence (1 hora).
  useEffect(() => {
    if (!sesion) return undefined;
    const restante = sesion.expiraEn - Date.now();
    if (restante <= 0) {
      logout();
      return undefined;
    }
    const t = setTimeout(logout, restante);
    return () => clearTimeout(t);
  }, [sesion, logout]);

  // Si el back-end responde 401 (token vencido o inválido), se cierra la sesión.
  useEffect(() => {
    window.addEventListener('msv:no-autorizado', logout);
    return () => window.removeEventListener('msv:no-autorizado', logout);
  }, [logout]);

  const value = {
    sesion,
    usuario: sesion?.usuario ?? null,
    autenticado: Boolean(sesion),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
