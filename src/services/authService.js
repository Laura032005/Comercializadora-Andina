// Autenticación contra el back-end (POST /api/auth/login) y manejo de la sesión.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const STORAGE_KEY = 'msv_sesion';
const DURACION_POR_DEFECTO = 3600; // segundos (1 hora)
export const MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos.';

function normalizarRol(rol) {
  return String(rol || '')
    .toUpperCase()
    .replace(/^ROLE_/, '')
    .replace('ADMINISTRADOR', 'ADMIN');
}

function guardarSesion({ token, expiresIn, usuario }) {
  const sesion = {
    token,
    usuario: { ...usuario, rol: normalizarRol(usuario?.rol) },
    expiraEn: Date.now() + (expiresIn || DURACION_POR_DEFECTO) * 1000,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  } catch {
    /* almacenamiento no disponible: la sesión vive solo en memoria */
  }
  return sesion;
}

export async function login(username, password) {
  let resp;
  try {
    resp = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username: username.trim(), password }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.');
  }
  if (resp.status === 400 || resp.status === 401 || resp.status === 403) {
    throw new Error(MENSAJE_CREDENCIALES);
  }
  if (!resp.ok) throw new Error('Ocurrió un error en el servidor. Intenta más tarde.');

  const data = await resp.json();
  if (!data?.token || !data?.usuario) {
    throw new Error('Respuesta inesperada del servidor.');
  }
  return guardarSesion(data);
}

export function logout() {
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
    const sesion = JSON.parse(raw);
    if (!sesion?.token || !sesion?.expiraEn || Date.now() >= sesion.expiraEn) {
      logout();
      return null;
    }
    return sesion;
  } catch {
    return null;
  }
}

// Cabecera Authorization para las demás peticiones al back-end.
export function authHeader() {
  const s = obtenerSesion();
  return s ? { Authorization: `Bearer ${s.token}` } : {};
}
