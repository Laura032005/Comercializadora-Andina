// Autenticación simulada (VITE_USE_MOCK=true). Devuelve lo mismo que el back-end
// (TokensResponse) para que el resto de la app no note la diferencia.
import { ApiError } from './apiClient';
import { esperar, guardar, leer, siguienteId } from './mockDb';
import { MENSAJES } from '../utils/constantes';

const DURACION_ACCESS_S = 15 * 60;

function tokensDe(u) {
  return {
    accessToken: `mock-access-${u.id}-${Date.now()}`,
    refreshToken: `mock-refresh-${u.id}`,
    expiraEnSegundos: DURACION_ACCESS_S,
    usuario: { id: u.id, correo: u.correo, nombreCompleto: u.nombre, rol: u.rol, estado: 'ACTIVO' },
  };
}

export async function login(correo, contrasena) {
  await esperar(400);
  const c = correo.trim().toLowerCase();
  const u = leer('usuarios').find((x) => x.correo === c && x.password === contrasena && x.activo);
  if (!u) throw new ApiError(401, 'credenciales_invalidas', MENSAJES.CREDENCIALES);
  return tokensDe(u);
}

// El registro público crea clientes (CUSTOMER), igual que el back-end.
export async function registrar({ nombreCompleto, correo, contrasena }) {
  await esperar(400);
  const lista = leer('usuarios');
  const c = correo.trim().toLowerCase();
  if (lista.some((x) => x.correo === c)) {
    throw new ApiError(409, 'correo_existente', MENSAJES.CORREO_EXISTENTE, { correo: MENSAJES.CORREO_EXISTENTE });
  }
  const nuevo = { id: siguienteId(lista), correo: c, password: contrasena, nombre: nombreCompleto.trim(), rol: 'CUSTOMER', activo: true };
  guardar('usuarios', [...lista, nuevo]);
  return tokensDe(nuevo);
}

export async function refrescar(refreshToken) {
  const id = Number(String(refreshToken).replace('mock-refresh-', ''));
  const u = leer('usuarios').find((x) => x.id === id && x.activo);
  if (!u) throw new ApiError(401, 'refresh_invalido', MENSAJES.SESION_EXPIRADA);
  return tokensDe(u);
}

export function errorGoogle() {
  return new ApiError(0, 'solo_back', 'El inicio con Google solo funciona con el back-end real (VITE_USE_MOCK=false).');
}
