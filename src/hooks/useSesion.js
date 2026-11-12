// Hook que maneja todo el estado de la sesión: login, registro, Google, refresco y logout.
import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import { REFRESCAR_ANTES_MS } from '../utils/constantes';

export default function useSesion() {
  const [sesion, setSesion] = useState(() => authService.obtenerSesion());

  const login = useCallback(async (correo, contrasena) => {
    const nueva = await authService.login(correo, contrasena);
    setSesion(nueva);
    return nueva;
  }, []);

  const registrar = useCallback(async (datos) => {
    const nueva = await authService.registrar(datos);
    setSesion(nueva);
    return nueva;
  }, []);

  const loginConGoogle = useCallback(() => authService.iniciarConGoogle(), []);

  const intercambiarCodigo = useCallback(async (codigo) => {
    const nueva = await authService.intercambiarCodigo(codigo);
    setSesion(nueva);
    return nueva;
  }, []);

  const logout = useCallback(async () => {
    setSesion(null);
    await authService.logout();
  }, []);

  // Renueva el access token (15 min) con el refresh token justo antes de que venza.
  // Si el refresh falla (vencido o revocado) se cierra la sesión.
  useEffect(() => {
    if (!sesion) return undefined;
    let cancelado = false;
    const renovar = () =>
      authService
        .refrescar()
        .then((nueva) => {
          if (!cancelado) setSesion(nueva);
        })
        .catch((err) => {
          // Solo se cierra si el back rechazó el token; un corte de red no cierra la sesión.
          if (!cancelado && err.status === 401) setSesion(null);
        });

    const espera = sesion.expiraEn - Date.now() - REFRESCAR_ANTES_MS;
    if (espera <= 0) {
      renovar();
      return () => {
        cancelado = true;
      };
    }
    const t = setTimeout(renovar, espera);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [sesion]);

  return {
    sesion,
    usuario: sesion?.usuario ?? null,
    autenticado: Boolean(sesion),
    login,
    registrar,
    loginConGoogle,
    intercambiarCodigo,
    logout,
  };
}
