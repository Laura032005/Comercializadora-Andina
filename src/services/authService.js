// Servicio de autenticación contra el back-end real (Spring Boot).
import { peticion, ApiError } from './apiClient';
import {
  API_URL,
  ENDPOINTS,
  MENSAJES,
  REFRESH_TTL_MS,
  STORAGE_KEY,
} from '../utils/constantes';

export const MENSAJE_CREDENCIALES = MENSAJES.CREDENCIALES;

// Convierte la respuesta TokensResponse del back en la sesión que guardamos.
function guardarSesion(tokens) {
  const ahora = Date.now();
  const sesion = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    usuario: tokens.usuario,
    expiraEn: ahora + tokens.expiraEnSegundos * 1000, // vence el access token
    refreshExpiraEn: ahora + REFRESH_TTL_MS, // vence el refresh token
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  } catch {
    /* almacenamiento no disponible: la sesión vive solo en memoria */
  }
  return sesion;
}

function borrarSesion() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nada que hacer */
  }
}

export function obtenerSesion() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.accessToken || !s?.refreshToken || Date.now() >= s.refreshExpiraEn) {
      borrarSesion();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export async function login(correo, contrasena) {
  try {
    const tokens = await peticion(ENDPOINTS.INICIAR_SESION, {
      cuerpo: { correo: correo.trim(), contrasena },
    });
    return guardarSesion(tokens);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw new ApiError(401, err.codigo, MENSAJES.CREDENCIALES);
    throw err;
  }
}

export async function registrar({ nombreCompleto, telefono, direccion, fechaNacimiento, correo, contrasena }) {
  const tokens = await peticion(ENDPOINTS.REGISTRAR_CUSTOMER, {
    cuerpo: {
      nombreCompleto: nombreCompleto.trim(),
      telefono: telefono?.trim() || null,
      direccion: direccion.trim(),
      fechaNacimiento,
      correo: correo.trim(),
      contrasena,
    },
  });
  return guardarSesion(tokens);
}

// Navega (no usa fetch) al back, que redirige a Google. Al volver, el back redirige a
// /oauth2/callback?codigo=... y ahí se llama a intercambiarCodigo.
export function iniciarConGoogle() {
  window.location.assign(`${API_URL}${ENDPOINTS.GOOGLE_AUTORIZACION}`);
}

export async function intercambiarCodigo(codigo) {
  const tokens = await peticion(ENDPOINTS.INTERCAMBIAR_CODIGO, { cuerpo: { codigo } });
  return guardarSesion(tokens);
}

// Evita refrescos simultáneos: el refresh token rota y solo se puede usar una vez.
let refrescoEnCurso = null;

export function refrescar() {
  if (refrescoEnCurso) return refrescoEnCurso;
  const actual = obtenerSesion();
  if (!actual) return Promise.reject(new ApiError(401, 'sin_sesion', MENSAJES.SESION_EXPIRADA));
  refrescoEnCurso = peticion(ENDPOINTS.REFRESCAR_TOKEN, { cuerpo: { refreshToken: actual.refreshToken } })
    .then(guardarSesion)
    .catch((err) => {
      if (err instanceof ApiError && err.status === 401) borrarSesion();
      throw err;
    })
    .finally(() => {
      refrescoEnCurso = null;
    });
  return refrescoEnCurso;
}

// Revoca los tokens en el back (si se puede) y siempre limpia la sesión local.
export async function logout() {
  const s = obtenerSesion();
  borrarSesion();
  if (!s) return;
  try {
    await peticion(ENDPOINTS.CERRAR_SESION, {
      token: s.accessToken,
      cuerpo: { refreshToken: s.refreshToken },
    });
  } catch {
    /* si el back no responde igual cerramos la sesión local */
  }
}

// Cabecera para las demás peticiones protegidas del back.
export function authHeader() {
  const s = obtenerSesion();
  return s ? { Authorization: `Bearer ${s.accessToken}` } : {};
}
