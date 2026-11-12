import { createContext, useContext, useEffect, useMemo } from 'react';
import useSesion from '../hooks/useSesion';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const sesion = useSesion();
  const { logout } = sesion;

  // Si una petición de los módulos recibe 401 y no se pudo renovar el token, se cierra la sesión.
  useEffect(() => {
    const cerrar = () => logout();
    window.addEventListener('msv:no-autorizado', cerrar);
    return () => window.removeEventListener('msv:no-autorizado', cerrar);
  }, [logout]);

  // Los módulos usan `nombre` y `username` (el correo identifica al usuario en ventas y movimientos).
  const usuario = useMemo(
    () =>
      sesion.usuario && {
        ...sesion.usuario,
        nombre: sesion.usuario.nombreCompleto ?? sesion.usuario.nombre,
        username: sesion.usuario.correo,
      },
    [sesion.usuario]
  );

  const value = useMemo(() => ({ ...sesion, usuario }), [sesion, usuario]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
