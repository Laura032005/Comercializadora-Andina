// Cliente HTTP de los módulos para el back-end real (solo con VITE_USE_MOCK distinto de true).
// Usa el access token de la sesión y, si vence (401), lo renueva una vez y repite la petición.
import { API_URL } from './config';
import { authHeader, refrescar } from './authService';
import { MENSAJES } from '../utils/constantes';

const PREFIJO = '/api/v1';

async function enviar(ruta, method, body) {
  try {
    return await fetch(`${API_URL}${PREFIJO}${ruta}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(MENSAJES.SIN_CONEXION);
  }
}

export async function http(ruta, { method = 'GET', body } = {}) {
  let resp = await enviar(ruta, method, body);

  if (resp.status === 401) {
    try {
      await refrescar();
      resp = await enviar(ruta, method, body);
    } catch {
      /* no se pudo renovar */
    }
    if (resp.status === 401) {
      window.dispatchEvent(new Event('msv:no-autorizado')); // AuthContext cierra la sesión
      throw new Error(MENSAJES.SESION_EXPIRADA);
    }
  }
  if (resp.status === 403) throw new Error('No tienes permiso para esta acción.');
  if (resp.status === 204) return null;

  let datos = null;
  try {
    datos = await resp.json();
  } catch {
    /* respuesta sin JSON */
  }
  if (!resp.ok) {
    // El back responde ProblemDetail (RFC 9457): { detail, codigo, errores }
    throw new Error(datos?.detail || datos?.mensaje || MENSAJES.ERROR_SERVIDOR);
  }
  return datos;
}

// Arma "?a=1&b=2" ignorando valores vacíos.
export function query(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}
