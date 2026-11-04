import { createContext, useContext } from 'react';
import useSesion from '../hooks/useSesion';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const value = useSesion();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
