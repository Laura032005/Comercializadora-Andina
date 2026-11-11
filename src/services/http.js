// Cliente HTTP para el back-end real (solo se usa con VITE_USE_MOCK=false).
import { API_URL } from './config';
import { authHeader } from './authService';

export async function http(ruta, { method = 'GET', body } = {}) {
  let resp;
  try {
    resp = await fetch(`${API_URL}/api${ruta}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.');
  }

  if (resp.status === 401) {
    // AuthContext escucha este evento y cierra la sesión.
    window.dispatchEvent(new Event('msv:no-autorizado'));
    throw new Error('Tu sesión venció. Vuelve a iniciar sesión.');
  }
  if (resp.status === 403) throw new Error('No tienes permiso para esta acción.');
  if (!resp.ok) {
    let mensaje = '';
    try {
      const cuerpo = await resp.json();
      mensaje = cuerpo?.mensaje || cuerpo?.message || '';
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(mensaje || 'Ocurrió un error en el servidor. Intenta más tarde.');
  }
  if (resp.status === 204) return null;
  return resp.json();
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
