// Servicio de autenticación. Usa usuarios de prueba (mock) o el back-end real según .env.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const STORAGE_KEY = 'msv_sesion';
export const MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos.';
const DURACION_SESION = 3600; // segundos (1 hora)

const USUARIOS_MOCK = [
  { username: 'admin', password: 'admin123', nombre: 'Administrador del sistema', rol: 'ADMIN' },
  { username: 'vendedor', password: 'vendedor123', nombre: 'Vendedor de prueba', rol: 'VENDEDOR' },
  { username: 'bodega', password: 'bodega123', nombre: 'Encargado de bodega', rol: 'BODEGA' },
  { username: 'gerente', password: 'gerente123', nombre: 'Gerente general', rol: 'GERENTE' },
];

async function loginMock(username, password) {
  await new Promise((r) => setTimeout(r, 400)); // simula la red
  const u = USUARIOS_MOCK.find((x) => x.username === username && x.password === password);
  if (!u) throw new Error(MENSAJE_CREDENCIALES);
  return {
    token: `mock-token-${u.username}-${Date.now()}`,
    expiresIn: DURACION_SESION,
    usuario: { username: u.username, nombre: u.nombre, rol: u.rol },
  };
}

async function loginApi(username, password) {
  let resp;
  try {
    resp = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.');
  }
  if (resp.status === 400 || resp.status === 401 || resp.status === 403) {
    throw new Error(MENSAJE_CREDENCIALES);
  }
  if (!resp.ok) throw new Error('Ocurrió un error en el servidor. Intenta más tarde.');
  return resp.json();
}

function guardarSesion({ token, expiresIn, usuario }) {
  const sesion = {
    token,
    usuario,
    expiraEn: Date.now() + (expiresIn || DURACION_SESION) * 1000,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  } catch {
    /* almacenamiento no disponible: la sesión vive solo en memoria */
  }
  return sesion;
}

export async function login(username, password) {
  const user = username.trim();
  const data = USE_MOCK ? await loginMock(user, password) : await loginApi(user, password);
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

// Cabecera para las demás peticiones al back-end.
export function authHeader() {
  const s = obtenerSesion();
  return s ? { Authorization: `Bearer ${s.token}` } : {};
}

export const usandoMock = USE_MOCK;
