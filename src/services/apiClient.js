// Cliente HTTP mínimo para el back-end. Traduce los ProblemDetail (RFC 9457) a ApiError.
import { API_URL, MENSAJES } from '../utils/constantes';

export class ApiError extends Error {
  constructor(status, codigo, mensaje, errores = {}) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo; // p. ej. 'correo_existente', 'credenciales_invalidas'
    this.errores = errores; // mapa campo -> mensaje (validación 400)
  }
}

export async function peticion(ruta, { metodo = 'POST', cuerpo, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let resp;
  try {
    resp = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError(0, 'sin_conexion', MENSAJES.SIN_CONEXION);
  }

  if (resp.status === 204) return null;

  let datos = null;
  try {
    datos = await resp.json();
  } catch {
    /* respuesta sin cuerpo JSON */
  }

  if (!resp.ok) {
    throw new ApiError(
      resp.status,
      datos?.codigo ?? 'error',
      datos?.detail ?? MENSAJES.ERROR_SERVIDOR,
      datos?.errores ?? {},
    );
  }
  return datos;
}
