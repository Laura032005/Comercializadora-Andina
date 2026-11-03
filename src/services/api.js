// Cliente HTTP común para todas las peticiones al back-end.
import { authHeader, logout } from './authService';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // Errores por campo que envíe el back: { errors: { campo: 'mensaje' } }
    this.errores = data?.errors || data?.errores || null;
  }
}

const MENSAJES_POR_ESTADO = {
  400: 'Los datos enviados no son válidos.',
  401: 'Tu sesión expiró. Inicia sesión de nuevo.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'La operación entra en conflicto con datos existentes.',
};

function construirUrl(ruta, params) {
  const url = new URL(`${API_URL}${ruta}`);
  if (params) {
    Object.entries(params).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(clave, valor);
      }
    });
  }
  return url.toString();
}

async function leerCuerpo(resp) {
  if (resp.status === 204) return null;
  const tipo = resp.headers.get('content-type') || '';
  if (tipo.includes('application/json')) {
    try {
      return await resp.json();
    } catch {
      return null;
    }
  }
  const texto = await resp.text();
  return texto || null;
}

export async function request(ruta, { method = 'GET', params, body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) Object.assign(headers, authHeader());

  let resp;
  try {
    resp = await fetch(construirUrl(ruta, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Intenta de nuevo.', 0, null);
  }

  const data = await leerCuerpo(resp);

  if (!resp.ok) {
    if (resp.status === 401 && auth) {
      logout();
      window.dispatchEvent(new Event('msv:sesion-expirada'));
    }
    const mensajeServidor =
      data && typeof data === 'object' ? data.message || data.mensaje || data.error : null;
    const mensaje =
      (typeof mensajeServidor === 'string' && mensajeServidor) ||
      MENSAJES_POR_ESTADO[resp.status] ||
      'Ocurrió un error en el servidor. Intenta más tarde.';
    throw new ApiError(mensaje, resp.status, data);
  }

  return data;
}

export const api = {
  get: (ruta, params) => request(ruta, { params }),
  post: (ruta, body) => request(ruta, { method: 'POST', body }),
  put: (ruta, body) => request(ruta, { method: 'PUT', body }),
  patch: (ruta, body) => request(ruta, { method: 'PATCH', body }),
  delete: (ruta) => request(ruta, { method: 'DELETE' }),
};

// Normaliza respuestas paginadas (formato Page de Spring o lista simple).
export function normalizarPagina(data, size) {
  if (Array.isArray(data)) {
    return { items: data, pagina: 0, totalPaginas: 1, totalElementos: data.length, size };
  }
  return {
    items: data?.content ?? data?.items ?? [],
    pagina: data?.number ?? data?.page ?? 0,
    totalPaginas: data?.totalPages ?? 1,
    totalElementos: data?.totalElements ?? data?.total ?? 0,
    size: data?.size ?? size,
  };
}
